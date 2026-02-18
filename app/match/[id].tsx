import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import type { Match, PlayerInMatch } from '../../types/match';
import { FOOTBALL_POSITIONS } from '../../constants/positions';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(dateVal: { seconds: number } | Date): string {
  if (!dateVal) return '–';
  const d = 'seconds' in dateVal ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [editingPlayers, setEditingPlayers] = useState<PlayerInMatch[]>([]);
  const [savingPositions, setSavingPositions] = useState(false);

  const loadMatch = async () => {
    if (!id) return;
    try {
      const ref = doc(db, 'matches', id);
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
      prev.map((p) => (p.userId === userId ? { ...p, position } : p))
    );
  };

  const savePositions = async () => {
    if (!match?.id) return;
    setSavingPositions(true);
    try {
      await updateDoc(doc(db, 'matches', match.id), { players: editingPlayers });
      await loadMatch();
      setShowPositionsModal(false);
    } catch {
      Alert.alert('Fout', 'Posities konden niet worden opgeslagen.');
    } finally {
      setSavingPositions(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !match?.id || !canJoin) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userName = (userDoc.data()?.name as string) || user.email || 'Speler';
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        players: arrayUnion({ userId: user.uid, userName }),
      });
      await loadMatch();
    } catch (e) {
      Alert.alert('Fout', 'Kon niet deelnemen. Probeer het later opnieuw.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !match?.id || !isJoined) return;
    const entry = players.find((p) => p.userId === user.uid);
    if (!entry) return;
    Alert.alert(
      'Wedstrijd verlaten',
      'Weet je zeker dat je wilt afmelden?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verlaten',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await updateDoc(doc(db, 'matches', match.id), {
                players: arrayRemove(entry),
              });
              await loadMatch();
            } catch {
              Alert.alert('Fout', 'Kon niet afmelden. Probeer het later opnieuw.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wedstrijd</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.empty}>Wedstrijd niet gevonden.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{match.title ?? match.location}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{formatDate(match.date as { seconds: number })}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{match.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{match.location}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Resultaat & statistieken</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.statsLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {match.homeScore != null && match.awayScore != null
                ? `${match.homeScore} - ${match.awayScore}`
                : '–'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.statsLabel}>Schoten op doel</Text>
            <Text style={styles.scoreValue}>
              {match.shotsOnTargetHome != null && match.shotsOnTargetAway != null
                ? `${match.shotsOnTargetHome} - ${match.shotsOnTargetAway}`
                : '–'}
            </Text>
          </View>
        </View>

        <View style={styles.lineupSection}>
          <View style={styles.lineupSectionHeader}>
            <Text style={styles.sectionTitle}>Opstelling</Text>
            {isCreator && players.length > 0 && (
              <TouchableOpacity style={styles.positionsBtn} onPress={openPositionsModal}>
                <Ionicons name="create-outline" size={18} color="#007AFF" />
                <Text style={styles.positionsBtnText}>Posities beheren</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.playersCount}>
            {players.length} / {match.maxPlayers} spelers
          </Text>
          {players.length === 0 ? (
            <Text style={styles.noPlayers}>Nog geen spelers ingeschreven.</Text>
          ) : (
            <View style={styles.lineupList}>
              {players.map((p: PlayerInMatch, index: number) => (
                <TouchableOpacity
                  key={p.userId}
                  style={styles.lineupRow}
                  onPress={() => router.push(`/user/${p.userId}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jersey}>
                    <Text style={styles.jerseyNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.playerName}>{p.userName}</Text>
                  {p.position ? (
                    <Text style={styles.position}>{p.position}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Modal visible={showPositionsModal} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPositionsModal(false)} />
          <View style={styles.positionsModalContent}>
            <Text style={styles.positionsModalTitle}>Posities beheren</Text>
            <ScrollView style={styles.positionsModalScroll}>
              {editingPlayers.map((p) => (
                <View key={p.userId} style={styles.positionRow}>
                  <Text style={styles.positionRowName} numberOfLines={1}>{p.userName}</Text>
                  <View style={styles.positionChips}>
                    {FOOTBALL_POSITIONS.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[styles.positionChip, p.position === pos && styles.positionChipSelected]}
                        onPress={() => setPlayerPosition(p.userId, p.position === pos ? '' : pos)}
                      >
                        <Text style={[styles.positionChipText, p.position === pos && styles.positionChipTextSelected]}>{pos}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.positionsModalActions}>
              <TouchableOpacity style={styles.positionsCancel} onPress={() => setShowPositionsModal(false)}>
                <Text style={styles.positionsCancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.positionsSave} onPress={savePositions} disabled={savingPositions}>
                <Text style={styles.positionsSaveText}>{savingPositions ? 'Bezig...' : 'Opslaan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {user && (
          <View style={styles.actions}>
            {canJoin && (
              <TouchableOpacity
                style={[styles.primaryButton, actionLoading && styles.buttonDisabled]}
                onPress={handleJoin}
                disabled={actionLoading}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {actionLoading ? 'Bezig...' : 'Deelnemen'}
                </Text>
              </TouchableOpacity>
            )}
            {isJoined && (
              <TouchableOpacity
                style={[styles.leaveButton, actionLoading && styles.buttonDisabled]}
                onPress={handleLeave}
                disabled={actionLoading}
              >
                <Ionicons name="person-remove" size={20} color="#ff3b30" />
                <Text style={styles.leaveButtonText}>
                  {actionLoading ? 'Bezig...' : 'Afmelden'}
                </Text>
              </TouchableOpacity>
            )}
            {!user && (
              <Text style={styles.loginHint}>Log in om deel te nemen.</Text>
            )}
            {isFull && !isJoined && (
              <Text style={styles.fullHint}>Deze wedstrijd is vol.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsLabel: {
    fontSize: 15,
    color: '#666',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  lineupSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  playersCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  noPlayers: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  lineupSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  positionsBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  positionsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  positionsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  positionsModalScroll: {
    maxHeight: 400,
    padding: 16,
  },
  positionRow: {
    marginBottom: 16,
  },
  positionRowName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  positionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  positionChipSelected: {
    backgroundColor: '#007AFF',
  },
  positionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  positionChipTextSelected: {
    color: '#fff',
  },
  positionsModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  positionsCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  positionsCancelText: {
    fontSize: 16,
    color: '#666',
  },
  positionsSave: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#34C759',
    borderRadius: 10,
  },
  positionsSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  lineupList: {
    gap: 10,
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jersey: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jerseyNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  position: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
  leaveButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  fullHint: {
    textAlign: 'center',
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    color: '#666',
    fontSize: 16,
  },
});
