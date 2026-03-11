import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import Button from "../../components/Button";
import Input from "../../components/Input";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { FOOTBALL_POSITIONS } from "../../constants/positions";
import { Formation } from "../../types";
import PasswordInput from "../../components/PasswordInput";

const FORMATIONS: Formation[] = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedFormation, setSelectedFormation] =
    useState<Formation>("4-3-3");
  const [loading, setLoading] = useState(false);

  const togglePosition = (pos: string) => {
    if (selectedPositions.includes(pos)) {
      setSelectedPositions(selectedPositions.filter((p) => p !== pos));
    } else {
      setSelectedPositions([...selectedPositions, pos]);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (selectedPositions.length === 0) {
      Alert.alert("Error", "Select at least one position");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Use at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert("Weak Password", "Include at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert("Weak Password", "Include at least one number");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name.trim(),
        email,
        rating: 5.0,
        positions: selectedPositions,
        preferredFormation: selectedFormation,
        matchesPlayed: 0,
        goals: 0,
        createdAt: new Date(),
      });

      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  return (
    <LinearGradient
      colors={[Colors.gray50, Colors.white]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚽</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start playing football!</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <PasswordInput
              value={password}
              onChangeText={setPassword}
              label="Password"
              showStrength
            />

            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              label="Confirm Password"
              showStrength={false}
            />

            {confirmPassword.length > 0 && (
              <Text
                style={[
                  styles.matchText,
                  { color: passwordsMatch ? Colors.success : Colors.error },
                ]}
              >
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </Text>
            )}

            <Text style={styles.label}>Positions *</Text>
            <View style={styles.positionsGrid}>
              {FOOTBALL_POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.posChip,
                    selectedPositions.includes(pos) && styles.posChipSelected,
                  ]}
                  onPress={() => togglePosition(pos)}
                >
                  <Text
                    style={[
                      styles.posText,
                      selectedPositions.includes(pos) && styles.posTextSelected,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Preferred Formation</Text>
            <View style={styles.formationsRow}>
              {FORMATIONS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.formChip,
                    selectedFormation === f && styles.formChipSelected,
                  ]}
                  onPress={() => setSelectedFormation(f)}
                >
                  <Text
                    style={[
                      styles.formText,
                      selectedFormation === f && styles.formTextSelected,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              fullWidth
            />

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Link href="/(auth)/login">
                <Text style={styles.link}>Login here</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: { fontSize: 40 },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  form: { width: "100%" },
  label: {
    ...Typography.bodyBold,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  matchText: {
    ...Typography.small,
    fontWeight: "600",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  positionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  posChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  posChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  posText: {
    ...Typography.small,
    color: Colors.gray700,
    fontWeight: "600",
  },
  posTextSelected: {
    color: Colors.white,
  },
  formationsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  formChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  formChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formText: {
    ...Typography.small,
    color: Colors.gray700,
    fontWeight: "600",
  },
  formTextSelected: {
    color: Colors.white,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  linkText: {
    ...Typography.body,
    color: Colors.gray600,
  },
  link: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
});
