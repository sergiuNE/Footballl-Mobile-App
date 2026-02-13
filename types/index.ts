export type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';

export type Position = 
  | 'GK'  
  | 'LB' 
  | 'CB1' 
  | 'CB2' 
  | 'RB'  
  | 'LM'  
  | 'CM1' 
  | 'CM2' 
  | 'CM3' 
  | 'RM'  
  | 'LW'  
  | 'ST1' 
  | 'ST2'
  | 'RW'; 

export type Player = {
  id: string;
  name: string;
  rating: number;
  position: Position;
  avatarUrl?: string;
};

export type FieldPosition = {
  position: Position;
  x: number;
  y: number;
  label: string;
};

// New User type
export type User = {
  uid: string;
  name: string;
  email: string;
  rating: number;
  positions: string[];  // Favoriete positions
  preferredFormation: Formation;
  matchesPlayed?: number;
  createdAt: Date;
};

// For creating a match
export type Match = {
  id: string;
  createdBy: string;
  createdByName: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  maxPlayers: number;
  currentPlayers: number;
  formation: Formation;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  status: 'open' | 'full' | 'completed' | 'cancelled';
  players: Player[];
  createdAt: Date;
};