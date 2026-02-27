import type Database from "better-sqlite3";
import type { PlayerStats, CumulativeProfitPoint, FunTitle } from "@/types";

export function getPlayerStats(db: Database.Database): PlayerStats[] {
  return db
    .prepare(
      `SELECT p.id, p.name, p.emoji,
              SUM(sp.cash_out - sp.buy_in) as total_profit,
              COUNT(*) as sessions_played,
              AVG(sp.cash_out - sp.buy_in) as avg_profit,
              SUM(CASE WHEN sp.cash_out > sp.buy_in THEN 1 ELSE 0 END) as wins,
              CAST(SUM(CASE WHEN sp.cash_out > sp.buy_in THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as win_rate
       FROM players p
       JOIN session_players sp ON p.id = sp.player_id
       GROUP BY p.id
       ORDER BY total_profit DESC`
    )
    .all() as PlayerStats[];
}

export function getCumulativeProfits(db: Database.Database): CumulativeProfitPoint[] {
  const rows = db
    .prepare(
      `SELECT s.date, p.name,
              SUM(sp.cash_out - sp.buy_in) OVER (
                PARTITION BY p.id ORDER BY s.date, s.id
              ) as cumulative_profit
       FROM session_players sp
       JOIN sessions s ON sp.session_id = s.id
       JOIN players p ON sp.player_id = p.id
       ORDER BY s.date, s.id`
    )
    .all() as Array<{ date: string; name: string; cumulative_profit: number }>;

  const dateMap = new Map<string, CumulativeProfitPoint>();

  for (const row of rows) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { date: row.date });
    }
    const point = dateMap.get(row.date)!;
    point[row.name] = Math.round(row.cumulative_profit * 100) / 100;
  }

  return Array.from(dateMap.values());
}

export function getDashboardSummary(db: Database.Database) {
  const totalSessions =
    (db.prepare("SELECT COUNT(*) as count FROM sessions").get() as { count: number })?.count ?? 0;
  const totalPlayers =
    (db.prepare("SELECT COUNT(*) as count FROM players").get() as { count: number })?.count ?? 0;
  const totalPot =
    (
      db.prepare("SELECT COALESCE(SUM(buy_in), 0) as total FROM session_players").get() as {
        total: number;
      }
    )?.total ?? 0;

  return { totalSessions, totalPlayers, totalPot: Math.round(totalPot * 100) / 100 };
}

export function getFunTitles(db: Database.Database): FunTitle[] {
  const titles: FunTitle[] = [];
  const stats = getPlayerStats(db);

  if (stats.length === 0) return titles;

  // The Shark - highest win rate (min 3 sessions)
  const eligible = stats.filter((s) => s.sessions_played >= 3);
  if (eligible.length > 0) {
    const shark = eligible.reduce((a, b) => (a.win_rate > b.win_rate ? a : b));
    titles.push({
      title: "The Shark",
      description: "Highest win rate",
      player_name: shark.name,
      player_emoji: shark.emoji,
      value: `${Math.round(shark.win_rate * 100)}% wins`,
      icon: "🦈",
    });
  }

  // The Whale - biggest single session loss
  const worstSession = db
    .prepare(
      `SELECT p.name, p.emoji, MIN(sp.cash_out - sp.buy_in) as worst
       FROM session_players sp
       JOIN players p ON sp.player_id = p.id
       GROUP BY p.id
       ORDER BY worst ASC
       LIMIT 1`
    )
    .get() as { name: string; emoji: string; worst: number } | undefined;

  if (worstSession && worstSession.worst < 0) {
    titles.push({
      title: "The Whale",
      description: "Biggest single session loss",
      player_name: worstSession.name,
      player_emoji: worstSession.emoji,
      value: `$${Math.abs(worstSession.worst).toFixed(2)} lost`,
      icon: "🐋",
    });
  }

  // Hot Streak - most consecutive winning sessions
  const sessionResults = db
    .prepare(
      `SELECT p.id, p.name, p.emoji, s.date, s.id as session_id,
              (sp.cash_out - sp.buy_in) as net
       FROM session_players sp
       JOIN sessions s ON sp.session_id = s.id
       JOIN players p ON sp.player_id = p.id
       ORDER BY p.id, s.date, s.id`
    )
    .all() as Array<{
    id: number;
    name: string;
    emoji: string;
    date: string;
    session_id: number;
    net: number;
  }>;

  let bestStreak = { name: "", emoji: "", streak: 0 };
  let currentPlayerId = -1;
  let currentStreak = 0;

  for (const row of sessionResults) {
    if (row.id !== currentPlayerId) {
      currentPlayerId = row.id;
      currentStreak = 0;
    }
    if (row.net > 0) {
      currentStreak++;
      if (currentStreak > bestStreak.streak) {
        bestStreak = { name: row.name, emoji: row.emoji, streak: currentStreak };
      }
    } else {
      currentStreak = 0;
    }
  }

  if (bestStreak.streak >= 2) {
    titles.push({
      title: "Hot Streak",
      description: "Most consecutive wins",
      player_name: bestStreak.name,
      player_emoji: bestStreak.emoji,
      value: `${bestStreak.streak} in a row`,
      icon: "🔥",
    });
  }

  // The Rock - lowest variance (most consistent, min 3 sessions)
  if (eligible.length > 0) {
    const playerSessions = new Map<number, number[]>();
    for (const row of sessionResults) {
      if (!playerSessions.has(row.id)) playerSessions.set(row.id, []);
      playerSessions.get(row.id)!.push(row.net);
    }

    let lowestVariance = Infinity;
    let rock: PlayerStats | null = null;

    for (const player of eligible) {
      const sessions = playerSessions.get(player.id);
      if (!sessions || sessions.length < 3) continue;
      const mean = sessions.reduce((a, b) => a + b, 0) / sessions.length;
      const variance = sessions.reduce((sum, v) => sum + (v - mean) ** 2, 0) / sessions.length;
      if (variance < lowestVariance) {
        lowestVariance = variance;
        rock = player;
      }
    }

    if (rock) {
      titles.push({
        title: "The Rock",
        description: "Most consistent player",
        player_name: rock.name,
        player_emoji: rock.emoji,
        value: `$${Math.round(Math.sqrt(lowestVariance))} std dev`,
        icon: "🪨",
      });
    }
  }

  // Session MVP - biggest winner in the last session
  const latestMVP = db
    .prepare(
      `SELECT p.name, p.emoji, (sp.cash_out - sp.buy_in) as net
       FROM session_players sp
       JOIN players p ON sp.player_id = p.id
       WHERE sp.session_id = (SELECT id FROM sessions ORDER BY date DESC, id DESC LIMIT 1)
       ORDER BY net DESC
       LIMIT 1`
    )
    .get() as { name: string; emoji: string; net: number } | undefined;

  if (latestMVP && latestMVP.net > 0) {
    titles.push({
      title: "Session MVP",
      description: "Last game's biggest winner",
      player_name: latestMVP.name,
      player_emoji: latestMVP.emoji,
      value: `+$${latestMVP.net.toFixed(2)}`,
      icon: "🏆",
    });
  }

  return titles;
}
