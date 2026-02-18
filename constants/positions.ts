export const FOOTBALL_POSITIONS = [
  'GK', 'LB', 'CB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST',
] as const;
export type Position = typeof FOOTBALL_POSITIONS[number];
