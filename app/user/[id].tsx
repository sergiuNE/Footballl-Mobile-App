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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
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
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

type UserProfile = { id: string; name: string; email?: string; rating?: number; matchesPlayed?: number };
type ChatMessage = { id: string; text: string; senderId: string; senderName: string; createdAt: Date };

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingValue, setRatingValue] = useState(5);
  const [showRating, setShowRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [challengeSent, setChallengeSent] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const u = await getDoc(doc(db, 'users', userId));
        if (u.exists()) {
          const d = u.data();
          setUser({
            id: u.id,
            name: d.name ?? 'Speler',
            email: d.email,
            rating: d.rating ?? 5,
            matchesPlayed: d.matchesPlayed ?? 0,
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
    const chatId = [myId, otherId].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName ?? '',
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      setMessages(list);
    });
    return () => unsub();
  }, [showChat, userId, currentUserId]);

  const handleChallenge = async () => {
    if (!currentUserId || !userId || !user) return;
    try {
      await addDoc(collection(db, 'challenges'), {
        fromUserId: currentUserId,
        toUserId: userId,
        status: 'pending',
        createdAt: new Date(),
      });
      setChallengeSent(true);
      Alert.alert('Verzonden', 'Challenge verstuurd!');
    } catch {
      Alert.alert('Fout', 'Challenge kon niet worden verstuurd.');
    }
  };

  const handleSubmitRating = async () => {
    if (!currentUserId || !userId || !user) return;
    try {
      const userRef = doc(db, 'users', userId);
      const u = await getDoc(userRef);
      const current = u.data()?.rating ?? 5;
      const count = u.data()?.ratingCount ?? 0;
      const newRating = count > 0 ? (current * count + ratingValue) / (count + 1) : ratingValue;
      await updateDoc(userRef, {
        rating: Math.round(newRating * 10) / 10,
        ratingCount: count + 1,
      });
      setUser((prev) => (prev ? { ...prev, rating: newRating } : null));
      setShowRating(false);
      Alert.alert('Bedankt', 'Rating opgeslagen.');
    } catch {
      Alert.alert('Fout', 'Rating kon niet worden opgeslagen.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !userId) return;
    const myId = currentUserId;
    const otherId = userId;
    const chatId = [myId, otherId].sort().join('_');
    const myDoc = await getDoc(doc(db, 'users', myId));
    const senderName = myDoc.data()?.name ?? 'Ik';
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: myId,
        senderName,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch {
      Alert.alert('Fout', 'Bericht kon niet worden verzonden.');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profiel</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.empty}>Gebruiker niet gevonden.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (showChat ? setShowChat(false) : router.back())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{showChat ? 'Chat' : user.name}</Text>
      </View>

      {!showChat ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color={Colors.warning} />
              <Text style={styles.ratingText}>{user.rating?.toFixed(1) ?? '–'}</Text>
            </View>
            <Text style={styles.statsLabel}>Wedstrijden gespeeld: {user.matchesPlayed ?? 0}</Text>
          </View>

          {!isOwnProfile && currentUserId && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={handleChallenge}
                disabled={challengeSent}
              >
                <Ionicons name="trophy-outline" size={22} color={Colors.white} />
                <Text style={styles.actionBtnText}>{challengeSent ? 'Challenge verzonden' : 'Uitdagen'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRating(true)}>
                <Ionicons name="star-outline" size={22} color={Colors.gray700} />
                <Text style={styles.actionBtnTextSecondary}>Rating geven</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/user/${userId}/stats` as any)}>
                <Ionicons name="stats-chart-outline" size={22} color={Colors.gray700} />
                <Text style={styles.actionBtnTextSecondary}>Statistieken</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChat(true)}>
                <Ionicons name="chatbubble-outline" size={22} color={Colors.gray700} />
                <Text style={styles.actionBtnTextSecondary}>Chatten</Text>
              </TouchableOpacity>
            </View>
          )}

          {showRating && (
            <View style={styles.ratingModal}>
              <Text style={styles.ratingModalTitle}>Rating geven (1-10)</Text>
              <View style={styles.ratingInputRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingDot, ratingValue === n && styles.ratingDotSelected]}
                    onPress={() => setRatingValue(n)}
                  >
                    <Text style={[styles.ratingDotText, ratingValue === n && styles.ratingDotTextSelected]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.ratingModalActions}>
                <TouchableOpacity style={styles.ratingCancel} onPress={() => setShowRating(false)}>
                  <Text style={styles.ratingCancelText}>Annuleren</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ratingSubmit} onPress={handleSubmitRating}>
                  <Text style={styles.ratingSubmitText}>Opslaan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              return (
                <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleThem]}>
                  <Text style={[styles.chatBubbleText, isMe && styles.chatBubbleTextMe]}>{item.text}</Text>
                </View>
              );
            }}
          />
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Bericht..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.chatSend, (!newMessage.trim() || sending) && styles.chatSendDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons name="send" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray200 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { ...Typography.h3, color: Colors.gray900, flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarRow: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  name: { ...Typography.h2, color: Colors.gray900 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { ...Typography.bodyBold, color: Colors.gray800 },
  statsLabel: { ...Typography.small, color: Colors.gray600, marginTop: 4 },
  actions: { gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.gray200 },
  actionPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionBtnText: { ...Typography.bodyBold, color: Colors.white },
  actionBtnTextSecondary: { ...Typography.bodyBold, color: Colors.gray700 },
  empty: { ...Typography.body, color: Colors.gray600 },
  ratingModal: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: BorderRadius.lg, marginTop: Spacing.lg, ...Shadows.medium },
  ratingModalTitle: { ...Typography.bodyBold, marginBottom: Spacing.md },
  ratingInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  ratingDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  ratingDotSelected: { backgroundColor: Colors.primary },
  ratingDotText: { ...Typography.bodyBold, color: Colors.gray700 },
  ratingDotTextSelected: { color: Colors.white },
  ratingModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  ratingCancel: { padding: Spacing.sm },
  ratingCancelText: { ...Typography.body, color: Colors.gray600 },
  ratingSubmit: { padding: Spacing.sm, paddingHorizontal: Spacing.md },
  ratingSubmitText: { ...Typography.bodyBold, color: Colors.primary },
  chatContainer: { flex: 1 },
  chatList: { flex: 1 },
  chatListContent: { padding: Spacing.md },
  chatBubble: { maxWidth: '80%', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, alignSelf: 'flex-start', backgroundColor: Colors.gray200 },
  chatBubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  chatBubbleText: { ...Typography.body, color: Colors.gray900 },
  chatBubbleTextMe: { color: Colors.white },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray200 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: Colors.gray200, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.sm, maxHeight: 100, ...Typography.body },
  chatSend: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  chatSendDisabled: { opacity: 0.5 },
});
