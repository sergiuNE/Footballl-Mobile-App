import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from './Input';
import { Colors, Spacing, Typography } from '../constants/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  showStrength?: boolean;
};

export default function PasswordInput({ value, onChangeText, label = "Password", showStrength = false }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = () => {
    if (value.length === 0) return { text: '', color: Colors.gray400, width: '0%' as DimensionValue };
    if (value.length < 6) return { text: 'Weak', color: Colors.error, width: '33%' as DimensionValue };
    if (value.length < 10) return { text: 'Medium', color: Colors.warning, width: '66%' as DimensionValue };
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { text: 'Medium', color: Colors.warning, width: '66%' as DimensionValue };
    return { text: 'Strong', color: Colors.success, width: '100%' as DimensionValue };
  };

  const strength = getStrength();

  return (
    <View>
      <View style={styles.inputContainer}>
        <Input
          label={label}
          placeholder="Minimum 8 characters"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color={Colors.gray500} 
          />
        </TouchableOpacity>
      </View>
      
      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
          </View>
          <Text style={[styles.strengthText, { color: strength.color }]}>
            {strength.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    ...Typography.tiny,
    fontWeight: '600',
  },
});