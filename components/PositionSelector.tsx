import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

type PositionSelectorProps = {
  selectedPositions: string[];
  onToggle: (position: string) => void;
};

const POSITIONS = [
  { id: 'GK', label: 'Goalkeeper', emoji: '🧤' },
  { id: 'DEF', label: 'Defender', emoji: '🛡️' },
  { id: 'MID', label: 'Midfielder', emoji: '⚡' },
  { id: 'ATT', label: 'Attacker', emoji: '⚽' },
];

export default function PositionSelector({ selectedPositions, onToggle }: PositionSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorite Positions</Text>
      <Text style={styles.subtitle}>Select the positions you prefer to play</Text>
      
      <View style={styles.grid}>
        {POSITIONS.map((pos) => {
          const isSelected = selectedPositions.includes(pos.id);
          
          return (
            <TouchableOpacity
              key={pos.id}
              style={[
                styles.positionCard,
                isSelected && styles.positionCardSelected,
              ]}
              onPress={() => onToggle(pos.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{pos.emoji}</Text>
              <Text style={[
                styles.positionLabel,
                isSelected && styles.positionLabelSelected,
              ]}>
                {pos.label}
              </Text>
              
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.gray500,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  positionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray200,
    ...Shadows.small,
  },
  positionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray50,
  },
  emoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  positionLabel: {
    ...Typography.body,
    color: Colors.gray700,
    textAlign: 'center',
  },
  positionLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});