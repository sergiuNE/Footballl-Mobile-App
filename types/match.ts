import type { Timestamp } from 'firebase/firestore';

export interface PlayerInMatch {
  userId: string;
  userName: string;
  position?: string;
}

export interface Match {
  id: string;
  title?: string;
  location: string;
  date: Timestamp | { seconds: number; nanoseconds: number };
  time: string;
  maxPlayers: number;
  createdBy: string;
  createdByName?: string;
  players: PlayerInMatch[];
  createdAt?: Timestamp | { seconds: number; nanoseconds: number };
  // Resultaat / statistieken (optioneel)
  homeScore?: number;
  awayScore?: number;
  shotsOnTargetHome?: number;
  shotsOnTargetAway?: number;
  status?: string;
  skillLevel?: string;
}

export type MatchFormData = Omit<Match, 'id' | 'createdBy' | 'players' | 'createdAt'>;
