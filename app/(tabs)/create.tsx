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

  const skillLevels = [
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
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

      const timeString = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      await addDoc(collection(db, "matches"), {
        createdBy: auth.currentUser.uid,
        createdByName: userName,
        title: title.trim(),
        date,
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

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
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

        <Input
          label="Location *"
          placeholder="Central Park Field 3"
          value={location}
          onChangeText={setLocation}
        />

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
});
