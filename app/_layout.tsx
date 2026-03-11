import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./services/notifications";
import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const firestoreUnsubscribe = useRef<Unsubscribe | null>(null);
  const seenNotifications = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      // CRITICAL: Cleanup IMMEDIATELY when user changes
      if (firestoreUnsubscribe.current) {
        try {
          firestoreUnsubscribe.current();
          console.log("Firestore listener cleaned up");
        } catch (error) {
          console.error("Cleanup error:", error);
        }
        firestoreUnsubscribe.current = null;
      }

      // Reset state
      seenNotifications.current.clear();
      isInitialLoad.current = true;

      // ONLY setup listener if user is logged in
      if (user) {
        registerForPushNotificationsAsync(user.uid);

        try {
          const notifQuery = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
          );

          firestoreUnsubscribe.current = onSnapshot(
            notifQuery,
            (snapshot) => {
              // Check if user is still logged in
              if (!auth.currentUser) {
                console.log("User logged out - ignoring snapshot");
                return;
              }

              if (isInitialLoad.current) {
                snapshot.docs.forEach((doc) => {
                  seenNotifications.current.add(doc.id);
                });
                isInitialLoad.current = false;
                return;
              }

              snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                  const notifId = change.doc.id;

                  if (seenNotifications.current.has(notifId)) {
                    return;
                  }

                  seenNotifications.current.add(notifId);
                  const data = change.doc.data();

                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: data.title || "New Notification",
                      body: data.body || "",
                      data: data.data || {},
                      sound: true,
                    },
                    trigger: null,
                  });

                  console.log("Popup shown:", data.title);
                }
              });
            },
            (error) => {
              // Only log if it's NOT a permission error from logout
              if (error.code !== "permission-denied") {
                console.error("Notification listener error:", error);
              }
            },
          );
        } catch (error) {
          console.error("Error setting up listener:", error);
        }
      } else {
        console.log("User logged out - no listener setup");
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped");
      });

    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe.current) {
        try {
          firestoreUnsubscribe.current();
        } catch (error) {
          console.error("Cleanup error on unmount:", error);
        }
      }
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
