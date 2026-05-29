import { storage } from "../config/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Downloads the user_context.txt from Firebase Storage and caches it locally.
 * Named with userId to support multiple users on the same device.
 */
export const syncUserContextToLocal = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[RAG-Sync] Syncing context for UID: ${userId}...`);
    const storagePath = `user_documents/${userId}/user_description/user_context.txt`;
    const storageRef = ref(storage, storagePath);

    // 1. Get the latest download URL from Firebase
    const downloadURL = await getDownloadURL(storageRef);

    // 2. Define local file path (UID-specific)
    const localUri = `${FileSystem.documentDirectory}${userId}-user_context.txt`;

    // 3. Download and overwrite existing local file
    const downloadResult = await FileSystem.downloadAsync(downloadURL, localUri);

    if (downloadResult.status === 200) {
      console.log(`[RAG-Sync] Context cached successfully at: ${localUri}`);
      return true;
    } else {
      console.warn(`[RAG-Sync] Download completed with non-OK status: ${downloadResult.status}`);
      return false;
    }
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.log(`[RAG-Sync] Remote context file not found. Skipping sync.`);
    } else {
      console.error("[RAG-Sync] Error during context synchronization:", error);
    }
    return false;
  }
};

/**
 * Reads the cached user_context.txt from local device storage.
 * This operation is completely offline.
 */
export const readLocalUserContext = async (userId: string): Promise<string | null> => {
  try {
    const localUri = `${FileSystem.documentDirectory}${userId}-user_context.txt`;

    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      console.log(`[RAG-Offline] No local cache found for UID: ${userId}`);
      return null;
    }

    const content = await FileSystem.readAsStringAsync(localUri);
    console.log(`[RAG-Offline] Local context loaded (Length: ${content.length} chars)`);
    return content;
  } catch (error) {
    console.error("[RAG-Offline] Error reading local context cache:", error);
    return null;
  }
};