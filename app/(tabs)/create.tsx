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
import { collection, addDoc } from "firebase/firestore";
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
  Shadows,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { doc, getDoc } from "firebase/firestore";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

export default function Create() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("22");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("all");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const skillLevels: { id: SkillLevel; label: string; emoji: string }[] = [
    { id: "all", label: "All Levels", emoji: "🌟" },
    { id: "beginner", label: "Beginner", emoji: "🟢" },
    { id: "intermediate", label: "Intermediate", emoji: "🟡" },
    { id: "advanced", label: "Advanced", emoji: "🔴" },
  ];

  const handleCreate = async () => {
    if (!title.trim() || !location.trim()) {
      Alert.alert("Error", "Fill in all required fields");
      return;
    }

    const playersCount = parseInt(maxPlayers);
    if (isNaN(playersCount) || playersCount < 2 || playersCount > 22) {
      Alert.alert("Error", "Max players must be between 2 and 22");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);
    try {
      // Haal naam op uit Firestore
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

      const timeString = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      await addDoc(collection(db, "matches"), {
        createdBy: auth.currentUser.uid,
        createdByName: userName, // Gebruik Firestore naam
        title: title.trim(),
        date: date,
        time: timeString,
        location: location.trim(),
        maxPlayers: playersCount,
        currentPlayers: 0,
        formation: "4-3-3",
        skillLevel,
        status: "open",
        players: [],
        createdAt: new Date(),
      });

      Alert.alert("Success", "Match created!", [
        { text: "OK", onPress: () => router.push("/(tabs)/search") },
      ]);

      setTitle("");
      setLocation("");
      setMaxPlayers("22");
      setDate(new Date());
      setTime(new Date());
      setSkillLevel("all");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not create match");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create New Match</Text>
        <Text style={styles.headerSubtitle}>Organize a football game</Text>
      </LinearGradient>

      {/* Form */}
      <Card>
        <Text style={styles.sectionTitle}>Match Details</Text>

        <Input
          label="Match Title *"
          placeholder="Friday Evening Game"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Location *"
          placeholder="Central Park Field 3"
          value={location}
          onChangeText={setLocation}
        />

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅{" "}
              {date.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              🕐{" "}
              {time.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Max Players *"
          placeholder="22"
          value={maxPlayers}
          onChangeText={setMaxPlayers}
          keyboardType="number-pad"
        />

        {/* Skill Level Selector */}
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
                onPress={() => setSkillLevel(level.id)}
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

      {/* Date Picker Modal (iOS) */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                textColor={Colors.gray900}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal (iOS) */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={Colors.gray900}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Android Time Picker */}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.lg,
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
  dateButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  dateButtonText: {
    ...Typography.body,
    color: Colors.gray900,
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
    backgroundColor: Colors.gray50,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalButton: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 18,
  },
  picker: {
    backgroundColor: Colors.white,
    height: 200,
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
