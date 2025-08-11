// netlify/functions/spin.js
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const ALLOWED = ["number","color","evenOdd","dozen","column","lowHigh"];

function features(n){
  const color   = n === 0 ? "green" : (REDS.has(n) ? "red" : "black");
  const evenOdd = n === 0 ? null : (n % 2 === 0 ? "even" : "odd");
  const dozen   = n === 0 ? null : Math.ceil(n / 12);     // 1..3
  const column  = n === 0 ? null : ((n - 1) % 3) + 1;     // 1..3
  const lowHigh = n === 0 ? null : (n <= 18 ? "low" : "high");
  return { color, evenOdd, dozen, column, lowHigh };
}

function validateBet(b){
  if (!b || typeof b !== "object") return "Bet must be an object.";
  const { betType, selection, stake } = b;
  if (!ALLOWED.includes(betType)) return `Invalid betType. Allowed: ${ALLOWED.join(", ")}`;
  if (!(Number(stake) > 0)) return "Stake must be > 0.";

  switch (betType) {
    case "number":
      if (!Number.isInteger(selection) || selection < 0 || selection > 36)
        return "For number bet, selection must be integer 0â36.";
      break;
    case "color":
      if (!["red","black"].includes(String(selection).toLowerCase()))
        return "For color bet, selection must be 'red' or 'black'.";
      break;
    case "evenOdd":
      if (!["even","odd"].includes(String(selection).toLowerCase()))
        return "For evenOdd bet, selection must be 'even' or 'odd'.";
      break;
    case "dozen":
      if (![1,2,3].includes(Number(selection)))
        return "For dozen bet, selection must be 1, 2, or 3.";
      break;
    case "column":
      if (![1,2,3].includes(Number(selection)))
        return "For column bet, selection must be 1, 2, or 3.";
      break;
    case "lowHigh":
      if (!["low","high"].includes(String(selection).toLowerCase()))
        return "For lowHigh bet, selection must be 'low' or 'high'.";
      break;
  }
  return null;
}

function evalBet(bet, n, f){
  const s = String(bet.selection).toLowerCase();
  const stake = Number(bet.stake);
  let win=false, multiplier=0;

  switch (bet.betType) {
    case "number":   win = Number(bet.selection) === n;             multiplier = 35; break;
    case "color":    win = n !== 0 && s === f.color;                multiplier = 1;  break;
    case "evenOdd":  win = n !== 0 && s === f.evenOdd;              multiplier = 1;  break;
    case "dozen":    win = n !== 0 && Number(bet.selection) === f.dozen;  multiplier = 2;  break;
    case "column":   win = n !== 0 && Number(bet.selection) === f.column; multiplier = 2;  break;
    case "lowHigh":  win = n !== 0 && s === f.lowHigh;              multiplier = 1;  break;
  }
  const payout = win ? stake * (multiplier + 1) : 0; // povrat + dobitak
  const profit = win ? stake * multiplier : -stake;
  return { ...bet, win, multiplier, payout, profit };
}

export async function handler(event) {
  const input = event.httpMethod === 'POST'
    ? JSON.parse(event.body || '{}')
    : Object.fromEntries(new URLSearchParams(event.rawQuery || ''));

  // Dozvoljeno: single bet {betType,...} ili viÅ¡e {bets:[...]}
  let bets = [];
  if (Array.isArray(input.bets))        bets = input.bets;
  else if (input.betType)               bets = [input];
  else                                  bets = []; // bez opklada

  // Validacija svih opklada
  const errors = bets.map(validateBet).filter(Boolean);
  if (errors.length){
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok:false, errors })
    };
  }

  // Spin
  const n = Math.floor(Math.random() * 37); // 0â36
  const f = features(n);

  // Rezultati
  const results = bets.map(b => evalBet(b, n, f));
  const totals = results.reduce((acc,r)=>({
    stake: acc.stake + Number(r.stake),
    payout: acc.payout + r.payout,
    profit: acc.profit + r.profit
  }), { stake:0, payout:0, profit:0 });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      wheel: "european",
      result: { number: n, ...f },
      bets: results.length ? results : null,
      totals: results.length ? totals : null
    })
  };
}
