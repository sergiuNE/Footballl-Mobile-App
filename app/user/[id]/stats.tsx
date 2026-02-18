import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from "../../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import Card from "../../../components/Card";

export default function UserStatsScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ matchesPlayed: 0, rating: 0, goals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const u = await getDoc(doc(db, "users", userId));
        if (u.exists()) {
          const d = u.data();
          setUserName(d.name ?? "Player");
          setStats({
            matchesPlayed: d.matchesPlayed ?? 0,
            rating: d.rating ?? 0,
            goals: d.goals ?? 0,
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Player Statistics</Text>
          <Text style={styles.headerSubtitle}>{userName}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="football" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Matches Played</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={40} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={40} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{stats.goals}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  headerContent: { flex: 1 },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.9)",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.body,
    color: Colors.gray600,
  },
});
