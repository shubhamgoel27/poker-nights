import type { Settlement } from "@/types";

interface PlayerBalance {
  name: string;
  emoji: string;
  net: number;
}

export function computeSettlements(
  players: Array<{ player_name: string; player_emoji: string; buy_in: number; cash_out: number }>
): Settlement[] {
  const balances: PlayerBalance[] = players
    .map((p) => ({
      name: p.player_name,
      emoji: p.player_emoji,
      net: p.cash_out - p.buy_in,
    }))
    .filter((b) => Math.abs(b.net) > 0.01);

  const debtors = balances.filter((b) => b.net < 0).sort((a, b) => a.net - b.net);
  const creditors = balances.filter((b) => b.net > 0).sort((a, b) => b.net - a.net);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtAmt = Math.abs(debtors[i].net);
    const creditAmt = creditors[j].net;
    const transfer = Math.min(debtAmt, creditAmt);

    settlements.push({
      from_name: debtors[i].name,
      from_emoji: debtors[i].emoji,
      to_name: creditors[j].name,
      to_emoji: creditors[j].emoji,
      amount: Math.round(transfer * 100) / 100,
    });

    debtors[i].net += transfer;
    creditors[j].net -= transfer;

    if (Math.abs(debtors[i].net) < 0.01) i++;
    if (Math.abs(creditors[j].net) < 0.01) j++;
  }

  return settlements;
}
