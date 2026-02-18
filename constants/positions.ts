// constants/positions.ts
export const FOOTBALL_POSITIONS = [
  'GK',
  'LB', 'CB1', 'CB2', 'RB',
  'LM', 'CM1', 'CM2', 'CM3', 'RM',
  'LW', 'ST1', 'ST2', 'RW'
] as const;
export type Position = typeof FOOTBALL_POSITIONS[number];
