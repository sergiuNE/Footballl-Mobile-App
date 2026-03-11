import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";

export async function registerForPushNotificationsAsync(userId: string) {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        notificationsEnabled: true,
        updatedAt: new Date(),
      },
      { merge: true },
    );
    console.log("Notifications enabled for user");
  } catch (error) {
    console.error("Error enabling notifications:", error);
  }
  return userId;
}

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any,
) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists() || !userDoc.data()?.notificationsEnabled) {
      console.warn("Notifications not enabled for user:", userId);
      return;
    }

    // Create notification with proper data structure
    await addDoc(collection(db, "notifications"), {
      userId: userId,
      title: title,
      body: body,
      data: data || {}, // This includes fromUserId, type, etc.
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log("Notification created for user:", userId);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
