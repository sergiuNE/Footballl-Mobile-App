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
} from "react-native";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";

type Field = { id: string; name: string; address: string };
type Reservation = {
  id: string;
  fieldId: string;
  fieldName: string;
  date: Date;
  timeSlot: string;
};

const DEFAULT_FIELDS: Field[] = [
  {
    id: "wilrijk-pleinen",
    name: "Wilrijkse Pleinen",
    address: "Wilrijk, Antwerp",
  },
  { id: "deurne-park", name: "Deurne Park", address: "Deurne, Antwerp" },
  {
    id: "sportcomplex-middelheim",
    name: "Middelheim Sports Complex",
    address: "Middelheimlaan, Antwerp",
  },
  {
    id: "sportoase-borgerhout",
    name: "Sportoase Borgerhout",
    address: "Borgerhout, Antwerp",
  },
  {
    id: "voetbalvelden-ekeren",
    name: "Ekeren Football Fields",
    address: "Ekeren, Antwerp",
  },
  {
    id: "sportpark-luchtbal",
    name: "Luchtbal Sports Park",
    address: "Luchtbal, Antwerp",
  },
  {
    id: "complex-merksem",
    name: "Merksem Complex",
    address: "Merksem, Antwerp",
  },
  {
    id: "sportvelden-hoboken",
    name: "Hoboken Sports Fields",
    address: "Hoboken, Antwerp",
  },
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

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
      const snap = await getDocs(collection(db, "fields"));
      if (!snap.empty) {
        setFields(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Field));
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
        collection(db, "reservations"),
        where("userId", "==", auth.currentUser.uid),
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const d_ = d.data();
        const date = d_.date?.toDate?.() ?? new Date(d_.date);
        return {
          id: d.id,
          fieldId: d_.fieldId,
          fieldName: d_.fieldName,
          date,
          timeSlot: d_.timeSlot,
        };
      });
      setReservations(list);
    } catch {
      setReservations([]);
    }
  };

  const onDateChange = (_: unknown, value?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (value) setSelectedDate(value);
  };

  const handleReserve = async () => {
    if (!auth.currentUser || !selectedField || !selectedSlot) {
      Alert.alert("Error", "Choose a field, date and time.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "reservations"), {
        userId: auth.currentUser.uid,
        fieldId: selectedField.id,
        fieldName: selectedField.name,
        date: selectedDate,
        timeSlot: selectedSlot,
        createdAt: new Date(),
      });
      await loadMyReservations();
      Alert.alert(
        "Reserved",
        `${selectedField.name} on ${selectedDate.toLocaleDateString("en-US")} at ${selectedSlot}`,
      );
      setSelectedSlot(null);
    } catch (e) {
      Alert.alert("Error", "Reservation failed.");
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
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Reserve a Field</Text>
          <Text style={styles.headerSubtitle}>
            Choose a field, date and time
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Field</Text>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.fieldCard,
              selectedField?.id === f.id && styles.fieldCardSelected,
            ]}
            onPress={() => setSelectedField(f)}
          >
            <View
              style={[
                styles.fieldIcon,
                selectedField?.id === f.id && styles.fieldIconSelected,
              ]}
            >
              <Ionicons
                name="football"
                size={24}
                color={
                  selectedField?.id === f.id ? Colors.white : Colors.primary
                }
              />
            </View>
            <View style={styles.fieldText}>
              <Text
                style={[
                  styles.fieldTitle,
                  selectedField?.id === f.id && styles.fieldTitleSelected,
                ]}
              >
                {f.name}
              </Text>
              <Text
                style={[
                  styles.fieldSub,
                  selectedField?.id === f.id && styles.fieldSubSelected,
                ]}
              >
                {f.address}
              </Text>
            </View>
            {selectedField?.id === f.id && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Date</Text>
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={22} color={Colors.gray600} />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
        </TouchableOpacity>

        {showDatePicker && (
          <Modal transparent animationType="slide">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={onDateChange}
                themeVariant="light"
              />
            </View>
          </Modal>
        )}

        <Text style={styles.sectionLabel}>Time</Text>
        <View style={styles.slots}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slot,
                selectedSlot === slot && styles.slotSelected,
              ]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlot === slot && styles.slotTextSelected,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {auth.currentUser && (
          <TouchableOpacity
            style={[
              styles.reserveBtn,
              (!selectedField || !selectedSlot || saving) &&
                styles.reserveBtnDisabled,
            ]}
            onPress={handleReserve}
            disabled={!selectedField || !selectedSlot || saving}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.reserveBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.white}
              />
              <Text style={styles.reserveBtnText}>
                {saving ? "Reserving..." : "Reserve Field"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {reservations.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
              My Reservations
            </Text>
            {reservations.map((r) => (
              <Card key={r.id} style={styles.resCard}>
                <View style={styles.resHeader}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                  <Text style={styles.resTitle}>{r.fieldName}</Text>
                </View>
                <View style={styles.resMeta}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={Colors.gray500}
                  />
                  <Text style={styles.resMetaText}>
                    {r.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.gray500}
                  />
                  <Text style={styles.resMetaText}>{r.timeSlot}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingTop: 80,
    paddingBottom: 120,
    paddingHorizontal: Spacing.lg,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingVertical: Spacing.xl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: { ...Typography.body, color: "rgba(255,255,255,0.9)" },
  sectionLabel: {
    ...Typography.h3,
    color: Colors.gray900,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  fieldCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.gray200,
    ...Shadows.small,
  },
  fieldCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray50,
  },
  fieldIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  fieldIconSelected: {
    backgroundColor: Colors.primary,
  },
  fieldText: { flex: 1 },
  fieldTitle: { ...Typography.bodyBold, color: Colors.gray900 },
  fieldTitleSelected: { color: Colors.primary },
  fieldSub: { ...Typography.small, color: Colors.gray500, marginTop: 2 },
  fieldSubSelected: { color: Colors.gray600 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  dateText: { ...Typography.body, color: Colors.gray800, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: { ...Typography.h3, color: Colors.gray900 },
  modalDone: { ...Typography.bodyBold, color: Colors.primary },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  slot: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  slotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: { ...Typography.bodyBold, color: Colors.gray700 },
  slotTextSelected: { color: Colors.white },
  reserveBtn: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  reserveBtnText: { ...Typography.bodyBold, color: Colors.white },
  resCard: {
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  resHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  resTitle: { ...Typography.bodyBold, color: Colors.gray900 },
  resMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  resMetaText: {
    ...Typography.small,
    color: Colors.gray600,
    marginRight: Spacing.sm,
  },
});
