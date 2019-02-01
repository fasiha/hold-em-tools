export function initCards() {
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
export function shortToReadable(short: string): string {
  let suit = shortToSuit(short);
  let num = shortToNumberAcesHigh(short);
  let rank =
      ((num <= 10) && num.toString()) || (num === 11 && 'J') || (num === 12 && 'Q') || (num === 13 && 'K') || 'A';
  return (rank.length === 1 ? ' ' : '') + rank + suit;
}
export function sortString(s: string): string { return s.split('').sort().join(''); }

export function search(haystack: Hand, needle: Hand): boolean {
  const nhay = haystack.length;
  const nnee = needle.length;
  let targetIdx = 0;
  if (nnee > nhay) { return false; }
  for (let c of haystack) {
    if (c > needle[targetIdx]) {
      return false;
    } else if (c === needle[targetIdx]) {
      if (++targetIdx === nnee) { return true; }
    }
  }
  return false;
}

type Hand = string;
// 1: royal flushes
export function isRoyalFlush(hand: Hand): number {
  if (hand.length < 5) { return 0; }
  return ((hand.startsWith('A') && hand.includes('JKLM')) || (hand.includes('jklm') && hand.includes('a')) ||
          (hand.includes('WXYZ') && hand.includes('N')) || (hand.endsWith('wxyz') && hand.includes('n')))
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
function sweep(hand: Hand, memo: Memo): [number, number, number, number, number] {
  if (memo.cardsPerRank.length === 0) { return sweep(hand, memoize(hand)); }
  let quad = 0, trip = 0, trip2 = 0, pair = 0, pair2 = 0;
  for (let i = 13; i > 0; i--) {
    const hits = memo.cardsPerRank[i % 13];
    quad = quad || (hits === 4 && numberToNumberAcesHigh(i % 13)) || 0;
    if (trip) { trip2 = trip2 || (hits === 3 && numberToNumberAcesHigh(i % 13)) || 0; }
    if (pair) { pair2 = pair2 || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0; }
    trip = trip || (hits === 3 && numberToNumberAcesHigh(i % 13)) || 0;
    pair = pair || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0;
  }
  return [quad, trip, trip2, pair, pair2];
}

function appendKickers(hand: Hand, memo: Memo, nCardsFound: number, acesLow: number[]): number[] {
  if (!memo.cardsPerRank.length) { return appendKickers(hand, memoize(hand), nCardsFound, acesLow); }
  let kickersNeeded: number = 5 - nCardsFound;
  for (let i = 13; i > 0; i--) {
    const howMany = memo.cardsPerRank[i % 13];
    if (howMany === 0 || acesLow.indexOf(i % 13) >= 0) { continue; }
    const number = i % 13;
    for (let j = 0; j < howMany && kickersNeeded > 0; j++, kickersNeeded--) { acesLow.push(number); }
    if (kickersNeeded <= 0) { return acesLow.map(numberToNumberAcesHigh); }
  }
  return acesLow.map(numberToNumberAcesHigh).concat(Array.from(Array(kickersNeeded), _ => 0));
}

export function fastScore(hand: Hand): number {
  // const rf = 1, sf = 2, quad = 3, fh = 4, fl = 5, str = 6, trip = 7, twop = 8, pair = 9, hic = 10;
  if (isRoyalFlush(hand)) { return 1; }
  if (bestStraightFlush(hand)) { return 2; }
  let memo = memoize(hand);
  let [quad, trip, trip2, pair, pair2] = sweep(hand, memo);
  if (quad) { return 3; }
  if (trip && (pair || trip2)) { return 4; }
  if (bestFlushUnsafe(hand)[0]) { return 5; }
  if (bestStraight(hand, memo)) { return 6; }
  if (trip) { return 7; }
  if (pair && pair2) { return 8; }
  if (pair) { return 9; }
  return 10;
}

export function score(hand: Hand): {score: number, output: number[]} {
  if (isRoyalFlush(hand)) { return {score: 1, output: [1]}; }

  const sf = bestStraightFlush(hand);
  if (sf) { return {score: 2, output: [sf]}; }

  let memo = memoize(hand);
  let [quad, trip, trip2, pair, pair2] = sweep(hand, memo);
  if (quad) { return {score: 3, output: appendKickers(hand, memo, 4, [numberAcesHighToNumber(quad)])}; }
  if (trip && trip2) {
    return {score: 4, output: [trip, trip2]};
  } else if (trip && pair) {
    return {score: 4, output: [trip, pair]};
  }

  const flush = bestFlushUnsafe(hand);
  if (flush[0] > 0) { return {score: 5, output: flush}; }

  const str = bestStraight(hand, memo);
  if (str) { return {score: 6, output: [str]}; }

  if (trip) { return {score: 7, output: appendKickers(hand, memo, 3, [numberAcesHighToNumber(trip)])}; }
  if (pair && pair2) {
    return {
      score: 8,
      output: appendKickers(hand, memo, 4, [numberAcesHighToNumber(pair), numberAcesHighToNumber(pair2)])
    };
  }
  if (pair) { return {score: 9, output: appendKickers(hand, memo, 2, [numberAcesHighToNumber(pair)])}; }
  return {score: 10, output: appendKickers(hand, memo, 0, [])};
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
  // start at king, prev = ace hits
  for (let i = 12; i >= 0; i--) {
    if (memo.cardsPerRank[i] > 0 && prevHits > 0) {
      stringSoFar++;
      if (stringSoFar >= 4) { return numberToNumberAcesHigh(i + stringSoFar); }
    } else {
      stringSoFar = 0;
    }
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
function bestFlushUnsafe(hand: Hand): number[] {
  let suits = handToSubSuits(hand);
  if (suits.length === 0) { return [0, 0, 0, 0, 0]; }
  // if more than one flush is found, they have to be sorted element-wise, and I can't be having with that.
  // FIXME
  if (suits.length > 1) { throw new Error('requires safe flush finder'); }
  if (shortToNumber(suits[0][0]) === 0) {
    return [14].concat(suits[0].slice(-4).split('').reverse().map(shortToNumberAcesHigh));
  }
  return suits[0].slice(-5).split('').reverse().map(shortToNumberAcesHigh);
}

import {combinations} from './comb';
import {ncr} from './utils';
const {writeFile} = require('fs');
if (require.main === module) {
  let args = process.argv.slice(2);
  const r = parseInt(args[0]) || 5;

  let arr = new Uint8Array((r + 1) * ncr(shorts.length, r));
  let i = 0;
  for (let hand of combinations(shorts, r)) {
    let s = hand.join('');
    let n = fastScore(s);
    Buffer.from(s).copy(arr, i * (r + 1));
    arr[i * (r + 1) + r] = n;
    if (((++i) % 1e5) === 0) { console.log(i / 1e6); }
  }
  writeFile('handsScore-' + r + '.bin', arr, (err: any) => console.log(err));
}
