import {groupBy, isSuperset, reservoirSample} from './utils';
var shuffle = require('knuth-shuffle-seeded');

type Hand = string[];
type HandSet = Set<string>;

const SUITS = 's,c,h,d'.split(',');
const SUITSSET = new Set(SUITS);
// const SUITS = '♠︎,♣︎,♥︎,♦︎'.split(',');
// const white = '♡♢♤♧';
const Ace = 'A';
const Jack = 'J';
const Queen = 'Q';
const King = 'K';
const ACERANK = 14;

const SEP = '/';
const ALLRANKS: string[] = makeAllRanks();
const ALLRANKSSET: Set<string> = new Set(ALLRANKS);
const royalFlushes: string[][] = SUITS.map(s => ['10', Jack, Queen, King, Ace].map(n => mergeNumberSuit(n, s)));
const {fullDeck} = makeAllCardsSet();

function mergeNumberSuit(rank: string, suit: string): string { return rank + SEP + suit; }
function cardToSuit(card: string): string { return card.split(SEP)[1]; }
function cardToRank(card: string): string { return card.split(SEP)[0]; }
export function rankToNum(rank: string): number {
  return parseInt(rank) || (rank === Ace && 1) || (rank === Jack && 11) || (rank === Queen && 12) ||
         (rank === King && 13) || 0;
}
function bestRankAcesHigh(ranks: number[]): number { return Math.max(...ranks.map(r => r === 1 ? ACERANK : r)); }
function sortAscendingAcesHigh(arr: number[]) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => b - a); }
function sortDescendingAcesHigh(arr: number[]) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => a - b); }
function groupBySuit(list: IterableIterator<string>|Hand): Map<string, Hand> { return groupBy(list, cardToSuit); }
export function validate(hand: Hand): boolean {
  let suits = hand.map(cardToSuit);
  if (!isSuperset(SUITSSET, new Set(suits))) { return false; }
  let ranks = hand.map(cardToRank);
  if (!isSuperset(ALLRANKSSET, new Set(ranks))) { return false; }
  let num = ranks.map(rankToNum);
  return num.every(n => n >= 1 && n < ACERANK);
}
function makeAllRanks(): string[] {
  return Array.from(Array(10), (_, n) => n + 1).filter(n => n >= 2 && n <= 10).map(n => n.toString()).concat([
    Ace, Jack, Queen, King
  ]);
}
export function makeSuitToCardsMap(): Map<string, Hand> {
  return new Map(SUITS.map(s => [s, ALLRANKS.map(n => mergeNumberSuit(n, s))] as [string, string[]]));
}
function makeAllCardsSet() {
  let suitToCards = makeSuitToCardsMap();
  let fullDeck = new Set(([] as string[]).concat(...suitToCards.values()));
  return {fullDeck, suitToCards};
}

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

type ScoreFunc =
    (((handSet: Set<string>) => boolean)|((set: Set<string>, metadata?: RepeatMetadata|undefined) => number)|
     ((set: Set<string>, metadata?: RepeatMetadata|undefined) => number[])|((set: Set<string>) => number[]));
const scorefnName = [
  [isRoyalFlush, 'royal flush'],
  [bestStraightFlush, 'straight flush'],
  [best4OfAKind, 'four of a kind'],
  [bestFullHouse, 'full house'],
  [bestFlush, 'flush'],
  [bestStraight, 'straight'],
  [best3OfAKind, 'three of a kind'],
  [best2Pairs, 'two pairs'],
  [bestPair, 'pair'],
  [bestHighCard, 'high card'],
] as [ScoreFunc, string][];

type ReturnValue = number|number[]|boolean;
export function score(hand: Hand): {score: number, output: ReturnValue} {
  let set = new Set(hand);
  let output: ReturnValue = 0 as ReturnValue; // TypeScript pacification: without initializing, can't output `ret`
  let score = scorefnName.map(([f, _]) => f).findIndex(fn => {
    output = fn(set);
    return (output instanceof Array ? output[0] : output) > 0;
  });
  if (score === -1) { throw new Error('empty deck?') }
  return {score, output};
}
/**
 * Compares two hands. Returns the notional version of "hand A minus hand B". If the return value is negative, then "A
 * is stronger than B", whereas if it is positive, then "A is weaker than B". Finally, if the return value is zero, then
 * "A is the same strength as B".
 * @param a
 * @param b
 */
export function compareHands(a: Hand, b: Hand): number {
  let {score: ascore, output: aout} = score(a);
  let {score: bscore, output: bout} = score(b);
  if (ascore !== bscore) { return ascore - bscore; }
  // tie-breakers
  if (typeof aout === 'boolean' && typeof bout === 'boolean') {
    return 0;
  } else if (typeof aout === 'number' && typeof bout === 'number') {
    return bout - aout;
  } else if (aout instanceof Array && bout instanceof Array) {
    if (aout.length !== bout.length) { throw new Error('cannot compare hands of unequal size'); }
    let ret = aout.findIndex((a, i) => (bout as number[])[i] !== a);
    if (ret === -1) { return 0; }
    return bout[ret] - aout[ret];
  }
  throw new Error('could not compare hands');
}

export function dealRoundNoFolding(nplayers: number, seed?: number) {
  if (fullDeck.size !== 52) { throw new Error('what kinda deck is this?'); }
  let deck: Hand = shuffle([...fullDeck.values()], seed);
  let pockets = Array.from(Array(nplayers), _ => deck.splice(0, 2));
  let community = deck.splice(0, 5);
  let hands: {player: number, hand: Hand}[] = pockets.map((pocket, i) => ({player: i, hand: pocket.concat(community)}));
  hands.sort((a, b) => compareHands(a.hand, b.hand));
  let detailed =
      hands.map(h => Object.assign(h, score(h.hand))).map(h => Object.assign(h, {readable: scorefnName[h.score][1]}));
  return {pockets, community, hands, detailed};
}

if (require.main === module) {
  let {pockets, community, detailed} = dealRoundNoFolding(4);
  console.log('pockets\n', pockets)
  console.log('community\n', community);
  console.log('detailed\n', detailed);
}