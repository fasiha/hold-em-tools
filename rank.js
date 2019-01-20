"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
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
function mergeNumberSuit(rank, suit) { return rank + SEP + suit; }
function cardToSuit(card) { return card.split(SEP)[1]; }
function cardToRank(card) { return card.split(SEP)[0]; }
function rankToNum(rank) {
    let ret = parseInt(rank) || (rank === Ace && 1) || (rank === Jack && 11) || (rank === Queen && 12) ||
        (rank === King && 13) || 0;
    if (ret === 0) {
        throw new Error('unknown rank');
    }
    return ret;
}
exports.rankToNum = rankToNum;
function bestRank(ranks) { return Math.max(...ranks.map(r => r === 1 ? ACERANK : r)); }
function groupBySuit(list) {
    let ret = utils_1.groupBy(list, cardToSuit);
    if (!utils_1.isSuperset(new Set(SUITS), new Set(ret.keys()))) {
        throw new Error('unknown suits');
    }
    return ret;
}
function makeSuitToCardsMap() {
    let ranks = Array.from(Array(10), (_, n) => n + 1).filter(n => n >= 2 && n <= 10).map(n => n.toString()).concat([
        Ace, Jack, Queen, King
    ]);
    return new Map(SUITS.map(s => [s, ranks.map(n => mergeNumberSuit(n, s))]));
}
function makeAllCardsSet() {
    let suitToCards = makeSuitToCardsMap();
    let fullDeck = new Set([].concat(...suitToCards.values()));
    return { fullDeck, suitToCards };
}
const royalFlushes = SUITS.map(s => ['10', Jack, Queen, King, Ace].map(n => mergeNumberSuit(n, s)));
const { fullDeck, suitToCards } = makeAllCardsSet();
function isRoyalFlush(handSet) {
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
function bestStraight(set) {
    let ranks = new Set(Array.from(set.values(), c => rankToNum(cardToRank(c))));
    let straightRanks = [];
    let matches = 0;
    for (let i = 2; i <= 13; i++) {
        if (ranks.has(i - 1) && ranks.has(i)) {
            matches++;
            if (matches >= 4) {
                straightRanks.push(i);
            }
        }
        else {
            matches = 0;
        }
    }
    if (matches === 3 && ranks.has(1)) {
        straightRanks.push(ACERANK);
    }
    return straightRanks.length === 0 ? 0 : Math.max(...straightRanks);
}
exports.bestStraight = bestStraight;
function isStraight(set) { return !!bestStraight(set); }
function bestFlush(set) {
    const perSuit = groupBySuit(set.values());
    let maxRanks = [];
    for (const cards of perSuit.values()) {
        if (cards.length >= 5) {
            maxRanks.push(bestRank(cards.map(c => rankToNum(cardToRank(c)))));
        }
    }
    return maxRanks.length === 0 ? 0 : bestRank(maxRanks);
}
exports.bestFlush = bestFlush;
function isFlush(set) { return !!bestFlush(set); }
function bestStraightFlush(set) {
    const perSuit = groupBySuit(set.values());
    let best = [];
    for (const cards of perSuit.values()) {
        if (cards.length >= 5) {
            const rankingStraight = bestStraight(new Set(cards));
            if (rankingStraight > 0) {
                best.push(rankingStraight);
            }
        }
    }
    return best.length > 0 ? Math.max(...best) : 0;
}
exports.bestStraightFlush = bestStraightFlush;
function isStraightFlush(set) { return !!bestStraightFlush(set); }
function bestNOfAKind(set, N) {
    let perRank = utils_1.groupBy(set.values(), cardToRank);
    let best = [];
    for (const [rank, hand] of perRank) {
        if (hand.length === N) {
            best.push(rank);
        }
    }
    return best.length === 0 ? 0 : bestRank(best.map(rankToNum));
}
function best4OfAKind(set) { return bestNOfAKind(set, 4); }
exports.best4OfAKind = best4OfAKind;
function value(hand) {
    let set = new Set(hand);
    if (isRoyalFlush(set)) {
        return 'rf';
    }
    else if (true) {
    }
    return '';
}
exports.value = value;
function deal(n) { return shuffle(utils_1.reservoirSample(fullDeck.values(), n)); }
exports.deal = deal;
// console.log(deal(5));
// console.log(deal(5));
// console.log(deal(5));
