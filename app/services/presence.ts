import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

/**
 * Set user as online and update their presence in Firestore
 */
export const setUserOnline = async (userId: string) => {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isOnline: true,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("Error setting user online:", error);
  }
};

/**
 * Set user as offline and update their last seen time
 */
export const setUserOffline = async (userId: string) => {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isOnline: false,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
};

/**
 * Initialize presence tracking for the current user
 * Call this when the app starts or user logs in
 */
export const initializePresence = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  // Set user as online
  await setUserOnline(userId);

  // Set up listener for when user disconnects
  // Note: Firebase doesn't have built-in onDisconnect for Firestore like Realtime Database
  // We'll handle this with app state changes
};

/**
 * Format the last seen time to a readable string
 */
export const formatLastSeen = (lastSeen?: Date): string => {
  if (!lastSeen) return "Never";

  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  return lastSeen.toLocaleDateString();
};
