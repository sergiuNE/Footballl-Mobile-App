import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import type { Match, PlayerInMatch } from "../../types/match";
import { FOOTBALL_POSITIONS } from "../../constants/positions";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import Card from "../../components/Card";

function formatDate(dateVal: { seconds: number } | Date): string {
  if (!dateVal) return "–";
  const d =
    "seconds" in dateVal ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [editingPlayers, setEditingPlayers] = useState<PlayerInMatch[]>([]);
  const [savingPositions, setSavingPositions] = useState(false);

  const loadMatch = async () => {
    if (!id) return;
    try {
      const ref = doc(db, "matches", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setMatch(null);
        return;
      }
      const data = snap.data();
      setMatch({
        id: snap.id,
        ...data,
        title: data.title,
        date: data.date,
        players: data.players ?? [],
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        shotsOnTargetHome: data.shotsOnTargetHome,
        shotsOnTargetAway: data.shotsOnTargetAway,
      } as Match);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatch();
  }, [id]);

  const user = auth.currentUser;
  const players = match?.players ?? [];
  const isCreator = user && match?.createdBy === user.uid;
  const isJoined = user && players.some((p) => p.userId === user.uid);
  const isFull = (match?.players?.length ?? 0) >= (match?.maxPlayers ?? 0);
  const canJoin = user && !isJoined && !isFull;

  const openPositionsModal = () => {
    setEditingPlayers(players.map((p) => ({ ...p })));
    setShowPositionsModal(true);
  };

  const setPlayerPosition = (userId: string, position: string) => {
    setEditingPlayers((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, position } : p)),
    );
  };

  const savePositions = async () => {
    if (!match?.id) return;
    setSavingPositions(true);
    try {
      await updateDoc(doc(db, "matches", match.id), {
        players: editingPlayers,
      });
      await loadMatch();
      setShowPositionsModal(false);
      Alert.alert("Success", "Positions saved!");
    } catch {
      Alert.alert("Error", "Could not save positions.");
    } finally {
      setSavingPositions(false);
    }
  };

  const handleJoin = () => {
    setShowPositionPicker(true);
  };

  const confirmJoin = async () => {
    if (!user || !match?.id || !canJoin) return;

    if (!selectedPosition) {
      Alert.alert("Error", "Please select a position first!");
      return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userName = (userDoc.data()?.name as string) || user.email || "Player";

    setActionLoading(true);
    try {
      await updateDoc(doc(db, "matches", match.id), {
        players: arrayUnion({
          userId: user.uid,
          userName,
          position: selectedPosition,
        }),
      });
      await loadMatch();
      setShowPositionPicker(false);
      setSelectedPosition("");
      Alert.alert("Success", "You joined the match!");
      router.push("/(tabs)/home");
    } catch (e) {
      Alert.alert("Error", "Could not join. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !match?.id || !isJoined) return;
    const entry = players.find((p) => p.userId === user.uid);
    if (!entry) return;
    Alert.alert("Leave Match", "Are you sure you want to leave this match?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await updateDoc(doc(db, "matches", match.id), {
              players: arrayRemove(entry),
            });
            await loadMatch();
          } catch {
            Alert.alert("Error", "Could not leave. Please try again.");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.empty}>Match not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {match.title ?? match.location}
          </Text>
          <Text style={styles.headerSubtitle}>Match Details</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(match.date as { seconds: number })}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{match.time}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{match.location}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Match Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>
                {match.homeScore != null && match.awayScore != null
                  ? `${match.homeScore} - ${match.awayScore}`
                  : "–"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Shots on Target</Text>
              <Text style={styles.statValue}>
                {match.shotsOnTargetHome != null &&
                match.shotsOnTargetAway != null
                  ? `${match.shotsOnTargetHome} - ${match.shotsOnTargetAway}`
                  : "–"}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.lineupCard}>
          <View style={styles.lineupHeader}>
            <View>
              <Text style={styles.sectionTitle}>Squad</Text>
              <Text style={styles.playersCount}>
                {players.length} / {match.maxPlayers} players
              </Text>
            </View>
            {isCreator && players.length > 0 && (
              <TouchableOpacity
                style={styles.manageBtn}
                onPress={openPositionsModal}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.manageBtnText}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyPlayers}>
              <Ionicons
                name="people-outline"
                size={48}
                color={Colors.gray300}
              />
              <Text style={styles.noPlayers}>No players yet</Text>
              <Text style={styles.noPlayersHint}>Be the first to join!</Text>
            </View>
          ) : (
            <View style={styles.lineupList}>
              {players.map((p: PlayerInMatch, index: number) => (
                <TouchableOpacity
                  key={p.userId}
                  style={styles.playerRow}
                  onPress={() => router.push(`/user/${p.userId}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerLeft}>
                    <View style={styles.jersey}>
                      <Text style={styles.jerseyNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.playerName}>{p.userName}</Text>
                  </View>
                  <View style={styles.playerRight}>
                    {p.position && (
                      <View style={styles.positionBadge}>
                        <Text style={styles.positionText}>{p.position}</Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.gray400}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Position Picker Modal (for joining) */}
        <Modal visible={showPositionPicker} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowPositionPicker(false);
              setSelectedPosition("");
            }}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Position</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPositionPicker(false);
                  setSelectedPosition("");
                }}
              >
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.positionChips}>
                {FOOTBALL_POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.positionChip,
                      selectedPosition === pos && styles.positionChipSelected,
                    ]}
                    onPress={() => setSelectedPosition(pos)}
                  >
                    <Text
                      style={[
                        styles.positionChipText,
                        selectedPosition === pos &&
                          styles.positionChipTextSelected,
                      ]}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowPositionPicker(false);
                  setSelectedPosition("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSave,
                  (!selectedPosition || actionLoading) && styles.btnDisabled,
                ]}
                onPress={confirmJoin}
                disabled={!selectedPosition || actionLoading}
              >
                <Text style={styles.modalSaveText}>
                  {actionLoading ? "Joining..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Manage Positions Modal */}
        <Modal visible={showPositionsModal} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPositionsModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Positions</Text>
              <TouchableOpacity onPress={() => setShowPositionsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              {editingPlayers.map((p) => (
                <View key={p.userId} style={styles.positionRow}>
                  <Text style={styles.positionRowName}>{p.userName}</Text>
                  <View style={styles.positionChips}>
                    {FOOTBALL_POSITIONS.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[
                          styles.positionChip,
                          p.position === pos && styles.positionChipSelected,
                        ]}
                        onPress={() =>
                          setPlayerPosition(
                            p.userId,
                            p.position === pos ? "" : pos,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.positionChipText,
                            p.position === pos &&
                              styles.positionChipTextSelected,
                          ]}
                        >
                          {pos}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowPositionsModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={savePositions}
                disabled={savingPositions}
              >
                <Text style={styles.modalSaveText}>
                  {savingPositions ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {user && (
          <View style={styles.actions}>
            {canJoin && (
              <TouchableOpacity
                style={[styles.joinBtn, actionLoading && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={[Colors.success, "#059669"]}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="person-add" size={20} color={Colors.white} />
                  <Text style={styles.joinBtnText}>Join Match</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isJoined && (
              <TouchableOpacity
                style={[styles.leaveBtn, actionLoading && styles.btnDisabled]}
                onPress={handleLeave}
                disabled={actionLoading}
              >
                <Ionicons name="person-remove" size={20} color={Colors.error} />
                <Text style={styles.leaveBtnText}>
                  {actionLoading ? "Leaving..." : "Leave Match"}
                </Text>
              </TouchableOpacity>
            )}

            {!user && (
              <Text style={styles.loginHint}>Log in to join this match.</Text>
            )}

            {isFull && !isJoined && (
              <View style={styles.fullBanner}>
                <Ionicons name="lock-closed" size={20} color={Colors.white} />
                <Text style={styles.fullText}>This match is full</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: { flex: 1 },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.small,
    color: "rgba(255, 255, 255, 0.9)",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  infoCard: { marginBottom: Spacing.md },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: {
    ...Typography.small,
    color: Colors.gray500,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyBold,
    color: Colors.gray900,
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
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.gray500,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: "700",
  },
  lineupCard: { marginBottom: Spacing.md },
  lineupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  playersCount: {
    ...Typography.small,
    color: Colors.gray500,
    marginTop: 2,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  manageBtnText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: "600",
  },
  emptyPlayers: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  noPlayers: {
    ...Typography.bodyBold,
    color: Colors.gray600,
    marginTop: Spacing.md,
  },
  noPlayersHint: {
    ...Typography.small,
    color: Colors.gray400,
    marginTop: 4,
  },
  lineupList: { gap: 0 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  jersey: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  jerseyNumber: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  playerName: {
    ...Typography.body,
    color: Colors.gray900,
    fontWeight: "600",
    flex: 1,
  },
  playerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  positionBadge: {
    backgroundColor: Colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  positionText: {
    ...Typography.tiny,
    color: Colors.gray700,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  modalScroll: { maxHeight: 400 },
  modalScrollContent: { padding: Spacing.lg },
  positionRow: {
    marginBottom: Spacing.lg,
  },
  positionRowName: {
    ...Typography.bodyBold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  positionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  positionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  positionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  positionChipText: {
    ...Typography.small,
    color: Colors.gray700,
    fontWeight: "600",
  },
  positionChipTextSelected: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  modalCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalCancelText: {
    ...Typography.bodyBold,
    color: Colors.gray600,
  },
  modalSave: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalSaveText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  actions: {
    gap: Spacing.md,
  },
  joinBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadows.medium,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  joinBtnText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  leaveBtnText: {
    ...Typography.bodyBold,
    color: Colors.error,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginHint: {
    ...Typography.body,
    textAlign: "center",
    color: Colors.gray500,
  },
  fullBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fullText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  empty: {
    ...Typography.body,
    color: Colors.gray500,
  },
});
