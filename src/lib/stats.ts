import type { Client } from "@libsql/client";
import type { PlayerStats, CumulativeProfitPoint, FunTitle } from "@/types";

export async function getPlayerStats(db: Client): Promise<PlayerStats[]> {
  const result = await db.execute(
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
  );
  return result.rows as unknown as PlayerStats[];
}

export async function getCumulativeProfits(db: Client): Promise<CumulativeProfitPoint[]> {
  const result = await db.execute(
    `SELECT s.date, p.name,
            SUM(sp.cash_out - sp.buy_in) OVER (
              PARTITION BY p.id ORDER BY s.date, s.id
            ) as cumulative_profit
     FROM session_players sp
     JOIN sessions s ON sp.session_id = s.id
     JOIN players p ON sp.player_id = p.id
     ORDER BY s.date, s.id`
  );

  const rows = result.rows as unknown as Array<{ date: string; name: string; cumulative_profit: number }>;
  const dateMap = new Map<string, CumulativeProfitPoint>();

  for (const row of rows) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { date: row.date });
    }
    const point = dateMap.get(row.date)!;
    point[row.name] = Math.round(Number(row.cumulative_profit) * 100) / 100;
  }

  return Array.from(dateMap.values());
}

export async function getDashboardSummary(db: Client) {
  const [sessionsResult, playersResult, potResult] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM sessions"),
    db.execute("SELECT COUNT(*) as count FROM players"),
    db.execute("SELECT COALESCE(SUM(buy_in), 0) as total FROM session_players"),
  ]);

  const totalSessions = Number(sessionsResult.rows[0]?.count ?? 0);
  const totalPlayers = Number(playersResult.rows[0]?.count ?? 0);
  const totalPot = Math.round(Number(potResult.rows[0]?.total ?? 0) * 100) / 100;

  return { totalSessions, totalPlayers, totalPot };
}

export async function getFunTitles(db: Client): Promise<FunTitle[]> {
  const titles: FunTitle[] = [];
  const stats = await getPlayerStats(db);

  if (stats.length === 0) return titles;

  // The Shark - highest win rate (min 3 sessions)
  const eligible = stats.filter((s) => Number(s.sessions_played) >= 3);
  if (eligible.length > 0) {
    const shark = eligible.reduce((a, b) => (Number(a.win_rate) > Number(b.win_rate) ? a : b));
    titles.push({
      title: "The Shark",
      description: "Highest win rate",
      player_name: shark.name,
      player_emoji: shark.emoji,
      value: `${Math.round(Number(shark.win_rate) * 100)}% wins`,
      icon: "🦈",
    });
  }

  // The Whale - biggest single session loss
  const worstResult = await db.execute(
    `SELECT p.name, p.emoji, MIN(sp.cash_out - sp.buy_in) as worst
     FROM session_players sp
     JOIN players p ON sp.player_id = p.id
     GROUP BY p.id
     ORDER BY worst ASC
     LIMIT 1`
  );

  if (worstResult.rows.length > 0 && Number(worstResult.rows[0].worst) < 0) {
    const row = worstResult.rows[0];
    titles.push({
      title: "The Whale",
      description: "Biggest single session loss",
      player_name: String(row.name),
      player_emoji: String(row.emoji),
      value: `$${Math.abs(Number(row.worst)).toFixed(2)} lost`,
      icon: "🐋",
    });
  }

  // Hot Streak - most consecutive winning sessions
  const streakResult = await db.execute(
    `SELECT p.id, p.name, p.emoji, s.date, s.id as session_id,
            (sp.cash_out - sp.buy_in) as net
     FROM session_players sp
     JOIN sessions s ON sp.session_id = s.id
     JOIN players p ON sp.player_id = p.id
     ORDER BY p.id, s.date, s.id`
  );

  const sessionResults = streakResult.rows as unknown as Array<{
    id: number; name: string; emoji: string; date: string; session_id: number; net: number;
  }>;

  let bestStreak = { name: "", emoji: "", streak: 0 };
  let currentPlayerId = -1;
  let currentStreak = 0;

  for (const row of sessionResults) {
    if (Number(row.id) !== currentPlayerId) {
      currentPlayerId = Number(row.id);
      currentStreak = 0;
    }
    if (Number(row.net) > 0) {
      currentStreak++;
      if (currentStreak > bestStreak.streak) {
        bestStreak = { name: String(row.name), emoji: String(row.emoji), streak: currentStreak };
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
      const id = Number(row.id);
      if (!playerSessions.has(id)) playerSessions.set(id, []);
      playerSessions.get(id)!.push(Number(row.net));
    }

    let lowestVariance = Infinity;
    let rock: PlayerStats | null = null;

    for (const player of eligible) {
      const sessions = playerSessions.get(Number(player.id));
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
  const mvpResult = await db.execute(
    `SELECT p.name, p.emoji, (sp.cash_out - sp.buy_in) as net
     FROM session_players sp
     JOIN players p ON sp.player_id = p.id
     WHERE sp.session_id = (SELECT id FROM sessions ORDER BY date DESC, id DESC LIMIT 1)
     ORDER BY net DESC
     LIMIT 1`
  );

  if (mvpResult.rows.length > 0 && Number(mvpResult.rows[0].net) > 0) {
    const row = mvpResult.rows[0];
    titles.push({
      title: "Session MVP",
      description: "Last game's biggest winner",
      player_name: String(row.name),
      player_emoji: String(row.emoji),
      value: `+$${Number(row.net).toFixed(2)}`,
      icon: "🏆",
    });
  }

  return titles;
}
