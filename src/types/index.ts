export interface Player {
  id: number;
  name: string;
  emoji: string;
  created_at: string;
}

export interface Session {
  id: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface SessionPlayer {
  id: number;
  session_id: number;
  player_id: number;
  player_name: string;
  player_emoji: string;
  buy_in: number;
  cash_out: number;
  net: number;
}

export interface CreateSessionInput {
  date: string;
  notes?: string;
  players: Array<{
    player_id: number;
    buy_in: number;
    cash_out: number;
  }>;
}

export interface SessionSummary {
  id: number;
  date: string;
  notes: string | null;
  player_count: number;
  total_pot: number;
  biggest_winner_name: string;
  biggest_winner_emoji: string;
  biggest_winner_net: number;
  biggest_loser_name: string;
  biggest_loser_emoji: string;
  biggest_loser_net: number;
}

export interface Settlement {
  from_name: string;
  from_emoji: string;
  to_name: string;
  to_emoji: string;
  amount: number;
}

export interface PlayerStats {
  id: number;
  name: string;
  emoji: string;
  total_profit: number;
  sessions_played: number;
  avg_profit: number;
  win_rate: number;
  wins: number;
}

export interface CumulativeProfitPoint {
  date: string;
  [playerName: string]: number | string;
}

export interface FunTitle {
  title: string;
  description: string;
  player_name: string;
  player_emoji: string;
  value: string;
  icon: string;
}
