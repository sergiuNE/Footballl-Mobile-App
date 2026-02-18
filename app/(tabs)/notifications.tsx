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
          fromName = fromUser.exists() ? fromUser.data().name : 'Iemand';
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
    if (t === 'penalty_shootout') return 'Penalty shootout';
    if (t === '1v1') return '1v1';
    return 'Uitdaging';
  };

  const handleAccept = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'challenges', item.id), { status: 'accepted' });
      await load();
      Alert.alert('Geaccepteerd', 'Je hebt de uitdaging geaccepteerd!');
    } catch {
      Alert.alert('Fout', 'Kon niet accepteren.');
    }
  };

  const handleReject = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'challenges', item.id), { status: 'declined' });
      await load();
      Alert.alert('Afgewezen', 'Uitdaging afgewezen.');
    } catch {
      Alert.alert('Fout', 'Kon niet afwijzen.');
    }
  };

  if (!auth.currentUser) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>Meldingen</Text>
          <Text style={styles.headerSubtitle}>Uitdagingen en meer</Text>
        </LinearGradient>
        <View style={styles.centered}>
          <Text style={styles.empty}>Log in om meldingen te zien.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Meldingen</Text>
        <Text style={styles.headerSubtitle}>Als iemand je uitdaagt verschijnt het hier</Text>
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
              <Ionicons name="notifications-off-outline" size={48} color={Colors.gray400} />
              <Text style={styles.emptyTitle}>Geen meldingen</Text>
              <Text style={styles.emptyText}>Wanneer iemand je uitdaagt zie je dat hier.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardTouchable}
                  onPress={() => router.push(`/user/${item.fromUserId}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="trophy" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      <Text style={styles.cardName}>{item.fromUserName}</Text>
                      {' daagde je uit voor '}
                      <Text style={styles.cardName}>{getChallengeTypeLabel(item.challengeType)}</Text>
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.createdAt.toLocaleDateString('nl-BE')} · {item.createdAt.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {item.status !== 'pending' && (
                      <Text style={[styles.cardStatus, item.status === 'accepted' ? styles.cardStatusAccepted : styles.cardStatusDeclined]}>
                        {item.status === 'accepted' ? 'Geaccepteerd' : 'Afgewezen'}
                      </Text>
                    )}
                  </View>
                  {item.status === 'pending' ? null : <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />}
                </TouchableOpacity>
                {item.status === 'pending' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                      <Text style={styles.acceptBtnText}>Accepteren</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                      <Text style={styles.rejectBtnText}>Afwijzen</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
  headerTitle: { ...Typography.h1, color: Colors.white },
  headerSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.9)' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { ...Typography.body, color: Colors.gray600 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2 },
  emptyTitle: { ...Typography.h3, color: Colors.gray700, marginTop: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.gray500, marginTop: Spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTouchable: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { marginRight: Spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.body, color: Colors.gray900 },
  cardName: { fontWeight: '700', color: Colors.gray900 },
  cardMeta: { ...Typography.small, color: Colors.gray500, marginTop: 2 },
  cardStatus: { ...Typography.small, marginTop: 4, fontWeight: '600' },
  cardStatusAccepted: { color: Colors.success },
  cardStatusDeclined: { color: Colors.gray500 },
  cardActions: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm },
  acceptBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  acceptBtnText: { ...Typography.bodyBold, color: Colors.white },
  rejectBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.gray100, alignItems: 'center' },
  rejectBtnText: { ...Typography.bodyBold, color: Colors.gray600 },
});
