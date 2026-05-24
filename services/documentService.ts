import { db, storage } from "../config/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MedicalDocument } from "./authService";

/**
 * Uploads a medical document to Firebase Storage and adds metadata to the user's profile.
 */
export const uploadMedicalDocument = async (
  userId: string,
  uri: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; document?: MedicalDocument; error?: string }> => {
  try {
    // 1. Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Upload to Firebase Storage
    const timestamp = Date.now();
    const documentId = `${timestamp}_${Math.random().toString(36).substring(7)}`;
    const storagePath = `user_documents/${userId}/${documentId}_${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    // 3. Create Document Metadata
    const newDocument: MedicalDocument = {
      id: documentId,
      name: fileName,
      url: downloadURL,
      type: mimeType,
      uploadedAt: timestamp,
    };

    // 4. Update User Profile in Firestore
    const userDocRef = doc(db, "userDetails", userId);
    await updateDoc(userDocRef, {
      documents: arrayUnion(newDocument)
    });

    return { success: true, document: newDocument };
  } catch (error: any) {
    console.error("Error uploading medical document:", error);
    return { success: false, error: error.message };
  }
};
