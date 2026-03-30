import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useState } from "react";
import {
  doc,
  getDoc,
  where,
  query,
  getDocs,
  collection,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { router } from "expo-router";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { createMatchUnique } from "../services/slotGuards";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useEffect } from "react";
import { Reservation } from "./reserve";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

const MATCH_LOCATIONS = [
  "Wilrijkse pleinen",
  "Deurne park",
  "Sportcomplex Middelheim",
  "Sportoase Borgerhout",
  "Voetbalvelden Ekeren",
  "Sportpark Luchtbal",
  "Complex Merksem",
  "Sportvelden Hoboken",
  "Kiel",
  "Park Spoor Noord",
  "Sportcomplex Wilrijk",
  "Atletiekpiste Linkeroever",
];

export default function Create() {
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("22");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("all");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(
    null,
  );

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const fetchReservations = async () => {
      const q = query(
        collection(db, "reservations"),
        where("userId", "==", uid),
      );
      const snap = await getDocs(q);
      const now = Date.now();
      setReservations(
        snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Reservation)
          .filter((r) => r.startsAtMs && r.startsAtMs > now),
      );
    };
    fetchReservations();
  }, []);

  const skillLevels = [
    { id: "all", label: "All Levels", emoji: "🌟" },
    { id: "beginner", label: "Beginner", emoji: "🟢" },
    { id: "intermediate", label: "Intermediate", emoji: "🟡" },
    { id: "advanced", label: "Advanced", emoji: "🔴" },
  ];

  const handleCreate = async () => {
    if (!title.trim() || !location.trim()) {
      Alert.alert("Error", "Fill in all required fields.");
      return;
    }

    const playersCount = parseInt(maxPlayers);
    if (isNaN(playersCount) || playersCount < 2 || playersCount > 22) {
      Alert.alert("Error", "Max players must be between 2 and 22.");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

      const fieldId = location
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const date = `${dateTime.getFullYear()}-${String(dateTime.getMonth() + 1).padStart(2, "0")}-${String(dateTime.getDate()).padStart(2, "0")}`;
      const time = `${String(dateTime.getHours()).padStart(2, "0")}:00`;

      await createMatchUnique({
        fieldId,
        date,
        time,
        ownerId: auth.currentUser.uid,
        reservationId: selectedReservation?.id || null,

        createdBy: auth.currentUser.uid,
        createdByName: userName,
        title: title.trim(),
        dateTime,
        location: location.trim(),
        maxPlayers: playersCount,
        currentPlayers: 0,
        formation: "4-3-3",
        skillLevel,
        status: "open",
        players: [],
      });

      Alert.alert("Success", "Match created!", [
        { text: "OK", onPress: () => router.push("/(tabs)/search") },
      ]);

      setTitle("");
      setLocation("");
      setMaxPlayers("22");
      setDateTime(new Date());
      setSkillLevel("all");
    } catch (e: any) {
      if (e.message === "MATCH_SLOT_TAKEN") {
        Alert.alert(
          "Error",
          "There is already a match for this field and time.",
        );
      } else {
        Alert.alert("Error", "Something went wrong while creating the match.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = () => {
    setPickerMode("date");
    setShowPicker(true);
  };

  const openTimePicker = () => {
    setPickerMode("time");
    setShowPicker(true);
  };

  const handlePickerChange = (_: unknown, value?: Date) => {
    if (!value) {
      if (Platform.OS === "android") setShowPicker(false);
      return;
    }
    if (pickerMode === "date") {
      const next = new Date(dateTime);
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      setDateTime(next);
    } else {
      const next = new Date(dateTime);
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      setDateTime(next);
    }
  };

  const confirmPicker = () => {
    if (pickerMode === "date") {
      setPickerMode("time");
    } else {
      setShowPicker(false);
      setPickerMode("date");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create New Match</Text>
        <Text style={styles.headerSubtitle}>Organize a football game</Text>
      </LinearGradient>

      <Card>
        <Text style={styles.sectionTitle}>Match Details</Text>

        <Input
          label="Match Title *"
          placeholder="Friday Evening Game"
          value={title}
          onChangeText={setTitle}
        />

        {reservations.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Link with reservation (optional)</Text>
            <View style={styles.reservationPicker}>
              <Picker
                style={{ color: Colors.gray800 }}
                itemStyle={{ fontSize: 13, color: Colors.gray800 }}
                selectedValue={selectedReservation?.id || ""}
                onValueChange={(itemValue) => {
                  const found = reservations.find((r) => r.id === itemValue);
                  setSelectedReservation(found || null);
                  if (found) {
                    setLocation(found.fieldName);
                    setDateTime(new Date(found.startsAtMs));
                  }
                }}
              >
                <Picker.Item label="None" value="" />
                {reservations.map((r) => (
                  <Picker.Item
                    key={r.id}
                    label={`${r.fieldName}  ·  ${r.date} ${r.timeSlot || r.time}`}
                    value={r.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Locatie *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationsScroll}
          >
            {MATCH_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationChip,
                  location === loc && styles.locationChipSelected,
                  selectedReservation && styles.locationChipDisabled,
                ]}
                onPress={() => !selectedReservation && setLocation(loc)}
                disabled={!!selectedReservation}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    location === loc && styles.locationChipTextSelected,
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Datum & tijd *</Text>
          <TouchableOpacity
            style={[
              styles.dateTimeRow,
              selectedReservation && styles.dateTimeRowDisabled, // ← nieuw
            ]}
            onPress={openDatePicker}
            activeOpacity={0.7}
            disabled={!!selectedReservation} // ← nieuw
          >
            <Text style={styles.dateTimeText}>
              {dateTime.toLocaleDateString("nl-NL", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" · "}
              {dateTime.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.pickerBar}>
              <TouchableOpacity
                onPress={Platform.OS === "ios" ? openDatePicker : undefined}
              >
                <Text
                  style={[
                    styles.pickerTab,
                    pickerMode === "date" && styles.pickerTabActive,
                  ]}
                >
                  Datum
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={Platform.OS === "ios" ? openTimePicker : undefined}
              >
                <Text
                  style={[
                    styles.pickerTab,
                    pickerMode === "time" && styles.pickerTabActive,
                  ]}
                >
                  Tijd
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={confirmPicker}
              >
                <Text style={styles.pickerDoneText}>Klaar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={dateTime}
                mode={pickerMode}
                display="spinner"
                minimumDate={new Date()}
                onChange={handlePickerChange}
                themeVariant="light"
                style={Platform.OS === "ios" ? styles.iosPicker : undefined}
              />
            </View>
          </View>
        </Modal>

        <Input
          label="Max Players *"
          placeholder="22"
          value={maxPlayers}
          onChangeText={setMaxPlayers}
          keyboardType="number-pad"
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.skillGrid}>
            {skillLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.skillCard,
                  skillLevel === level.id && styles.skillCardSelected,
                ]}
                onPress={() => setSkillLevel(level.id as SkillLevel)}
              >
                <Text style={styles.skillEmoji}>{level.emoji}</Text>
                <Text
                  style={[
                    styles.skillLabel,
                    skillLevel === level.id && styles.skillLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Create Match"
          onPress={handleCreate}
          loading={loading}
          fullWidth
        />
      </Card>
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
    paddingBottom: 120,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.white,
  },
  headerSubtitle: {
    ...Typography.body,
    color: "rgba(255,255,255,0.9)",
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
  },
  skillCardSelected: {
    borderColor: Colors.primary,
  },
  skillEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  skillLabel: {
    ...Typography.small,
    color: Colors.gray700,
    textAlign: "center",
  },
  skillLabelSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  locationsScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  locationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  locationChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  locationChipText: {
    ...Typography.small,
    color: Colors.gray700,
    fontWeight: "500",
  },
  locationChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: "600",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  dateTimeText: {
    ...Typography.body,
    color: Colors.gray800,
    flex: 1,
  },
  dateTimeHint: {
    ...Typography.small,
    color: Colors.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  pickerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  pickerTab: {
    ...Typography.body,
    color: Colors.gray500,
    paddingVertical: Spacing.xs,
  },
  pickerTabActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  pickerDone: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  pickerDoneText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  pickerWrapper: {
    backgroundColor: Colors.white,
    minHeight: 200,
  },
  iosPicker: {
    height: 200,
  },
  reservationPicker: {
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
  },
  locationChipDisabled: {
    opacity: 0.4,
  },
  dateTimeRowDisabled: {
    opacity: 0.4,
  },
});
