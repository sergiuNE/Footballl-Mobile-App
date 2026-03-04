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
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
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
import DateTimePicker from "@react-native-community/datetimepicker";

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

      const timeString = dateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      await addDoc(collection(db, "matches"), {
        createdBy: auth.currentUser.uid,
        createdByName: userName,
        title: title.trim(),
        date: dateTime,
        time: timeString,
        location: location.trim(),
        maxPlayers: playersCount,
        currentPlayers: 1,
        formation: "4-3-3",
        skillLevel,
        status: "open",
        players: [{ userId: auth.currentUser.uid, userName }],
        createdAt: new Date(),
      });

      Alert.alert("Success", "Match created!", [
        { text: "OK", onPress: () => router.push("/(tabs)/search") },
      ]);

      setTitle("");
      setLocation("");
      setMaxPlayers("22");
      setDateTime(new Date());
      setSkillLevel("all");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not create match.");
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
                ]}
                onPress={() => setLocation(loc)}
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
            style={styles.dateTimeRow}
            onPress={openDatePicker}
            activeOpacity={0.7}
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
            <Text style={styles.dateTimeHint}>Kies datum en tijd</Text>
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
});
