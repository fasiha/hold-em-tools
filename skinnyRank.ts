import {isString} from "util";

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
/**
 * Convert a short (character) to a number that could index into `short` to get a suit-mate.
 * Old trick: convert to lowercase by `(x | 0b100000)`, i.e., turn on the 6th last significant bit.
 * @param short string in `shorts`
 * @returns number between 0 and 12 inclusive: 0 ace, 1 for deuce, 12 for king.
 */
export function shortToNumber(short: string): number { return ((short.charCodeAt(0)|0b100000) - loACode) % 13; }
const ACEHIRANK = 13;
// (0 to 12) || 13 means aces get mapped to 13.
/**
 * Maps a number between 0 and 12 (inclusive) to the natural rank.
 * @param num number between 0 and 12 inclusive
 * @returns number between 2 and 14 inclusive. 2 deuce, 3 three, 13 king, 14 ace.
 */
export function numberToNumberAcesHigh(num: number): number { return (num || ACEHIRANK) + 1; }
export function shortToNumberAcesHigh(short: string): number { return numberToNumberAcesHigh(shortToNumber(short)); }
function shortsToBestNumberAcesHighArr(shorts: string[]): number {
  return Math.max(...shorts.map(shortToNumberAcesHigh));
}
function shortsToBestNumberAcesHighStr(shorts: string): number {
  return shortsToBestNumberAcesHighArr(shorts.split(''));
}
function numberAcesHighToNumber(n: number): number { return n === (ACEHIRANK + 1) ? 0 : n - 1; }
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

type Memo = {
  cardsPerRank: number[]
};
function memoize(hand: Hand): Memo {
  let cardsPerRank = Array.from(Array(13), _ => 0);
  for (let short of hand) { cardsPerRank[shortToNumber(short)]++; }
  return {cardsPerRank};
}
function sweep(hand: Hand, memo: Memo): [number, number, number, number] {
  if (memo.cardsPerRank.length === 0) { return sweep(hand, memoize(hand)); }
  let bestQuad = 0, bestTrip = 0, bestPair = 0, secondBestPair = 0;
  for (let i = 13; i > 0; i--) {
    const hits = memo.cardsPerRank[i % 13];
    bestQuad = bestQuad || (hits === 4 && numberToNumberAcesHigh(i % 13)) || 0;
    bestTrip = bestTrip || (hits === 3 && numberToNumberAcesHigh(i % 13)) || 0;
    bestPair = bestPair || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0;
    if (bestPair) { secondBestPair = secondBestPair || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0; }
  }
  return [bestQuad, bestTrip, bestPair, secondBestPair];
}

function appendKickers(hand: Hand, memo: Memo, nCardsFound: number, rankAcesLowFound: number,
                       rank2AcesLow: number = Infinity): number[] {
  if (!memo.cardsPerRank.length) { return appendKickers(hand, memoize(hand), nCardsFound, rankAcesLowFound); }
  let kickersNeeded: number = 5 - nCardsFound;
  let ret = [numberToNumberAcesHigh(rankAcesLowFound)];
  for (let i = 13; i > 0; i--) {
    const howMany = memo.cardsPerRank[i % 13];
    if ((i % 13) === rankAcesLowFound || howMany === 0 || (i % 13) === rank2AcesLow) { continue; }
    const number = numberToNumberAcesHigh(i % 13);
    for (let j = 0; j < howMany && kickersNeeded > 0; j++, kickersNeeded--) { ret.push(number); }
    if (kickersNeeded <= 0) { return ret; }
  }
  return ret.concat(Array.from(Array(kickersNeeded - ret.length + 1), _ => 0));
}

export function score(hand: Hand): {score: number, output: number[]} {
  if (isRoyalFlush(hand)) { return {score: 1, output: [1]}; }

  const sf = bestStraightFlush(hand);
  if (sf) { return {score: 2, output: [sf]}; }

  let memo = memoize(hand);
  let [quad, trip, pair, pair2] = sweep(hand, memo);
  if (quad) { return {score: 3, output: appendKickers(hand, memo, 4, numberAcesHighToNumber(quad))}; }
  if (trip && pair) { return {score: 4, output: [trip, pair]}; }

  const flush = bestFlush(hand);
  if (flush[0] > 0) { return {score: 5, output: flush}; }

  const str = bestStraight(hand, memo);
  if (str) { return {score: 6, output: [str]}; }

  if (trip) { return {score: 7, output: appendKickers(hand, memo, 3, numberAcesHighToNumber(trip))}; }
  if (pair && pair2) { return {score: 8, output: appendKickers(hand, memo, 4, pair, pair2)}; }
  if (pair) { return {score: 9, output: appendKickers(hand, memo, 2, pair)}; }
  return {score: 10, output: appendKickers(hand, memo, 0, Infinity)};
}
export function compareHands(a: Hand, b: Hand): number {
  let {score: ascore, output: aout} = score(a);
  let {score: bscore, output: bout} = score(b);
  if (ascore !== bscore) { return ascore - bscore; }
  // tie-breakers
  if (aout.length !== bout.length) { throw new Error('cannot compare hands of unequal size'); }
  let ret = aout.findIndex((a, i) => (bout as number[])[i] !== a);
  if (ret === -1) { return 0; }
  return bout[ret] - aout[ret];
}

function bestStraight(hand: Hand, memo: Memo): number {
  if (!memo.cardsPerRank.length) { return bestStraight(hand, memoize(hand)); }
  let stringSoFar = 0;
  let prevHits = memo.cardsPerRank[0];
  let i;
  // start at king, prev = ace hits
  for (i = 12; i >= 0; i--) {
    if (memo.cardsPerRank[i] > 0 && prevHits > 0) {
      stringSoFar++;
    } else {
      stringSoFar = 0;
    }
    if (stringSoFar >= 4) { return numberToNumberAcesHigh(i + stringSoFar); }
    prevHits = memo.cardsPerRank[i];
  }
  return 0;
}
function handToSubSuits(hand: Hand) {
  let ret: string[] = [];
  let curr = 0;
  let start = 0;
  for (let max of 'MZmz') {
    for (let i = start; i <= hand.length; i++) {
      if (hand[i] > max || i === hand.length) {
        if (curr - start >= 5) { ret.push(hand.substring(start, curr)); }
        start = curr;
        break;
      }
      curr++;
    }
  }
  return ret;
}
function last(s: string): string { return s[s.length - 1]; }
function bestFlush(hand: Hand): number[] {
  let suits = handToSubSuits(hand);
  if (suits.length === 0) { return [0, 0, 0, 0, 0]; }
  let bestSoFar = -1;
  let idxBest: number = 0;
  for (let idx = 0; idx < suits.length; idx++) {
    const curr = shortToNumberAcesHigh(last(suits[idx]));
    if (curr > bestSoFar) {
      bestSoFar = curr;
      idxBest = idx;
    }
  }
  return suits[idxBest].slice(-5).split('').map(shortToNumberAcesHigh);
}

if (require.main === module) {}
