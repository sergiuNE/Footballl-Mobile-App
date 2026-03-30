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
import { startPresenceTracking } from "./services/presence";

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
    let stopPresence: null | (() => void | Promise<void>) = null;

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      // cleanup old presence
      if (stopPresence) {
        void stopPresence();
        stopPresence = null;
      }

      // cleanup notifications listener
      if (firestoreUnsubscribe.current) {
        try {
          firestoreUnsubscribe.current();
        } catch {}
        firestoreUnsubscribe.current = null;
      }

      seenNotifications.current.clear();
      isInitialLoad.current = true;

      if (user) {
        // start presence tracking
        stopPresence = startPresenceTracking(user.uid);

        void registerForPushNotificationsAsync(user.uid).catch((e: any) => {
          console.log("push register error:", e?.code, e?.message);
        });

        const notifQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
        );

        firestoreUnsubscribe.current = onSnapshot(
          notifQuery,
          (snapshot) => {
            if (!auth.currentUser) return;

            if (isInitialLoad.current) {
              snapshot.docs.forEach((d) => seenNotifications.current.add(d.id));
              isInitialLoad.current = false;
              return;
            }

            snapshot.docChanges().forEach(async (change) => {
              if (change.type !== "added") return;
              const notifId = change.doc.id;
              if (seenNotifications.current.has(notifId)) return;

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
            });
          },
          (error) => {
            console.log(
              "notifications listener error:",
              error?.code,
              error?.message,
            );
          },
        );
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      authUnsubscribe();

      if (stopPresence) void stopPresence();

      if (firestoreUnsubscribe.current) {
        try {
          firestoreUnsubscribe.current();
        } catch {}
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
