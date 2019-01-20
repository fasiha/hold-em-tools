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
function bestRank(ranks: number[]): number { return Math.max(...ranks.map(r => r === 1 ? ACERANK : r)); }
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
    if (cards.length >= 5) { maxRanks.push(bestRank(cards.map(c => rankToNum(cardToRank(c))))); }
  }
  return maxRanks.length === 0 ? 0 : bestRank(maxRanks);
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

function bestNOfAKind(set: HandSet, N: number): number {
  let perRank = groupBy(set.values(), cardToRank);
  let best: string[] = [];
  for (const [rank, hand] of perRank) {
    if (hand.length === N) { best.push(rank); }
  }
  return best.length === 0 ? 0 : bestRank(best.map(rankToNum));
}
export function best4OfAKind(set: HandSet): number { return bestNOfAKind(set, 4); }

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
