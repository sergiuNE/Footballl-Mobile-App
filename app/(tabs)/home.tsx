import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { router } from "expo-router";
import Button from "../../components/Button";
import FootballField from "../../components/FootballField";
import FormationSelector from "../../components/FormationSelector";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { Player, Formation } from "../../types";

// Test data
const testPlayers: Player[] = [
  { id: "1", name: "Sergiu", rating: 8, position: "GK" },
  { id: "2", name: "Rayane", rating: 9, position: "CB1" },
  { id: "3", name: "John", rating: 7, position: "ST1" },
  { id: "4", name: "Mike", rating: 8, position: "CM2" },
  { id: "5", name: "Alex", rating: 6, position: "LW" },
];

export default function Home() {
  const [selectedFormation, setSelectedFormation] =
    useState<Formation>("4-3-3");

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Football Field</Text>
        <Text style={styles.subtitle}>View and manage your lineup</Text>
      </View>

      {/* Formation Selector */}
      <FormationSelector
        selected={selectedFormation}
        onSelect={setSelectedFormation}
      />

      {/* Football Field */}
      <FootballField
        formation={selectedFormation}
        players={testPlayers}
        editable
        onPositionPress={(pos) => {
          console.log("Position clicked:", pos);
        }}
      />

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Tip</Text>
        <Text style={styles.infoText}>
          Click on a position to add or change a player
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="New Match"
          onPress={() => router.push("/(tabs)/create")}
          fullWidth
        />

        <Button
          title="Log out"
          onPress={handleLogout}
          variant="outline"
          fullWidth
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
    ...StyleSheet.create({
      shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }).shadow,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.small,
    color: Colors.gray600,
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.md,
  },
});
