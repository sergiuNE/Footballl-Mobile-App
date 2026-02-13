import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Formation } from '../types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

type FormationSelectorProps = {
  selected: Formation;
  onSelect: (formation: Formation) => void;
};

const FORMATIONS: Formation[] = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];

const FORMATION_INFO: Record<Formation, { name: string; description: string }> = {
  '4-3-3': {
    name: '4-3-3',
    description: 'Attacking',
  },
  '4-4-2': {
    name: '4-4-2',
    description: 'Balanced',
  },
  '3-5-2': {
    name: '3-5-2',
    description: 'Control',
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    description: 'Modern',
  },
};

export default function FormationSelector({ selected, onSelect }: FormationSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Formation</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FORMATIONS.map((formation) => {
          const isSelected = selected === formation;
          const info = FORMATION_INFO[formation];
          
          return (
            <TouchableOpacity
              key={formation}
              style={[
                styles.formationCard,
                isSelected && styles.formationCardSelected,
              ]}
              onPress={() => onSelect(formation)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.badge,
                isSelected && styles.badgeSelected,
              ]}>
                <Text style={[
                  styles.formationText,
                  isSelected && styles.formationTextSelected,
                ]}>
                  {info.name}
                </Text>
              </View>
              
              <Text style={[
                styles.description,
                isSelected && styles.descriptionSelected,
              ]}>
                {info.description}
              </Text>
              
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.md,
  },
  formationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray200,
    ...Shadows.small,
  },
  formationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray50,
  },
  badge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  badgeSelected: {
    backgroundColor: Colors.primary,
  },
  formationText: {
    ...Typography.bodyBold,
    color: Colors.gray700,
  },
  formationTextSelected: {
    color: Colors.white,
  },
  description: {
    ...Typography.small,
    color: Colors.gray500,
    textAlign: 'center',
  },
  descriptionSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});