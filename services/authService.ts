import { auth, db } from "../config/firebase";
import { initializeApp, deleteApp, FirebaseApp } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  getAuth
} from "firebase/auth";
import { doc, setDoc, getDoc, collection } from "firebase/firestore";

export interface MedicalDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  allergens?: string;
  medications?: string;
  bloodGroup?: string;
  role: string;
  createdAt: number;
  documents?: MedicalDocument[];
}

/** 
 * UTILITIES 
 */

const generateUnitId = () => {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `HELP-${digits}`;
};

const generatePasscode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** 
 * ADMIN AUTH 
 */

export const signUpAdmin = async (
  entityName: string,
  entityType: 'hospital' | 'ambulance' | 'police' | 'fire',
  location: { latitude: number; longitude: number }
) => {
  try {
    const unitId = generateUnitId();
    const passcode = generatePasscode();
    const adminEmail = `admin_${unitId}@roadsos.admin`;

    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, passcode);
    const user = userCredential.user;

    const entityData = {
      name: entityName,
      hospitalId: unitId,
      type: entityType,
      location: location,
      passcode: passcode, // Stored for testing purposes
      role: 'admin',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "hospitals", unitId), entityData);
    await setDoc(doc(db, "adminRegistry", user.uid), {
      unitId: unitId,
      role: 'admin'
    });

    return { user, unitId, passcode, error: null };
  } catch (error: any) {
    return { user: null, unitId: null, passcode: null, error: error.message };
  }
};

export const signInAdmin = async (unitId: string, passcode: string) => {
  try {
    const adminEmail = `admin_${unitId}@roadsos.admin`;
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, passcode);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

/** 
 * STAFF ENROLLMENT 
 */

export const enrollStaff = async (
  adminUnitId: string,
  staffData: { name: string; email: string; password: string; role: string }
) => {
  let secondaryApp: FirebaseApp | undefined;
  try {
    const secondaryAppName = `SecondaryApp_${Date.now()}`;
    // Initialize temporary app to prevent admin logout
    secondaryApp = initializeApp(auth.app.options, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      staffData.email, 
      staffData.password
    );
    const staffUser = userCredential.user;

    // Write to Global Registry
    await setDoc(doc(db, "staffRegistry", staffUser.uid), {
      hospitalId: adminUnitId,
      role: staffData.role
    });

    // Write to Hospital Staff Subcollection
    const staffRef = doc(db, "hospitals", adminUnitId, "staff", staffUser.uid);
    await setDoc(staffRef, {
      uid: staffUser.uid,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      createdAt: Date.now()
    });

    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    return { success: true, error: null };
  } catch (error: any) {
    if (secondaryApp) await deleteApp(secondaryApp);
    return { success: false, error: error.message };
  }
};

/** 
 * ORIGINAL CITIZEN & HELPER LOGIC 
 */

export const signUp = async (
  email: string, 
  password: string, 
  profileData: { name: string; allergens: string; medications: string; bloodGroup: string }
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfile = {
      uid: user.uid,
      email: email,
      name: profileData.name,
      allergens: profileData.allergens,
      medications: profileData.medications,
      bloodGroup: profileData.bloodGroup,
      role: 'citizen',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "userDetails", user.uid), userProfile);
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUpHelper = async (
  email: string,
  password: string,
  helperData: { staffName: string; hospitalName: string; hospitalId: string }
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "hospitals", helperData.hospitalId), {
      name: helperData.hospitalName,
      hospitalId: helperData.hospitalId
    }, { merge: true });

    const staffRef = doc(db, "hospitals", helperData.hospitalId, "staff", user.uid);
    await setDoc(staffRef, {
      uid: user.uid,
      email: email,
      name: helperData.staffName,
      role: 'helper',
      createdAt: Date.now()
    });

    await setDoc(doc(db, "staffRegistry", user.uid), {
      hospitalId: helperData.hospitalId,
      role: 'helper'
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};
