import {groupBy, isSuperset, reservoirSample} from './utils';
var shuffle = require('shuffle-array');

const SUITS = 's,c,h,d'.split(',');
// const SUITS = '♠︎,♣︎,♥︎,♦︎'.split(',');
// const white = '♡♢♤♧';
const Ace = 'A';
const Jack = 'J';
const Queen = 'Q';
const King = 'K';
const ACERANK = 14;

const SEP = '/';
function mergeNumberSuit(rank: string, suit: string): string { return rank + SEP + suit; }
function cardToSuit(card: string): string { return card.split(SEP)[1]; }
function cardToRank(card: string): string { return card.split(SEP)[0]; }
export function rankToNum(rank: string): number {
  let ret = parseInt(rank) || (rank === Ace && 1) || (rank === Jack && 11) || (rank === Queen && 12) ||
            (rank === King && 13) || 0;
  if (ret === 0) { throw new Error('unknown rank'); }
  return ret;
}
function bestRankAcesHigh(ranks: number[]): number { return Math.max(...ranks.map(r => r === 1 ? ACERANK : r)); }
function sortAscendingAcesHigh(arr: number[]) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => b - a); }
function sortDescendingAcesHigh(arr: number[]) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => a - b); }
function groupBySuit(list: IterableIterator<string>|Hand): Map<string, Hand> {
  let ret = groupBy(list, cardToSuit);
  if (!isSuperset(new Set(SUITS), new Set(ret.keys()))) { throw new Error('unknown suits'); }
  return ret;
}

function makeSuitToCardsMap(): Map<string, Hand> {
  let ranks = Array.from(Array(10), (_, n) => n + 1).filter(n => n >= 2 && n <= 10).map(n => n.toString()).concat([
    Ace, Jack, Queen, King
  ]);
  return new Map(SUITS.map(s => [s, ranks.map(n => mergeNumberSuit(n, s))] as [string, string[]]));
}
function makeAllCardsSet() {
  let suitToCards = makeSuitToCardsMap();
  let fullDeck = new Set(([] as string[]).concat(...suitToCards.values()));
  return {fullDeck, suitToCards};
}

type Hand = string[];
type HandSet = Set<string>;
const royalFlushes: string[][] = SUITS.map(s => ['10', Jack, Queen, King, Ace].map(n => mergeNumberSuit(n, s)));
const {fullDeck, suitToCards} = makeAllCardsSet();

function isRoyalFlush(handSet: HandSet): boolean {
  return royalFlushes.some(arr => arr.every(card => handSet.has(card)));
}

/*
If you have the following ranks (aces = 1):
1 | 2 | 3 | 4 | 5 | 6
matches =
:   1   2   3   4
So by the time `matches === 4`, you've found five in a row.

What about aces high?
A | 5 | 10 | J | Q | K
matches =
:   0    0   1   2   3
If after scanning 2..13 (where 13 means King), `matches === 3`, then you find that 1 (ace) is in the hand, you have five
in a row too.

Don't worry, this loop-around will work if you had four in a row that ends before the king. Consider:
1 | 2 | 3 | 4 | 10
matches =
:   1   2   3    0
`matches` gets reset as soon as the run is broken.
*/
export function bestStraight(set: HandSet): number {
  let ranks = new Set(Array.from(set.values(), c => rankToNum(cardToRank(c))));
  let straightRanks: number[] = [];
  let matches = 0;
  for (let i = 2; i <= 13; i++) {
    if (ranks.has(i - 1) && ranks.has(i)) {
      matches++;
      if (matches >= 4) { straightRanks.push(i); }
    } else {
      matches = 0;
    }
  }
  if (matches === 3 && ranks.has(1)) { straightRanks.push(ACERANK); }
  return straightRanks.length === 0 ? 0 : Math.max(...straightRanks);
}
function isStraight(set: HandSet): boolean { return !!bestStraight(set); }

export function bestFlush(set: HandSet): number {
  const perSuit = groupBySuit(set.values());
  let maxRanks: number[] = [];
  for (const cards of perSuit.values()) {
    if (cards.length >= 5) { maxRanks.push(bestRankAcesHigh(cards.map(c => rankToNum(cardToRank(c))))); }
  }
  return maxRanks.length === 0 ? 0 : bestRankAcesHigh(maxRanks);
}
function isFlush(set: HandSet): boolean { return !!bestFlush(set); }

export function bestStraightFlush(set: HandSet): number {
  const perSuit = groupBySuit(set.values());
  let best: number[] = [];
  for (const cards of perSuit.values()) {
    if (cards.length >= 5) {
      const rankingStraight = bestStraight(new Set(cards));
      if (rankingStraight > 0) { best.push(rankingStraight); }
    }
  }
  return best.length > 0 ? Math.max(...best) : 0;
}
function isStraightFlush(set: HandSet): boolean { return !!bestStraightFlush(set); }

function nOfAKindHelper(set: HandSet): Map<string, Hand> { return groupBy(set.values(), cardToRank); }
function allNOfAKind(set: HandSet, N: number, perRank: Map<string, Hand>|undefined = undefined): number[] {
  if (!perRank) { perRank = nOfAKindHelper(set); }
  let all: string[] = [];
  for (const [rank, hand] of perRank) {
    if (hand.length === N) { all.push(rank); }
  }
  return all.map(rankToNum);
}
function bestNOfAKind(set: HandSet, N: number): number {
  let all = allNOfAKind(set, N);
  return all.length === 0 ? 0 : bestRankAcesHigh(all);
}
export function best4OfAKind(set: HandSet): number { return bestNOfAKind(set, 4); }

type RepeatMetadata = {
  universe?: number[],
  perRank?: Map<string, string[]>
};
export function best3OfAKind(
    set: HandSet,
    metadata: undefined|RepeatMetadata = undefined,
    ): number {
  let perRank = groupBy(set.values(), cardToRank);
  let quads = allNOfAKind(set, 4, perRank);
  let trips = allNOfAKind(set, 3, perRank);
  let tripUniverse = sortAscendingAcesHigh(quads.concat(trips));
  if (tripUniverse.length === 0) { return 0; } // no trips
  if (metadata) {
    metadata.perRank = perRank;
    metadata.universe = tripUniverse; // pass by reference, so the pop below will be visible outside
  }
  return tripUniverse.pop() || 0; // TypeScript pacification
}

export function bestFullHouse(set: HandSet): [number, number] {
  let metadataTrip: RepeatMetadata = {};
  let bestTrip = best3OfAKind(set, metadataTrip);
  if (bestTrip === 0) { return [0, 0]; }
  let pairs = allNOfAKind(set, 2, metadataTrip.perRank);
  let pairUniverse = sortAscendingAcesHigh((metadataTrip.universe || []).concat(pairs));
  if (pairUniverse.length === 0) { return [0, 0]; } // no pairs
  let bestPair = pairUniverse.pop() || -1;
  return [bestTrip, bestPair];
}

export function best2Pairs(set: HandSet, metadata: RepeatMetadata|undefined = undefined): [number, number] {
  let perRank = groupBy(set.values(), cardToRank);
  let quads = allNOfAKind(set, 4, perRank);
  let trips = allNOfAKind(set, 3, perRank);
  let pairs = allNOfAKind(set, 2, perRank);
  let pairUniverse = sortAscendingAcesHigh(quads.concat(trips).concat(pairs));
  if (metadata) {
    metadata.perRank = perRank;
    metadata.universe = pairUniverse;
  }
  if (pairUniverse.length < 2) { return [0, 0]; }
  let n = pairUniverse.length;
  return [pairUniverse[n - 1], pairUniverse[n - 2]];
}

export function bestPair(set: HandSet): number {
  let metadata: RepeatMetadata = {};
  let twoBestPairs = best2Pairs(set, metadata);
  if (twoBestPairs[0] > 0) { return twoBestPairs[0]; }
  if (metadata.universe && metadata.universe.length > 0) { return metadata.universe[metadata.universe.length - 1]; }
  return 0;
}

export function bestHighCard(set: HandSet): number[] {
  return sortDescendingAcesHigh(Array.from(set.values(), c => rankToNum(cardToRank(c))));
}

export function value(hand: Hand): string {
  let set = new Set(hand);
  if (isRoyalFlush(set)) {
    return 'rf';
  } else if (true) {
  }
  return '';
}

export function deal(n: number): Hand[] { return shuffle(reservoirSample(fullDeck.values(), n)); }

// console.log(deal(5));
// console.log(deal(5));
// console.log(deal(5));
