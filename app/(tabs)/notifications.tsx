import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { router } from "expo-router";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";

type ChallengeType = "penalty_shootout" | "1v1";

type NotificationItem = {
  id: string;
  type: "challenge" | "rating" | "message";
  challengeType?: ChallengeType;
  fromUserId: string;
  fromUserName: string;
  status?: string;
  title?: string;
  body?: string;
  read?: boolean;
  createdAt: Date;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setItems([]);
      setLoading(false);
      return;
    }

    // tore userId to avoid null check issues
    const currentUserId = auth.currentUser.uid;

    // Listen to challenges
    const challengesQuery = query(
      collection(db, "challenges"),
      where("toUserId", "==", currentUserId),
    );

    const unsubscribeChallenges = onSnapshot(
      challengesQuery,
      async (snapshot) => {
        const challengeList: NotificationItem[] = [];

        for (const d of snapshot.docs) {
          const data = d.data();
          let fromName = data.fromUserName;
          if (!fromName) {
            const fromUser = await getDoc(doc(db, "users", data.fromUserId));
            fromName = fromUser.exists() ? fromUser.data().name : "Someone";
          }
          challengeList.push({
            id: d.id,
            type: "challenge",
            challengeType: data.type ?? "1v1",
            fromUserId: data.fromUserId,
            fromUserName: fromName,
            status: data.status ?? "pending",
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          });
        }

        // Listen to general notifications
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", currentUserId),
        );

        const unsubscribeNotifications = onSnapshot(
          notificationsQuery,
          (notifSnap) => {
            const notifList: NotificationItem[] = notifSnap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                type: data.data?.type || "message",
                fromUserId: data.data?.fromUserId || "",
                fromUserName: data.data?.fromUserName || "Someone",
                title: data.title,
                body: data.body,
                read: data.read ?? false,
                createdAt: data.createdAt?.toDate?.() ?? new Date(),
              };
            });

            // Sort in code instead
            const allNotifs = [...challengeList, ...notifList].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            );

            setItems(allNotifs);
            setLoading(false);
            setRefreshing(false);
          },
        );

        return () => unsubscribeNotifications();
      },
    );

    return () => unsubscribeChallenges();
  }, [auth.currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getChallengeTypeLabel = (t?: ChallengeType) => {
    if (t === "penalty_shootout") return "Penalty Shootout";
    if (t === "1v1") return "1v1";
    return "Challenge";
  };

  const getNotificationIcon = (type: string) => {
    if (type === "challenge") return "trophy";
    if (type === "rating") return "star";
    if (type === "message") return "chatbubble";
    return "notifications";
  };

  const handleAccept = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, "challenges", item.id), { status: "accepted" });
      Alert.alert("Accepted", "You accepted the challenge!");
    } catch {
      Alert.alert("Error", "Could not accept.");
    }
  };

  const handleReject = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, "challenges", item.id), { status: "declined" });
      Alert.alert("Declined", "Challenge declined.");
    } catch {
      Alert.alert("Error", "Could not decline.");
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // Mark as read
    if (item.type !== "challenge" && !item.read) {
      await updateDoc(doc(db, "notifications", item.id), { read: true });
    }

    // Navigate
    if (item.type === "message" || item.type === "rating") {
      router.push(`/user/${item.fromUserId}` as any);
    } else if (item.type === "challenge") {
      router.push(`/user/${item.fromUserId}` as any);
    }
  };

  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Stay updated</Text>
          </LinearGradient>
          <View style={styles.centered}>
            <Text style={styles.empty}>Log in to see notifications.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Challenges, messages, and ratings
          </Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={Colors.gray300}
            />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              When something happens, you'll see it here.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              style={[styles.card, item.read === false && styles.cardUnread]}
            >
              {item.type === "challenge" ? (
                <>
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIconContainer}>
                      <Ionicons
                        name="trophy"
                        size={28}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>
                        <Text style={styles.cardName}>{item.fromUserName}</Text>
                        {" challenged you to "}
                        <Text style={styles.cardName}>
                          {getChallengeTypeLabel(item.challengeType)}
                        </Text>
                      </Text>
                      <Text style={styles.cardMeta}>
                        {item.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at{" "}
                        {item.createdAt.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {item.status !== "pending" && (
                        <Text
                          style={[
                            styles.cardStatus,
                            item.status === "accepted"
                              ? styles.cardStatusAccepted
                              : styles.cardStatusDeclined,
                          ]}
                        >
                          {item.status === "accepted" ? "Accepted" : "Declined"}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {item.status === "pending" && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(item)}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(item)}
                      >
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={styles.cardTouchable}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons
                      name={getNotificationIcon(item.type)}
                      size={28}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>{item.body}</Text>
                    <Text style={styles.cardTime}>
                      {item.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {item.createdAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingTop: 80,
    paddingBottom: 120,
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingContainer: { alignItems: "center", paddingVertical: Spacing.xxl },
  header: {
    paddingVertical: Spacing.xl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: { ...Typography.body, color: "rgba(255,255,255,0.9)" },
  empty: { ...Typography.body, color: Colors.gray600 },
  emptyState: { alignItems: "center", paddingVertical: Spacing.xxl * 2 },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray700,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardUnread: {
    backgroundColor: Colors.gray50,
  },
  cardTouchable: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.body, color: Colors.gray900, fontWeight: "600" },
  cardName: { fontWeight: "700", color: Colors.primary },
  cardMeta: { ...Typography.small, color: Colors.gray600, marginTop: 4 },
  cardTime: { ...Typography.tiny, color: Colors.gray400, marginTop: 2 },
  cardStatus: { ...Typography.small, marginTop: 4, fontWeight: "600" },
  cardStatusAccepted: { color: Colors.success },
  cardStatusDeclined: { color: Colors.gray500 },
  cardActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  acceptBtnText: { ...Typography.bodyBold, color: Colors.white },
  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  rejectBtnText: { ...Typography.bodyBold, color: Colors.gray600 },
});
