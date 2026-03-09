import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./services/notifications";
import { auth, db } from "../config/firebase";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { setUserOnline, setUserOffline } from "./services/presence";

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const lastNotificationId = useRef<string | null>(null); // Track last seen notification

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Set user online when they log in
        setUserOnline(user.uid);

        registerForPushNotificationsAsync(user.uid);
        
        // Listen for NEW notifications in Firestore
        const notifQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
        );

        const unsubscribeNotifications = onSnapshot(notifQuery, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const notifId = change.doc.id;

              // Skip if this is the first load or same notification
              if (lastNotificationId.current === null) {
                lastNotificationId.current = notifId;
                return;
              }

              if (lastNotificationId.current === notifId) {
                return;
              }

              lastNotificationId.current = notifId;

              // Show popup notification
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: data.title || "New Notification",
                  body: data.body || "",
                  data: data.data || {},
                  sound: true,
                },
                trigger: null, // Show immediately
              });
            }
          });
        });

        return () => unsubscribeNotifications();
      } else {
        // User logged out - presence will be set offline on login
      }
    });

    // Handle app state changes (foreground/background)
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      if (nextAppState === "active") {
        // App came to foreground
        setUserOnline(userId);
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // App went to background
        setUserOffline(userId);
      }
    });

    // Handle notification received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification);
      });

    // Handle notification tapped
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("👆 Notification tapped:", data);
        
        // Navigate based on type
        setTimeout(() => {
          if (data.type === "message" && data.fromUserId) {
            // router.push(`/user/${data.fromUserId}`);
          } else if (data.type === "challenge") {
            // router.push("/(tabs)/notifications");
          } else if (data.type === "rating") {
            // router.push("/(tabs)/profile");
          }
        }, 100);
      });

    return () => {
      // Set user offline when component unmounts
      const userId = auth.currentUser?.uid;
      if (userId) {
        setUserOffline(userId);
      }

      unsubscribe();
      appStateSubscription.remove();
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