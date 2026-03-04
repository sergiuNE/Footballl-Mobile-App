import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";

const icons: Record<string, any> = {
  home: "home",
  search: "search",
  create: "add-circle",
  reserve: "calendar",
  notifications: "notifications",
  profile: "person",
};

const labels: Record<string, string> = {
  home: "Home",
  search: "Search",
  create: "Create",
  reserve: "Reserve",
  notifications: "Notifications",
  profile: "Profile",
};

export default function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={100}
      tint="extraLight"
      style={[styles.container, { paddingBottom: insets.bottom || 10 }]}
    >
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = icons[route.name] || "ellipse";
          const label = labels[route.name] || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabBarItem
              key={route.key}
              iconName={iconName}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

function TabBarItem({ iconName, label, isFocused, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.05 : 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.tab}
    >
      <Animated.View
        style={[
          styles.pillContainer,
          isFocused && styles.pillContainerActive,
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? Colors.primary : Colors.gray600}
        />
        <Text
          style={[styles.label, isFocused && styles.labelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  pillContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 50,
    backgroundColor: "transparent",
    minWidth: 70,
  },
  pillContainerActive: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  label: {
    ...Typography.tiny,
    fontSize: 11,
    color: Colors.gray600,
    marginTop: 4,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
