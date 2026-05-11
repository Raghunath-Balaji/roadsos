import { db, storage } from "../config/firebase";
import { collection, serverTimestamp, query, where, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface ActiveAlert {
  id: string;
  userId: string;
  severity: AlertSeverity;
  location: LocationData;
  status: 'pending' | 'accepted' | 'resolved';
  timestamp: any;
  helperId?: string | null;
  doctorName?: string | null;
  hospitalName?: string | null;
  acceptedAt?: any;
  additionalDetails?: string;
  imageUrl?: string;
}

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 */
export const uploadAlertImage = async (uri: string, alertId: string, userId: string) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const storageRef = ref(storage, `emergencies/${userId}_${timestamp}.jpg`);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates an alert with additional details and image URL.
 */
export const updateAlertDetails = async (
  alertId: string, 
  userId: string, 
  details?: string, 
  imageUrl?: string
) => {
  try {
    const userAlertRef = doc(db, "userDetails", userId, "Alerts", alertId);
    const liveAlertRef = doc(db, "liveAlerts", alertId);

    const updateData: any = {};
    if (details) updateData.additionalDetails = details;
    if (imageUrl) updateData.imageUrl = imageUrl;
    
    if (Object.keys(updateData).length === 0) return { success: true };

    const batch = writeBatch(db);
    batch.update(userAlertRef, updateData);
    batch.update(liveAlertRef, updateData);

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Error updating alert details:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Creates an emergency alert in both the user's Alerts subcollection
 * and the root 'liveAlerts' collection for efficient querying.
 */
export const createAlert = async (
  userId: string,
  severity: AlertSeverity,
  location: LocationData
) => {
  try {
    // Create references with the same ID for both locations
    const userAlertRef = doc(collection(db, "userDetails", userId, "Alerts"));
    const liveAlertRef = doc(db, "liveAlerts", userAlertRef.id);
    
    const alertData = {
      userId, // Explicitly store userId for root-level querying
      severity,
      location,
      status: 'pending',
      helperId: null,
      timestamp: serverTimestamp(),
    };

    // Use a batch to ensure atomicity across both collections
    const batch = writeBatch(db);
    batch.set(userAlertRef, alertData);
    batch.set(liveAlertRef, alertData);
    
    await batch.commit();

    return { success: true, id: userAlertRef.id };
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Accepts an emergency alert.
 * Updates both the user's alert and the live alert.
 */
export const acceptAlert = async (
  alertId: string,
  userId: string,
  helperId: string,
  doctorName: string,
  hospitalName: string
) => {
  try {
    const userAlertRef = doc(db, "userDetails", userId, "Alerts", alertId);
    const liveAlertRef = doc(db, "liveAlerts", alertId);

    const updateData = {
      status: 'accepted',
      helperId,
      doctorName,
      hospitalName,
      acceptedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.update(userAlertRef, updateData);
    batch.update(liveAlertRef, updateData);

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Error accepting alert:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Marks an emergency as resolved and removes it from live alerts.
 */
export const markAsSaved = async (alertId: string, userId: string) => {
  try {
    const userAlertRef = doc(db, "userDetails", userId, "Alerts", alertId);
    const liveAlertRef = doc(db, "liveAlerts", alertId);

    const batch = writeBatch(db);
    // Update status in user history
    batch.update(userAlertRef, { status: 'resolved', resolvedAt: serverTimestamp() });
    // Remove from live alerts
    batch.delete(liveAlertRef);

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Error resolving alert:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Listens to all active alerts using the optimized root-level collection.
 * Shows only pending alerts for helpers to accept.
 */
export const listenToActiveAlerts = (callback: (alerts: ActiveAlert[]) => void) => {
  const alertsQuery = query(
    collection(db, 'liveAlerts'),
    where('status', '==', 'pending')
  );

  return onSnapshot(alertsQuery, (snapshot) => {
    const alerts = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as ActiveAlert;
    });

    // Client-side sort: newest first
    alerts.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });

    callback(alerts);
  }, (error) => {
    console.error("Error listening to alerts:", error);
  });
};

/**
 * Listens to a specific user's most recent active alert.
 */
export const listenToMyAlert = (userId: string, callback: (alert: ActiveAlert | null) => void) => {
  const alertsQuery = query(
    collection(db, 'liveAlerts'),
    where('userId', '==', userId),
    where('status', 'in', ['pending', 'accepted'])
  );

  return onSnapshot(alertsQuery, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    // Since a user should ideally only have one active alert at a time, we take the most recent
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActiveAlert));

    alerts.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });

    callback(alerts[0]);
  }, (error) => {
    console.error("Error listening to my alert:", error);
  });
};
