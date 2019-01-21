"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
var shuffle = require('knuth-shuffle-seeded');
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
const ALLRANKS = makeAllRanks();
const ALLRANKSSET = new Set(ALLRANKS);
const royalFlushes = SUITS.map(s => ['10', Jack, Queen, King, Ace].map(n => mergeNumberSuit(n, s)));
const { fullDeck } = makeAllCardsSet();
function mergeNumberSuit(rank, suit) { return rank + SEP + suit; }
function cardToSuit(card) { return card.split(SEP)[1]; }
function cardToRank(card) { return card.split(SEP)[0]; }
function rankToNum(rank) {
    return parseInt(rank) || (rank === Ace && 1) || (rank === Jack && 11) || (rank === Queen && 12) ||
        (rank === King && 13) || 0;
}
exports.rankToNum = rankToNum;
function bestRankAcesHigh(ranks) { return Math.max(...ranks.map(r => r === 1 ? ACERANK : r)); }
function sortAscendingAcesHigh(arr) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => b - a); }
function sortDescendingAcesHigh(arr) { return arr.map(r => r === 1 ? ACERANK : r).sort((b, a) => a - b); }
function groupBySuit(list) { return utils_1.groupBy(list, cardToSuit); }
function validate(hand) {
    let suits = hand.map(cardToSuit);
    if (!utils_1.isSuperset(SUITSSET, new Set(suits))) {
        return false;
    }
    let ranks = hand.map(cardToRank);
    if (!utils_1.isSuperset(ALLRANKSSET, new Set(ranks))) {
        return false;
    }
    let num = ranks.map(rankToNum);
    return num.every(n => n >= 1 && n < ACERANK);
}
exports.validate = validate;
function makeAllRanks() {
    return Array.from(Array(10), (_, n) => n + 1).filter(n => n >= 2 && n <= 10).map(n => n.toString()).concat([
        Ace, Jack, Queen, King
    ]);
}
function makeSuitToCardsMap() {
    return new Map(SUITS.map(s => [s, ALLRANKS.map(n => mergeNumberSuit(n, s))]));
}
exports.makeSuitToCardsMap = makeSuitToCardsMap;
function makeAllCardsSet() {
    let suitToCards = makeSuitToCardsMap();
    let fullDeck = new Set([].concat(...suitToCards.values()));
    return { fullDeck, suitToCards };
}
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
            maxRanks.push(bestRankAcesHigh(cards.map(c => rankToNum(cardToRank(c)))));
        }
    }
    return maxRanks.length === 0 ? 0 : bestRankAcesHigh(maxRanks);
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
function nOfAKindHelper(set) { return utils_1.groupBy(set.values(), cardToRank); }
function allNOfAKind(set, N, perRank = undefined) {
    if (!perRank) {
        perRank = nOfAKindHelper(set);
    }
    let all = [];
    for (const [rank, hand] of perRank) {
        if (hand.length === N) {
            all.push(rank);
        }
    }
    return all.map(rankToNum);
}
function bestNOfAKind(set, N) {
    let all = allNOfAKind(set, N);
    return all.length === 0 ? 0 : bestRankAcesHigh(all);
}
function best4OfAKind(set) { return bestNOfAKind(set, 4); }
exports.best4OfAKind = best4OfAKind;
function best3OfAKind(set, metadata = undefined) {
    let perRank = utils_1.groupBy(set.values(), cardToRank);
    let quads = allNOfAKind(set, 4, perRank);
    let trips = allNOfAKind(set, 3, perRank);
    let tripUniverse = sortAscendingAcesHigh(quads.concat(trips));
    if (tripUniverse.length === 0) {
        return 0;
    } // no trips
    if (metadata) {
        metadata.perRank = perRank;
        metadata.universe = tripUniverse; // pass by reference, so the pop below will be visible outside
    }
    return tripUniverse.pop() || 0; // TypeScript pacification
}
exports.best3OfAKind = best3OfAKind;
function bestFullHouse(set) {
    let metadataTrip = {};
    let bestTrip = best3OfAKind(set, metadataTrip);
    if (bestTrip === 0) {
        return [0, 0];
    }
    let pairs = allNOfAKind(set, 2, metadataTrip.perRank);
    let pairUniverse = sortAscendingAcesHigh((metadataTrip.universe || []).concat(pairs));
    if (pairUniverse.length === 0) {
        return [0, 0];
    } // no pairs
    let bestPair = pairUniverse.pop() || -1;
    return [bestTrip, bestPair];
}
exports.bestFullHouse = bestFullHouse;
function best2Pairs(set, metadata = undefined) {
    let perRank = utils_1.groupBy(set.values(), cardToRank);
    let quads = allNOfAKind(set, 4, perRank);
    let trips = allNOfAKind(set, 3, perRank);
    let pairs = allNOfAKind(set, 2, perRank);
    let pairUniverse = sortAscendingAcesHigh(quads.concat(trips).concat(pairs));
    if (metadata) {
        metadata.perRank = perRank;
        metadata.universe = pairUniverse;
    }
    if (pairUniverse.length < 2) {
        return [0, 0];
    }
    let n = pairUniverse.length;
    return [pairUniverse[n - 1], pairUniverse[n - 2]];
}
exports.best2Pairs = best2Pairs;
function bestPair(set) {
    let metadata = {};
    let twoBestPairs = best2Pairs(set, metadata);
    if (twoBestPairs[0] > 0) {
        return twoBestPairs[0];
    }
    if (metadata.universe && metadata.universe.length > 0) {
        return metadata.universe[metadata.universe.length - 1];
    }
    return 0;
}
exports.bestPair = bestPair;
function bestHighCard(set) {
    return sortDescendingAcesHigh(Array.from(set.values(), c => rankToNum(cardToRank(c))));
}
exports.bestHighCard = bestHighCard;
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
];
function score(hand) {
    let set = new Set(hand);
    let output = 0; // TypeScript pacification: without initializing, can't output `ret`
    let score = scorefnName.map(([f, _]) => f).findIndex(fn => {
        output = fn(set);
        return (output instanceof Array ? output[0] : output) > 0;
    });
    if (score === -1) {
        throw new Error('empty deck?');
    }
    return { score, output };
}
exports.score = score;
/**
 * Compares two hands. Returns the notional version of "hand A minus hand B". If the return value is negative, then "A
 * is stronger than B", whereas if it is positive, then "A is weaker than B". Finally, if the return value is zero, then
 * "A is the same strength as B".
 * @param a
 * @param b
 */
function compareHands(a, b) {
    let { score: ascore, output: aout } = score(a);
    let { score: bscore, output: bout } = score(b);
    if (ascore !== bscore) {
        return ascore - bscore;
    }
    // tie-breakers
    if (typeof aout === 'boolean' && typeof bout === 'boolean') {
        return 0;
    }
    else if (typeof aout === 'number' && typeof bout === 'number') {
        return bout - aout;
    }
    else if (aout instanceof Array && bout instanceof Array) {
        if (aout.length !== bout.length) {
            throw new Error('cannot compare hands of unequal size');
        }
        let ret = aout.findIndex((a, i) => bout[i] !== a);
        if (ret === -1) {
            return 0;
        }
        return bout[ret] - aout[ret];
    }
    throw new Error('could not compare hands');
}
exports.compareHands = compareHands;
function dealRoundNoFolding(nplayers, seed) {
    if (fullDeck.size !== 52) {
        throw new Error('what kinda deck is this?');
    }
    let deck = shuffle([...fullDeck.values()], seed);
    let pockets = Array.from(Array(nplayers), _ => deck.splice(0, 2));
    let community = deck.splice(0, 5);
    let hands = pockets.map((pocket, i) => ({ player: i, hand: pocket.concat(community) }));
    hands.sort((a, b) => compareHands(a.hand, b.hand));
    let detailed = hands.map(h => Object.assign(h, score(h.hand))).map(h => Object.assign(h, { readable: scorefnName[h.score][1] }));
    return { pockets, community, hands, detailed };
}
exports.dealRoundNoFolding = dealRoundNoFolding;
if (require.main === module) {
    let { pockets, community, detailed } = dealRoundNoFolding(4);
    console.log('pockets\n', pockets);
    console.log('community\n', community);
    console.log('detailed\n', detailed);
}
