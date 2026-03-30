import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { doc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { router } from "expo-router";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import PositionSelector from "../../components/PositionSelector";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { User } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = { uid: docSnap.id, ...docSnap.data() } as User;
          setUser(userData);
          setName(userData.name);
          setSelectedPositions(userData.positions || []);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error loading user:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleTogglePosition = (position: string) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter((p) => p !== position));
    } else {
      setSelectedPositions([...selectedPositions, position]);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!auth.currentUser) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      Alert.alert("Error", "Cloudinary env vars are missing.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: `avatar_${auth.currentUser.uid}.jpg`,
      } as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Cloudinary upload failed");
      }

      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { photoURL: data.secure_url },
        { merge: true },
      );

      Alert.alert("Success", "Profile photo updated!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Could not upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: name.trim(),
        positions: selectedPositions,
      });

      setEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Error", "Could not save profile.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No user found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={handlePickImage}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handlePickImage}
            disabled={uploadingPhoto}
          >
            <Ionicons name="camera" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {!editing && (
          <>
            <Text style={styles.headerName}>{user?.name || "User"}</Text>
            <Text style={styles.headerEmail}>{user?.email || ""}</Text>
          </>
        )}
      </LinearGradient>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{user.rating ?? 0}</Text>
          <Text style={styles.statLabel}>⭐ Rating</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{user.matchesPlayed || 0}</Text>
          <Text style={styles.statLabel}>⚽ Matches</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{user.positions?.length || 0}</Text>
          <Text style={styles.statLabel}>📍 Positions</Text>
        </Card>
      </View>

      {editing ? (
        <Card>
          <Text style={styles.sectionTitle}>Edit Profile</Text>

          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />

          <PositionSelector
            selectedPositions={selectedPositions}
            onToggle={handleTogglePosition}
          />

          <View style={styles.editActions}>
            <Button
              title="Save"
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={() => {
                setEditing(false);
                setName(user.name);
                setSelectedPositions(user.positions || []);
              }}
              variant="outline"
              fullWidth
            />
          </View>
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.infoHeader}>
              <Text style={styles.sectionTitle}>Profile Info</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Favorite Lineup</Text>
              <Text style={styles.infoValue}>{user.preferredFormation}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Positions</Text>
              <View style={styles.positionBadges}>
                {user.positions && user.positions.length > 0 ? (
                  user.positions.map((pos) => (
                    <View key={pos} style={styles.positionBadge}>
                      <Text style={styles.positionBadgeText}>{pos}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValueGray}>
                    No positions selected
                  </Text>
                )}
              </View>
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              title="Log out"
              onPress={handleLogout}
              variant="outline"
              fullWidth
              style={{ borderColor: "red" }}
              textStyle={{ color: "red" }}
            />
          </View>
        </>
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
    paddingTop: 80,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: -40,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...Shadows.large,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.medium,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.primary,
  },
  headerName: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerEmail: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl + 20,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.gray600,
    textAlign: "center",
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  editButtonText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: "600",
  },
  infoRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  infoLabel: {
    ...Typography.small,
    color: Colors.gray500,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.gray900,
  },
  infoValueGray: {
    ...Typography.body,
    color: Colors.gray400,
    fontStyle: "italic",
  },
  positionBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 4,
  },
  positionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  positionBadgeText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: "600",
  },
  editActions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
});
