function initCards() {
  const shorts = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const ranks = '0123456789JQK'.split('');
  const suits = 'cdhs'.split('');
  let shortToRank: Map<string, string> = new Map([]);
  let shortToSuit: Map<string, string> = new Map([]);
  let i = 0;
  for (let suit of suits) {
    for (let rank of ranks) {
      const short = shorts[i++];
      shortToRank.set(short, rank);
      shortToSuit.set(short, suit);
    }
  }
  return {shorts, suits, ranks};
}
const {shorts, suits, ranks} = initCards();

const loACode = 'a'.charCodeAt(0);
const upACode = 'A'.charCodeAt(0);
function shortToNumber(short: string): number {
  let uppercase = short < 'a';
  return (short.charCodeAt(0) - (uppercase ? upACode : loACode)) % 13;
}
// (0 to 12) || 13 means aces get mapped to 13.
function shortToNumberAcesHigh(short: string): number { return (shortToNumber(short) || 13) + 1; }
function shortsToBestNumberAcesHigh(shorts: string): number {
  return Math.max(...shorts.split('').map(shortToNumberAcesHigh));
}
function numberAcesHighToNumber(n: number): number { return n === 14 ? 0 : n - 1; }
function shortToRank(short: string) { return ranks[shortToNumber(short)]; }
function shortToSuit(short: string): string {
  return ((short < 'N') && 'c') || ((short <= 'Z') && 'd') || ((short < 'n') && 'h') || 's';
}
export function validateShort(short: string): boolean { return /^[a-zA-Z]$/.test(short); }
// Not intended for speed!
export function readableToShort(rank: string, suit: string): string {
  let rankIdx = ranks.indexOf(rank);
  let suitIdx = suits.indexOf(suit);
  if (rankIdx === -1 || suitIdx === -1) { throw new Error('bad readable: ' + [[rank, rankIdx], [suit, suitIdx]]); }
  return shorts[suitIdx * 13 + rankIdx];
}
function sortString(s: string): string { return s.split('').sort().join(''); }
function range(n: number): number[] { return Array.from(Array(n), (_, n) => n); }
function flatten<T>(arr: T[][]): T[] { return ([] as T[]).concat(...arr); }
function initHands(verbose: boolean = false) {
  const rfRanks = '09JQK'.split('');
  const royalFlushes = suits.map(suit => rfRanks.map(rank => readableToShort(rank, suit)).join(''));
  if (verbose) { console.log(royalFlushes); }
  // not used anywhere since there's that jump between ace and 9.

  const rangeOuter = range(9);
  const rangeInner = range(5);
  const straightFlushes = flatten(
      suits.map(suit => rangeOuter.map(
                    startRank => rangeInner.map(delta => readableToShort(ranks[startRank + delta], suit)).join(''))));
  if (verbose) { console.log(straightFlushes); }

  const fours = ranks.map(rank => suits.map(suit => readableToShort(rank, suit)).join(''));
  if (verbose) { console.log(fours); }
  return {royalFlushes, straightFlushes};
}
const {straightFlushes} = initHands();
type Hand = string;
// 1: royal flushes
export function isRoyalFlush(hand: Hand): number {
  if (hand.length < 5) { return 0; }
  return ((hand.startsWith('a') && hand.includes('jklm')) || (hand.includes('JKLM') && hand.includes('A')) ||
          (hand.includes('wxyz') && hand.includes('n')) || (hand.endsWith('WXYZ') && hand.includes('N')))
             ? 1
             : 0;
}
// 2: straight flushes
export function bestStraightFlush(hand: Hand): number {
  if (hand.length < 5) { return 0; }
  let straightFlushesFound: string[] = [];
  let nhits = 0;
  let prevCharCode = hand.charCodeAt(0);
  for (let i = 1; i < hand.length; i++) {
    let newCharCode = hand.charCodeAt(i);
    if (prevCharCode + 1 === newCharCode) {
      if ((++nhits) >= 4 && (shortToSuit(hand[i]) === shortToSuit(hand[i - 4]))) { straightFlushesFound.push(hand[i]); }
    } else {
      nhits = 0;
    }
    prevCharCode = newCharCode;
  }
  if (straightFlushesFound.length > 0) { return Math.max(...straightFlushesFound.map(shortToNumberAcesHigh)); }
  return 0;
}
// 3: four of a kind
function removeCards(hand: Hand, remove: Hand): Hand { return hand.replace(new RegExp(`[${remove}]`, 'g'), ''); }
export function best4OfAKind(hand: Hand): [number, number] {
  if (hand.length < 4) { return [0, 0]; }
  let quadsFound: string[] = [];
  const shortToFriends = (short: string) => {
    let rank = shortToNumber(short);
    return [shorts[rank + 13], shorts[rank + 13 * 2], shorts[rank + 13 * 3]];
  };
  for (let i = 0; i < hand.length; i++) {
    let short = hand[i];
    if (short >= 'N') { break; }
    let friends = shortToFriends(short);
    let start = i + 1;
    for (let fi = 0; fi < friends.length && start >= 0; fi++) { start = hand.indexOf(friends[fi], start); }
    if (start < 0) { continue; }
    quadsFound.push(short);
  }
  if (quadsFound.length > 0) {
    let best = Math.max(...quadsFound.map(shortToNumberAcesHigh));
    if (hand.length === 4) { return [best, 0]; }
    let bestShort = shorts[numberAcesHighToNumber(best)];
    let kicker = shortsToBestNumberAcesHigh(removeCards(hand, bestShort + shortToFriends(bestShort)));
    return [best, kicker];
  }
  return [0, 0];
}
// 4: full house
function bestFullHouse(hand: Hand): number {
  1;

  return 0;
}

if (require.main === module) {
  console.log(initCards());
  initHands(true);
}