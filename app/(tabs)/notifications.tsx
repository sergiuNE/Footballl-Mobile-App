import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';

type ChallengeType = 'penalty_shootout' | '1v1';

type NotificationItem = {
  id: string;
  type: 'challenge';
  challengeType?: ChallengeType;
  fromUserId: string;
  fromUserName: string;
  status: string;
  createdAt: Date;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!auth.currentUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'challenges'),
        where('toUserId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const list: NotificationItem[] = [];
      const docs = snap.docs.sort((a, b) => {
        const at = a.data().createdAt?.toDate?.()?.getTime() ?? 0;
        const bt = b.data().createdAt?.toDate?.()?.getTime() ?? 0;
        return bt - at;
      });
      for (const d of docs) {
        const data = d.data();
        let fromName = data.fromUserName;
        if (!fromName) {
          const fromUser = await getDoc(doc(db, 'users', data.fromUserId));
          fromName = fromUser.exists() ? fromUser.data().name : 'Someone';
        }
        list.push({
          id: d.id,
          type: 'challenge',
          challengeType: data.type ?? '1v1',
          fromUserId: data.fromUserId,
          fromUserName: fromName,
          status: data.status ?? 'pending',
          createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
        });
      }
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const getChallengeTypeLabel = (t?: ChallengeType) => {
    if (t === 'penalty_shootout') return 'Penalty Shootout';
    if (t === '1v1') return '1v1';
    return 'Challenge';
  };

  const handleAccept = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'challenges', item.id), { status: 'accepted' });
      await load();
      Alert.alert('Accepted', 'You accepted the challenge!');
    } catch {
      Alert.alert('Error', 'Could not accept.');
    }
  };

  const handleReject = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'challenges', item.id), { status: 'declined' });
      await load();
      Alert.alert('Declined', 'Challenge declined.');
    } catch {
      Alert.alert('Error', 'Could not decline.');
    }
  };

  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Challenges and more</Text>
        </LinearGradient>
        <View style={styles.centered}>
          <Text style={styles.empty}>Log in to see notifications.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>When someone challenges you, it appears here</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>When someone challenges you, you'll see it here.</Text>
            </View>
          ) : (
            items.map((item) => (
              <Card key={item.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardTouchable}
                  onPress={() => router.push(`/user/${item.fromUserId}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="trophy" size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      <Text style={styles.cardName}>{item.fromUserName}</Text>
                      {' challenged you to '}
                      <Text style={styles.cardName}>{getChallengeTypeLabel(item.challengeType)}</Text>
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {item.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {item.status !== 'pending' && (
                      <Text style={[styles.cardStatus, item.status === 'accepted' ? styles.cardStatusAccepted : styles.cardStatusDeclined]}>
                        {item.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </Text>
                    )}
                  </View>
                  {item.status !== 'pending' && <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />}
                </TouchableOpacity>

                {item.status === 'pending' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  headerTitle: { ...Typography.h1, color: Colors.white, marginBottom: Spacing.xs },
  headerSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.9)' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { ...Typography.body, color: Colors.gray600 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2 },
  emptyTitle: { ...Typography.h2, color: Colors.gray700, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  emptyText: { ...Typography.body, color: Colors.gray500, textAlign: 'center', paddingHorizontal: Spacing.xl },
  card: {
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardTouchable: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.body, color: Colors.gray900 },
  cardName: { fontWeight: '700', color: Colors.primary },
  cardMeta: { ...Typography.small, color: Colors.gray500, marginTop: 4 },
  cardStatus: { ...Typography.small, marginTop: 4, fontWeight: '600' },
  cardStatusAccepted: { color: Colors.success },
  cardStatusDeclined: { color: Colors.gray500 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  acceptBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  acceptBtnText: { ...Typography.bodyBold, color: Colors.white },
  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  rejectBtnText: { ...Typography.bodyBold, color: Colors.gray600 },
});