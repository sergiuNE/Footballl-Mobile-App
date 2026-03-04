import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '../constants/theme';
import { Formation, Player, FieldPosition } from '../types';
import { FORMATIONS } from '../constants/formations';

type FootballFieldProps = {
  formation: Formation;
  players?: Player[];
  onPositionPress?: (position: FieldPosition) => void;
  editable?: boolean;
};

const FIELD_WIDTH = Dimensions.get('window').width - 32;
const FIELD_HEIGHT = FIELD_WIDTH * 1.4; // Footballfield ratio

export default function FootballField({ 
  formation, 
  players = [],
  onPositionPress,
  editable = false,
}: FootballFieldProps) {
  
  const positions = FORMATIONS[formation];

  const getPlayerAtPosition = (position: string) => {
    return players.find(p => p.position === position);
  };

  return (
    <View style={styles.container}>
      {/* Field background */}
      <View style={styles.field}>
        {/* Mid line */}
        <View style={styles.midLine} />
        
        {/* Mid circel */}
        <View style={styles.centerCircle} />
        
        {/* Penalty boxes */}
        <View style={[styles.penaltyBox, styles.penaltyBoxTop]} />
        <View style={[styles.penaltyBox, styles.penaltyBoxBottom]} />
        
        {/* Players positions */}
        {positions.map((pos) => {
          const player = getPlayerAtPosition(pos.position);
          
          return (
            <TouchableOpacity
              key={pos.position}
              style={[
                styles.playerContainer,
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                },
              ]}
              onPress={() => onPositionPress?.(pos)}
              disabled={!editable && !player}
              activeOpacity={0.7}
            >
              {/* Player circel */}
              <View style={[
                styles.playerCircle,
                player ? styles.playerFilled : styles.playerEmpty,
              ]}>
                {player ? (
                  <Text style={styles.playerInitial}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <Text style={styles.plusIcon}>+</Text>
                )}
              </View>
              
              {/* Rating badge */}
              {player && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{player.rating}</Text>
                </View>
              )}
              
              {/* Position label */}
              <View style={styles.positionLabel}>
                <Text style={styles.positionText}>{pos.label}</Text>
              </View>
              
              {/* Player name */}
              {player && (
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Formation label */}
      <View style={styles.formationBadge}>
        <Text style={styles.formationText}>{formation}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    backgroundColor: '#16a34a', // Gras
    borderRadius: BorderRadius.lg,
    borderWidth: 3,
    borderColor: Colors.white,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.large,
  },
  midLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  penaltyBox: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    height: '15%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  penaltyBoxTop: {
    top: 0,
    borderTopWidth: 0,
  },
  penaltyBoxBottom: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    ...Shadows.medium,
  },
  playerFilled: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  playerEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
  },
  playerInitial: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
  },
  plusIcon: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: '300',
  },
  ratingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  ratingText: {
    ...Typography.tiny,
    color: Colors.white,
    fontWeight: '700',
  },
  positionLabel: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    ...Typography.tiny,
    color: Colors.white,
    fontWeight: '600',
  },
  playerName: {
    ...Typography.tiny,
    color: Colors.white,
    marginTop: 2,
    maxWidth: 60,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formationBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  formationText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
});