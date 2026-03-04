import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useState, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { router, useFocusEffect } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import Button from "../../components/Button";
import FootballField from "../../components/FootballField";
import FormationSelector from "../../components/FormationSelector";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { Formation } from "../../types";

type MatchData = {
  id: string;
  title?: string;
  location: string;
  date: Date;
  time: string;
  formation?: Formation;
  players?: Array<{ userId: string; userName: string; position?: string }>;
};

export default function Home() {
  const [nextMatch, setNextMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFormation, setSelectedFormation] =
    useState<Formation>("4-3-3");

  const loadNextMatch = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, "matches"));

      const allMatches: MatchData[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          location: data.location,
          date: data.date?.toDate?.() || new Date(data.date),
          time: data.time,
          formation: data.formation,
          players: data.players || [],
        };
      });

      const myMatches = allMatches.filter((m) =>
        m.players?.some((p) => p.userId === userId),
      );

      const upcoming = myMatches
        .filter((m) => m.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const lastPlayed = myMatches
        .filter((m) => m.date < new Date())
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const match = upcoming[0] || lastPlayed[0] || null;

      setNextMatch(match);
      if (match) {
        setSelectedFormation(match.formation || "4-3-3");
      }
    } catch (error) {
      console.error("Error loading match:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNextMatch();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNextMatch();
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const handlePlayerClick = (position: any) => {
    if (!nextMatch) return;

    const player = nextMatch.players?.find(
      (p) => p.position === position.position,
    );

    if (player) {
      router.push(`/user/${player.userId}` as any);
    } else {
      Alert.alert(
        "Empty Position",
        `No player at ${position.label}. Go to match details to manage lineup.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Match",
            onPress: () => router.push(`/match/${nextMatch.id}` as any),
          },
        ],
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {nextMatch
            ? nextMatch.date >= new Date()
              ? "Next Match"
              : "Last Match"
            : "Football Field"}
        </Text>
        <Text style={styles.subtitle}>
          {nextMatch
            ? nextMatch.title || nextMatch.location
            : "Join a match to see lineup."}
        </Text>
      </View>

      {nextMatch ? (
        <>
          <FormationSelector
            selected={selectedFormation}
            onSelect={setSelectedFormation}
          />

          <FootballField
            formation={selectedFormation}
            players={(nextMatch.players || []).map((p) => ({
              id: p.userId,
              name: p.userName,
              rating: 5,
              position: p.position as any,
            }))}
            editable={false}
            onPositionPress={handlePlayerClick}
          />

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push(`/match/${nextMatch.id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoTitle}>📅 Match Info</Text>
            <Text style={styles.infoText}>
              {nextMatch.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {nextMatch.time}
            </Text>
            <Text style={styles.infoText}>📍 {nextMatch.location}</Text>
            <Text style={styles.tapHint}>Tap to view match details</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚽</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Join or create a match to see the lineup here
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Find Matches"
          onPress={() => router.push("/(tabs)/search")}
          fullWidth
        />

        <Button
          title="Create Match"
          onPress={() => router.push("/(tabs)/create")}
          variant="outline"
          fullWidth
        />

        <Button
          title="Log out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={{ borderColor: "red" }}
          textStyle={{ color: "red" }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 80,
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 12,
    marginVertical: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body,
    color: Colors.gray600,
    marginTop: 4,
  },
  tapHint: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: "center",
  },
  actions: {
    gap: Spacing.md,
  },
});
