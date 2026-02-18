import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';

export default function UserStatsScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ matchesPlayed: 0, rating: 0, goals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const u = await getDoc(doc(db, 'users', userId));
        if (u.exists()) {
          const d = u.data();
          setUserName(d.name ?? 'Speler');
          setStats({
            matchesPlayed: d.matchesPlayed ?? 0,
            rating: d.rating ?? 0,
            goals: d.goals ?? 0,
          });
        }
        // matchesPlayed from user doc (can be updated when user joins/leaves matches)
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistieken · {userName}</Text>
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statCard}>
            <Ionicons name="football-outline" size={32} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Wedstrijden</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={32} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={32} color={Colors.info} />
            <Text style={styles.statValue}>{stats.goals}</Text>
            <Text style={styles.statLabel}>Doelpunten</Text>
          </View>
        </ScrollView>
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
  scrollContent: { padding: Spacing.lg },
  statCard: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '700', color: Colors.gray900, marginTop: Spacing.sm },
  statLabel: { ...Typography.body, color: Colors.gray600, marginTop: 4 },
});
