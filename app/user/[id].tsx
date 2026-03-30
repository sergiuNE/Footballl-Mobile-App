import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import Card from "../../components/Card";
import { UserProfile } from "@/types";
import { ChatMessage } from "@/types";
import { sendNotificationToUser } from "../services/notifications";

const formatLastSeen = (lastSeen: any) => {
  if (!lastSeen) return "unknown";
  const d = lastSeen?.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingValue, setRatingValue] = useState(5);
  const [showRating, setShowRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [challengeSent, setChallengeSent] = useState(false);
  const [showChallengeType, setShowChallengeType] = useState(false);
  const challengeTypes = [
    { id: "penalty_shootout" as const, label: "Penalty Shootout" },
    { id: "1v1" as const, label: "1v1 Match" },
  ];

  const currentUserId = auth.currentUser?.uid;
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const u = await getDoc(doc(db, "users", userId));
        if (u.exists()) {
          const d = u.data();
          setUser({
            id: u.id,
            name: d.name ?? "Player",
            email: d.email,
            rating: d.rating ?? 5,
            matchesPlayed: d.matchesPlayed ?? 0,
            positions: d.positions ?? [],
            photoURL: d.photoURL,
            isOnline: d.isOnline ?? false,
            lastSeen: d.lastSeen?.toDate?.(),
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (!showChat || !userId || !currentUserId) return;
    const myId = currentUserId;
    const otherId = userId;
    const chatId = [myId, otherId].sort().join("_");
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName ?? "",
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      setMessages(list);
    });
    return () => unsub();
  }, [showChat, userId, currentUserId]);

  const handleChallenge = async (challengeType: "penalty_shootout" | "1v1") => {
    setShowChallengeType(false);
    if (!currentUserId || !userId || !user) return;

    try {
      const me = await getDoc(doc(db, "users", currentUserId));
      const fromUserName = me.exists() ? me.data().name : "Someone";

      await addDoc(collection(db, "challenges"), {
        fromUserId: currentUserId,
        fromUserName,
        toUserId: userId,
        type: challengeType,
        status: "pending",
        createdAt: new Date(),
      });

      const challengeLabel =
        challengeType === "penalty_shootout" ? "Penalty Shootout" : "1v1 Match";

      await sendNotificationToUser(
        userId,
        "New Challenge",
        `${fromUserName} challenged you to ${challengeLabel}`,
        {
          type: "challenge",
          challengeType,
          fromUserId: currentUserId,
          fromUserName,
        },
      );

      setChallengeSent(true);
      Alert.alert("Sent!", "Challenge sent! The player will be notified.");
    } catch (error) {
      console.error("Challenge error:", error);
      Alert.alert("Error", "Could not send challenge.");
    }
  };

  const handleSubmitRating = async () => {
    if (!currentUserId || !userId || !user) return;

    try {
      const userRef = doc(db, "users", userId);
      const u = await getDoc(userRef);
      const current = u.data()?.rating ?? 5;
      const count = u.data()?.ratingCount ?? 0;
      const newRating =
        count > 0 ? (current * count + ratingValue) / (count + 1) : ratingValue;

      await updateDoc(userRef, {
        rating: Math.round(newRating * 10) / 10,
        ratingCount: count + 1,
      });

      const myDoc = await getDoc(doc(db, "users", currentUserId));
      const myName = myDoc.data()?.name ?? "Someone";

      await sendNotificationToUser(
        userId,
        "New Rating",
        `${myName} gave you a rating of (${ratingValue}/10)`,
        {
          type: "rating",
          fromUserId: currentUserId,
          fromUserName: myName,
          rating: ratingValue,
          newAverage: Math.round(newRating * 10) / 10,
        },
      );

      setUser((prev) => (prev ? { ...prev, rating: newRating } : null));
      setShowRating(false);
      Alert.alert("Thank you!", "Rating saved and user notified.");
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert("Error", "Could not save rating.");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !userId) return;

    const myId = currentUserId;
    const otherId = userId;
    const chatId = [myId, otherId].sort().join("_");

    setSending(true);
    try {
      const myDoc = await getDoc(doc(db, "users", myId));
      const senderName = myDoc.data()?.name ?? "Someone";

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage.trim(),
        senderId: myId,
        senderName,
        createdAt: serverTimestamp(),
      });

      // FIX: Use fromUserId instead of senderId
      await sendNotificationToUser(
        otherId,
        `${senderName}`,
        newMessage.trim(),
        {
          type: "message",
          fromUserId: myId, // CHANGED from senderId
          fromUserName: senderName,
          chatId,
        },
      );

      setNewMessage("");
    } catch (error) {
      console.error("Message error:", error);
      Alert.alert("Error", "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.empty}>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      {!showChat ? (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitleWhite}>{user.name}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => setShowChat(false)}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>{user.name}</Text>
            <View style={styles.onlineStatusRow}>
              <View style={[
                styles.onlineIndicator,
                user.isOnline && styles.onlineIndicatorActive
              ]} />
              <Text style={styles.chatHeaderSubtitle}>
                {user.isOnline ? "Online" : `Offline • ${formatLastSeen(user.lastSeen)}`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {!showChat ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user.photoURL ? (
                <View style={styles.avatarWithPhoto}>
                  <Image 
                    source={{ uri: user.photoURL }} 
                    style={styles.avatarImage}
                  />
                  <View style={[
                    styles.onlineStatusBadge,
                    user.isOnline && styles.onlineStatusBadgeActive
                  ]} />
                </View>
              ) : (
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                  <View style={[
                    styles.onlineStatusBadge,
                    user.isOnline && styles.onlineStatusBadgeActive
                  ]} />
                </LinearGradient>
              )}
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.statusRow}>
              <View style={[
                styles.onlineIndicatorSmall,
                user.isOnline && styles.onlineIndicatorActive
              ]} />
              <Text style={styles.statusText}>
                {user.isOnline ? "Online" : `Last seen ${formatLastSeen(user.lastSeen)}`}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={20} color={Colors.warning} />
              <Text style={styles.ratingText}>
                {user.rating?.toFixed(1) ?? "–"}
              </Text>
            </View>
          </Card>

          {/* Stats Card */}
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="football" size={32} color={Colors.primary} />
                <Text style={styles.statValue}>{user.matchesPlayed ?? 0}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="star" size={32} color={Colors.warning} />
                <Text style={styles.statValue}>
                  {user.rating?.toFixed(1) ?? "–"}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </Card>

          {/* Positions Card */}
          <Card style={styles.positionsCard}>
            <Text style={styles.sectionTitle}>Favorite Positions</Text>
            <View style={styles.positionBadges}>
              {user.positions && user.positions.length > 0 ? (
                user.positions.map((pos) => (
                  <View key={pos} style={styles.positionBadge}>
                    <Ionicons
                      name="football-outline"
                      size={16}
                      color={Colors.white}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.positionBadgeText}>{pos}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noPositionsContainer}>
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color={Colors.gray400}
                  />
                  <Text style={styles.noPositionsText}>
                    No positions selected
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Actions */}
          {!isOwnProfile && currentUserId && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  challengeSent && styles.primaryActionBtnDisabled,
                ]}
                onPress={() =>
                  challengeSent ? undefined : setShowChallengeType(true)
                }
                disabled={challengeSent}
              >
                <LinearGradient
                  colors={
                    challengeSent
                      ? [Colors.gray400, Colors.gray500]
                      : [Colors.primary, Colors.primaryDark]
                  }
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="trophy" size={20} color={Colors.white} />
                  <Text style={styles.primaryActionText}>
                    {challengeSent ? "Challenge Sent" : "Challenge"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {showChallengeType && (
                <Card style={styles.challengeTypeCard}>
                  <Text style={styles.challengeTypeTitle}>
                    Choose Challenge Type
                  </Text>
                  {challengeTypes.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={styles.challengeTypeBtn}
                      onPress={() => handleChallenge(opt.id)}
                    >
                      <Ionicons
                        name="trophy-outline"
                        size={20}
                        color={Colors.primary}
                      />
                      <Text style={styles.challengeTypeBtnText}>
                        {opt.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={Colors.gray400}
                      />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.challengeTypeCancelBtn}
                    onPress={() => setShowChallengeType(false)}
                  >
                    <Text style={styles.challengeTypeCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </Card>
              )}

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setShowRating(true)}
              >
                <Ionicons
                  name="star-outline"
                  size={20}
                  color={Colors.gray700}
                />
                <Text style={styles.secondaryActionText}>Give Rating</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => router.push(`/user/${userId}/stats` as any)}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color={Colors.gray700}
                />
                <Text style={styles.secondaryActionText}>View Stats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setShowChat(true)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={Colors.gray700}
                />
                <Text style={styles.secondaryActionText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rating Modal */}
          {showRating && (
            <Card style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>Rate this player (1-10)</Text>
              <View style={styles.ratingGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.ratingBtn,
                      ratingValue === n && styles.ratingBtnSelected,
                    ]}
                    onPress={() => setRatingValue(n)}
                  >
                    <Text
                      style={[
                        styles.ratingBtnText,
                        ratingValue === n && styles.ratingBtnTextSelected,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.ratingActions}>
                <TouchableOpacity
                  style={styles.ratingCancel}
                  onPress={() => setShowRating(false)}
                >
                  <Text style={styles.ratingCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ratingSubmit}
                  onPress={handleSubmitRating}
                >
                  <Text style={styles.ratingSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
                  ]}
                >
                  {!isMe && (
                    <Text style={styles.senderName}>{item.senderName}</Text>
                  )}
                  <Text
                    style={[styles.messageText, isMe && styles.messageTextMe]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[styles.messageTime, isMe && styles.messageTimeMe]}
                  >
                    {item.createdAt.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            }}
          />
          <View style={styles.chatInputContainer}>
            <View style={styles.chatInputWrapper}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor={Colors.gray400}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!newMessage.trim() || sending) && styles.sendBtnDisabled,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.sendBtnGradient}
                >
                  <Ionicons name="send" size={18} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerGradient: {
    marginTop: 80,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingTop: Spacing.xxl,
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderTitle: {
    ...Typography.bodyBold,
    color: Colors.gray900,
  },
  chatHeaderSubtitle: {
    ...Typography.tiny,
    color: Colors.success,
    marginTop: 2,
  },
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    flex: 1,
  },
  headerTitleWhite: {
    ...Typography.h2,
    color: Colors.white,
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    marginTop: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.large,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.white,
  },
  userName: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    ...Typography.h3,
    color: Colors.gray800,
  },
  statsCard: { marginBottom: Spacing.md },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.gray200,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: "700",
  },
  statLabel: {
    ...Typography.small,
    color: Colors.gray500,
    marginTop: 4,
  },
  actions: { gap: Spacing.sm },
  primaryActionBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadows.medium,
  },
  primaryActionBtnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  primaryActionText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  secondaryActionText: {
    ...Typography.bodyBold,
    color: Colors.gray700,
    flex: 1,
  },
  challengeTypeCard: {
    marginTop: Spacing.sm,
    padding: 0,
  },
  challengeTypeTitle: {
    ...Typography.bodyBold,
    color: Colors.gray900,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  challengeTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  challengeTypeBtnText: {
    ...Typography.body,
    color: Colors.gray900,
    flex: 1,
  },
  challengeTypeCancelBtn: {
    padding: Spacing.md,
    alignItems: "center",
  },
  challengeTypeCancelText: {
    ...Typography.bodyBold,
    color: Colors.gray500,
  },
  ratingCard: {
    marginTop: Spacing.md,
  },
  ratingTitle: {
    ...Typography.bodyBold,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ratingBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  ratingBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingBtnText: {
    ...Typography.bodyBold,
    color: Colors.gray700,
  },
  ratingBtnTextSelected: {
    color: Colors.white,
  },
  ratingActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  ratingCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  ratingCancelText: {
    ...Typography.bodyBold,
    color: Colors.gray600,
  },
  ratingSubmit: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  ratingSubmitText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  empty: {
    ...Typography.body,
    color: Colors.gray500,
  },

  // Chat Styles
  chatContainer: { flex: 1, backgroundColor: "#F0F2F5" },
  chatList: { flex: 1 },
  chatListContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignSelf: "flex-start",
  },
  messageBubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    ...Shadows.small,
  },
  senderName: {
    ...Typography.tiny,
    color: Colors.gray500,
    marginBottom: 4,
    fontWeight: "600",
  },
  messageText: {
    ...Typography.body,
    color: Colors.gray900,
    lineHeight: 20,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageTime: {
    ...Typography.tiny,
    color: Colors.gray400,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageTimeMe: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  chatInputContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    padding: Spacing.sm,
  },
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    ...Typography.body,
    color: Colors.gray900,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  positionsCard: {
    marginBottom: Spacing.md,
  },
  positionBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  positionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  positionBadgeText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: "600",
  },
  noPositionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  noPositionsText: {
    ...Typography.body,
    color: Colors.gray500,
    fontStyle: "italic",
  },
  avatarWithPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  onlineStatusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gray400,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  onlineStatusBadgeActive: {
    backgroundColor: "#4CAF50",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  onlineIndicatorSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray400,
  },
  statusText: {
    ...Typography.small,
    color: Colors.gray600,
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gray400,
  },
  onlineIndicatorActive: {
    backgroundColor: "#4CAF50",
  },
});
