import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { router } from "expo-router";
import Card from "../../components/Card";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

type Match = {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  maxPlayers: number;
  currentPlayers: number;
  skillLevel: SkillLevel;
  status: string;
  createdByName: string;
};

export default function Search() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all" | "open">(
    "upcoming",
  );

  useEffect(() => {
    loadMatches();
  }, [filter]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "matches"));

      const snapshot = await getDocs(q);
      const matchesData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const date =
          data.date instanceof Timestamp
            ? data.date.toDate()
            : data.date?.seconds
              ? new Date(data.date.seconds * 1000)
              : new Date(data.date);
        const players = data.players ?? [];
        const currentPlayers =
          typeof data.currentPlayers === "number"
            ? data.currentPlayers
            : players.length;
        return {
          id: docSnap.id,
          title: data.title ?? data.location ?? "Wedstrijd",
          location: data.location ?? "",
          date,
          time: data.time ?? "",
          maxPlayers: data.maxPlayers ?? 22,
          currentPlayers,
          skillLevel: data.skillLevel ?? "all",
          status: data.status ?? "open",
          createdByName: data.createdByName ?? "Onbekend",
        } as Match;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const toMatchDay = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x.getTime();
      };
      const todayMs = today.getTime();
      let filtered = matchesData;

      if (filter === "past") {
        filtered = filtered.filter((m) => toMatchDay(m.date) < todayMs);
        filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
      } else {
        filtered = filtered.filter((m) => toMatchDay(m.date) >= todayMs);
        if (filter === "open")
          filtered = filtered.filter((m) => m.status === "open");
        filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
      }

      setMatches(filtered);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillBadge = (level: SkillLevel) => {
    const badges = {
      all: { emoji: "🌟", label: "All", color: Colors.primary },
      beginner: { emoji: "🟢", label: "Beginner", color: "#10b981" },
      intermediate: { emoji: "🟡", label: "Intermediate", color: "#f59e0b" },
      advanced: { emoji: "🔴", label: "Advanced", color: "#ef4444" },
    };
    return badges[level];
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") return { text: "Open", color: Colors.success };
    if (status === "full") return { text: "Full", color: Colors.error };
    if (status === "completed")
      return { text: "Completed", color: Colors.gray600 };
    return { text: status, color: Colors.gray500 };
  };

  const getFilterLabel = (f: typeof filter) => {
    const labels = {
      upcoming: "Upcoming",
      past: "Past",
      all: "All",
      open: "Open",
    };
    return labels[f];
  };

  const getEmptyMessage = () => {
    if (filter === "past") return "No past matches yet.";
    if (filter === "open") return "No open matches at this time.";
    return "Create a match via Create!";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMatches} />
        }
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Find Matches</Text>
          <Text style={styles.headerSubtitle}>
            {filter === "past"
              ? "View your match history"
              : "Join a game near you"}
          </Text>
        </LinearGradient>

        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["upcoming", "past", "all", "open"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  filter === f && styles.filterChipActive,
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {getFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {filter === "past" ? "📜" : "⚽"}
            </Text>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          </View>
        ) : (
          matches.map((match) => {
            const skill = getSkillBadge(match.skillLevel);
            const status = getStatusBadge(match.status);
            const isFull = match.currentPlayers >= match.maxPlayers;
            const isPast = filter === "past";

            return (
              <TouchableOpacity
                key={match.id}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/match/[id]",
                    params: { id: match.id },
                  })
                }
              >
                <Card
                  style={[
                    styles.matchCard,
                    isPast ? styles.matchCardPast : null,
                  ]}
                >
                  <View style={styles.matchHeader}>
                    <Text
                      style={[
                        styles.matchTitle,
                        isPast ? styles.matchTitlePast : null,
                      ]}
                    >
                      {match.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.color },
                      ]}
                    >
                      <Text style={styles.statusText}>{status.text}</Text>
                    </View>
                  </View>

                  <View style={styles.matchInfo}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>📅</Text>
                      <Text style={styles.infoText}>
                        {match.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: isPast ? "numeric" : undefined,
                        })}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>🕐</Text>
                      <Text style={styles.infoText}>{match.time}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoIcon}>📍</Text>
                      <Text style={styles.infoText} numberOfLines={1}>
                        {match.location}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchFooter}>
                    <View style={styles.footerLeft}>
                      <View
                        style={[
                          styles.skillBadge,
                          { backgroundColor: skill.color },
                        ]}
                      >
                        <Text style={styles.skillText}>
                          {skill.emoji} {skill.label}
                        </Text>
                      </View>

                      <View style={styles.playersInfo}>
                        <Text style={styles.playersText}>
                          👥 {match.currentPlayers}/{match.maxPlayers}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.organizerText}>
                      by {match.createdByName}
                    </Text>
                  </View>

                  {isFull && !isPast && (
                    <View style={styles.fullOverlay}>
                      <Text style={styles.fullText}>Match is full</Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 120,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingVertical: Spacing.xl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.h3,
    color: Colors.gray900,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.9)",
  },
  filters: {
    
    marginBottom: Spacing.md,
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.body,
    color: Colors.gray700,
    fontWeight: "600",
  },
  filterTextActive: {
    color: Colors.white,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: "center",
  },
  matchCard: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  matchCardPast: {
    opacity: 0.7,
    backgroundColor: Colors.gray50,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  matchTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    flex: 1,
    marginRight: Spacing.sm,
  },
  matchTitlePast: {
    color: Colors.gray600,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.tiny,
    color: Colors.white,
    fontWeight: "700",
  },
  matchInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoText: {
    ...Typography.small,
    color: Colors.gray700,
  },
  matchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    ...Typography.tiny,
    color: Colors.white,
    fontWeight: "600",
  },
  playersInfo: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  playersText: {
    ...Typography.small,
    color: Colors.gray700,
    fontWeight: "600",
  },
  organizerText: {
    ...Typography.tiny,
    color: Colors.gray500,
  },
  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
  },
  fullText: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: "700",
  },
});
