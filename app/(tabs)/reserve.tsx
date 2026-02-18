import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type Field = { id: string; name: string; address: string };
type Reservation = { id: string; fieldId: string; fieldName: string; date: Date; timeSlot: string };

const DEFAULT_FIELDS: Field[] = [
  { id: 'veld1', name: 'Sportpark De Bosjes', address: 'Bosjes 1, Amsterdam' },
  { id: 'veld2', name: 'Complex Olympia', address: 'Olympiaweg 5, Rotterdam' },
  { id: 'veld3', name: 'VV Noord Veld 1', address: 'Noordlaan 12, Utrecht' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export default function ReserveScreen() {
  const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadFields();
    loadMyReservations();
  }, []);

  const loadFields = async () => {
    try {
      const snap = await getDocs(collection(db, 'fields'));
      if (!snap.empty) {
        setFields(snap.docs.map(d => ({ id: d.id, ...d.data() } as Field)));
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  const loadMyReservations = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'reservations'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const d_ = d.data();
        const date = d_.date?.toDate?.() ?? new Date(d_.date);
        return { id: d.id, fieldId: d_.fieldId, fieldName: d_.fieldName, date, timeSlot: d_.timeSlot };
      });
      setReservations(list);
    } catch {
      setReservations([]);
    }
  };

  const onDateChange = (_: unknown, value?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (value) setSelectedDate(value);
  };

  const handleReserve = async () => {
    if (!auth.currentUser || !selectedField || !selectedSlot) {
      Alert.alert('Fout', 'Kies een veld, datum en tijd.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'reservations'), {
        userId: auth.currentUser.uid,
        fieldId: selectedField.id,
        fieldName: selectedField.name,
        date: selectedDate,
        timeSlot: selectedSlot,
        createdAt: new Date(),
      });
      await loadMyReservations();
      Alert.alert('Gereserveerd', `${selectedField.name} op ${selectedDate.toLocaleDateString('nl-NL')} om ${selectedSlot}`);
      setSelectedSlot(null);
    } catch (e) {
      Alert.alert('Fout', 'Reserveren mislukt.');
    } finally {
      setSaving(false);
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
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Veld reserveren</Text>
        <Text style={styles.headerSubtitle}>Kies een veld, datum en tijd</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Veld</Text>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.card, selectedField?.id === f.id && styles.cardSelected]}
            onPress={() => setSelectedField(f)}
          >
            <Ionicons name="football-outline" size={24} color={selectedField?.id === f.id ? Colors.white : Colors.primary} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, selectedField?.id === f.id && styles.cardTitleSelected]}>{f.name}</Text>
              <Text style={[styles.cardSub, selectedField?.id === f.id && styles.cardSubSelected]}>{f.address}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Datum</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Ionicons name="calendar-outline" size={22} color={Colors.gray600} />
        </TouchableOpacity>

        {showDatePicker && (
          <Modal transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
            <View style={styles.modalContent}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={onDateChange}
                themeVariant="light"
              />
              <TouchableOpacity style={styles.modalDone} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalDoneText}>Klaar</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        <Text style={styles.sectionLabel}>Tijd</Text>
        <View style={styles.slots}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slot, selectedSlot === slot && styles.slotSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {auth.currentUser && (
          <TouchableOpacity
            style={[styles.reserveBtn, (!selectedField || !selectedSlot || saving) && styles.reserveBtnDisabled]}
            onPress={handleReserve}
            disabled={!selectedField || !selectedSlot || saving}
          >
            <Text style={styles.reserveBtnText}>{saving ? 'Bezig...' : 'Reserveren'}</Text>
          </TouchableOpacity>
        )}

        {reservations.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Mijn reserveringen</Text>
            {reservations.map((r) => (
              <View key={r.id} style={styles.resCard}>
                <Text style={styles.resTitle}>{r.fieldName}</Text>
                <Text style={styles.resMeta}>
                  {r.date.toLocaleDateString('nl-NL')} · {r.timeSlot}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  sectionLabel: { ...Typography.bodyBold, color: Colors.gray700, marginBottom: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#D1FAE5' },
  cardText: { marginLeft: Spacing.md, flex: 1 },
  cardTitle: { ...Typography.bodyBold, color: Colors.gray900 },
  cardTitleSelected: { color: Colors.primaryDark },
  cardSub: { ...Typography.small, color: Colors.gray600 },
  cardSubSelected: { color: Colors.gray700 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  dateText: { ...Typography.body, color: Colors.gray800 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: Colors.white, padding: Spacing.lg, paddingBottom: Spacing.xl },
  modalDone: { marginTop: Spacing.md, alignItems: 'flex-end' },
  modalDoneText: { ...Typography.bodyBold, color: Colors.primary },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  slot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
  },
  slotSelected: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  slotText: { ...Typography.body, color: Colors.gray800 },
  slotTextSelected: { color: Colors.white, fontWeight: '600' },
  reserveBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  reserveBtnDisabled: { backgroundColor: Colors.gray400, opacity: 0.8 },
  reserveBtnText: { ...Typography.bodyBold, color: Colors.white },
  resCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resTitle: { ...Typography.bodyBold, color: Colors.gray900 },
  resMeta: { ...Typography.small, color: Colors.gray600, marginTop: 4 },
});
