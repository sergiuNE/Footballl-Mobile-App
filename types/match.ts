import type { Timestamp } from 'firebase/firestore';

export interface PlayerInMatch {
  userId: string;
  userName: string;
  position?: string;
}

export interface Match {
  id: string;
  location: string;
  date: Timestamp | { seconds: number; nanoseconds: number };
  time: string;
  maxPlayers: number;
  createdBy: string;
  players: PlayerInMatch[];
  createdAt?: Timestamp | { seconds: number; nanoseconds: number };
}

export type MatchFormData = Omit<Match, 'id' | 'createdBy' | 'players' | 'createdAt'>;
