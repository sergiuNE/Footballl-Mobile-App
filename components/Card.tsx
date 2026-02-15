import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Colors, BorderRadius, Spacing, Shadows } from "../constants/theme";

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; 
  noPadding?: boolean;
};

export default function Card({
  children,
  style,
  noPadding = false,
}: CardProps) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  noPadding: {
    padding: 0,
  },
});