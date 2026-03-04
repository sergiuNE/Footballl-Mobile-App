import * as Notifications from "expo-notifications";
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      
    shouldPlaySound: true,       
    shouldSetBadge: true,        
    shouldShowBanner: true,     
    shouldShowList: true,        
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        notificationsEnabled: true,
        updatedAt: new Date(),
      },
      { merge: true }
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
  data?: any
) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists() || !userDoc.data()?.notificationsEnabled) {
      console.warn("⚠️ Notifications not enabled for user:", userId);
      return;
    }

    // Create notification in Firestore (will trigger popup via listener)
    await addDoc(collection(db, "notifications"), {
      userId: userId,
      title: title,
      body: body,
      data: data || {},
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log("Notification created for user:", userId);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}