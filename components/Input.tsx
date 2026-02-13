import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Colors, BorderRadius, Typography, Spacing } from "../constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.gray400}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    ...Typography.small,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
