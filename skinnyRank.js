"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function initCards() {
    const shorts = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const ranks = '0123456789JQK'.split('');
    const suits = 'cdhs'.split('');
    let shortToRank = new Map([]);
    let shortToSuit = new Map([]);
    let i = 0;
    for (let suit of suits) {
        for (let rank of ranks) {
            const short = shorts[i++];
            shortToRank.set(short, rank);
            shortToSuit.set(short, suit);
        }
    }
    return { shorts, suits, ranks };
}
const { shorts, suits, ranks } = initCards();
const loACode = 'a'.charCodeAt(0);
/**
 * Convert a short (character) to a number that could index into `short` to get a suit-mate.
 * Old trick: convert to lowercase by `(x | 0b100000)`, i.e., turn on the 6th last significant bit.
 * @param short string in `shorts`
 * @returns number between 0 and 12 inclusive: 0 ace, 1 for deuce, 12 for king.
 */
function shortToNumber(short) { return ((short.charCodeAt(0) | 0b100000) - loACode) % 13; }
exports.shortToNumber = shortToNumber;
const ACEHIRANK = 13;
// (0 to 12) || 13 means aces get mapped to 13.
/**
 * Maps a number between 0 and 12 (inclusive) to the natural rank.
 * @param num number between 0 and 12 inclusive
 * @returns number between 2 and 14 inclusive. 2 deuce, 3 three, 13 king, 14 ace.
 */
function numberToNumberAcesHigh(num) { return (num || ACEHIRANK) + 1; }
exports.numberToNumberAcesHigh = numberToNumberAcesHigh;
function shortToNumberAcesHigh(short) { return numberToNumberAcesHigh(shortToNumber(short)); }
exports.shortToNumberAcesHigh = shortToNumberAcesHigh;
function shortsToBestNumberAcesHighArr(shorts) {
    return Math.max(...shorts.map(shortToNumberAcesHigh));
}
function shortsToBestNumberAcesHighStr(shorts) {
    return shortsToBestNumberAcesHighArr(shorts.split(''));
}
function numberAcesHighToNumber(n) { return n === (ACEHIRANK + 1) ? 0 : n - 1; }
function shortToRank(short) { return ranks[shortToNumber(short)]; }
function shortToSuit(short) {
    return ((short < 'N') && 'c') || ((short <= 'Z') && 'd') || ((short < 'n') && 'h') || 's';
}
function validateShort(short) { return /^[a-zA-Z]$/.test(short); }
exports.validateShort = validateShort;
// Not intended for speed!
function readableToShort(rank, suit) {
    let rankIdx = ranks.indexOf(rank);
    let suitIdx = suits.indexOf(suit);
    if (rankIdx === -1 || suitIdx === -1) {
        throw new Error('bad readable: ' + [[rank, rankIdx], [suit, suitIdx]]);
    }
    return shorts[suitIdx * 13 + rankIdx];
}
exports.readableToShort = readableToShort;
function sortString(s) { return s.split('').sort().join(''); }
function range(n) { return Array.from(Array(n), (_, n) => n); }
function flatten(arr) { return [].concat(...arr); }
function initHands(verbose = false) {
    const rfRanks = '09JQK'.split('');
    const royalFlushes = suits.map(suit => rfRanks.map(rank => readableToShort(rank, suit)).join(''));
    if (verbose) {
        console.log(royalFlushes);
    }
    // not used anywhere since there's that jump between ace and 9.
    const rangeOuter = range(9);
    const rangeInner = range(5);
    const straightFlushes = flatten(suits.map(suit => rangeOuter.map(startRank => rangeInner.map(delta => readableToShort(ranks[startRank + delta], suit)).join(''))));
    if (verbose) {
        console.log(straightFlushes);
    }
    const fours = ranks.map(rank => suits.map(suit => readableToShort(rank, suit)).join(''));
    if (verbose) {
        console.log(fours);
    }
    return { royalFlushes, straightFlushes };
}
const { straightFlushes } = initHands();
// 1: royal flushes
function isRoyalFlush(hand) {
    if (hand.length < 5) {
        return 0;
    }
    return ((hand.startsWith('a') && hand.includes('jklm')) || (hand.includes('JKLM') && hand.includes('A')) ||
        (hand.includes('wxyz') && hand.includes('n')) || (hand.endsWith('WXYZ') && hand.includes('N')))
        ? 1
        : 0;
}
exports.isRoyalFlush = isRoyalFlush;
// 2: straight flushes
function bestStraightFlush(hand) {
    if (hand.length < 5) {
        return 0;
    }
    let straightFlushesFound = [];
    let nhits = 0;
    let prevCharCode = hand.charCodeAt(0);
    for (let i = 1; i < hand.length; i++) {
        let newCharCode = hand.charCodeAt(i);
        if (prevCharCode + 1 === newCharCode) {
            if ((++nhits) >= 4 && (shortToSuit(hand[i]) === shortToSuit(hand[i - 4]))) {
                straightFlushesFound.push(hand[i]);
            }
        }
        else {
            nhits = 0;
        }
        prevCharCode = newCharCode;
    }
    if (straightFlushesFound.length > 0) {
        return Math.max(...straightFlushesFound.map(shortToNumberAcesHigh));
    }
    return 0;
}
exports.bestStraightFlush = bestStraightFlush;
function memoize(hand) {
    let cardsPerRank = Array.from(Array(13), _ => 0);
    for (let short of hand) {
        cardsPerRank[shortToNumber(short)]++;
    }
    return { cardsPerRank };
}
function sweep(hand, memo) {
    if (memo.cardsPerRank.length === 0) {
        return sweep(hand, memoize(hand));
    }
    let quad = 0, trip = 0, trip2 = 0, pair = 0, pair2 = 0;
    for (let i = 13; i > 0; i--) {
        const hits = memo.cardsPerRank[i % 13];
        quad = quad || (hits === 4 && numberToNumberAcesHigh(i % 13)) || 0;
        if (trip) {
            trip2 = trip2 || (hits === 3 && numberToNumberAcesHigh(i % 13)) || 0;
        }
        if (pair) {
            pair2 = pair2 || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0;
        }
        trip = trip || (hits === 3 && numberToNumberAcesHigh(i % 13)) || 0;
        pair = pair || (hits === 2 && numberToNumberAcesHigh(i % 13)) || 0;
    }
    return [quad, trip, trip2, pair, pair2];
}
function appendKickers(hand, memo, nCardsFound, acesLow) {
    if (!memo.cardsPerRank.length) {
        return appendKickers(hand, memoize(hand), nCardsFound, acesLow);
    }
    let kickersNeeded = 5 - nCardsFound;
    for (let i = 13; i > 0; i--) {
        const howMany = memo.cardsPerRank[i % 13];
        if (howMany === 0 || acesLow.indexOf(i % 13) >= 0) {
            continue;
        }
        const number = i % 13;
        for (let j = 0; j < howMany && kickersNeeded > 0; j++, kickersNeeded--) {
            acesLow.push(number);
        }
        if (kickersNeeded <= 0) {
            return acesLow.map(numberToNumberAcesHigh);
        }
    }
    return acesLow.map(numberToNumberAcesHigh).concat(Array.from(Array(kickersNeeded), _ => 0));
}
function score(hand) {
    if (isRoyalFlush(hand)) {
        return { score: 1, output: [1] };
    }
    const sf = bestStraightFlush(hand);
    if (sf) {
        return { score: 2, output: [sf] };
    }
    let memo = memoize(hand);
    let [quad, trip, trip2, pair, pair2] = sweep(hand, memo);
    if (quad) {
        return { score: 3, output: appendKickers(hand, memo, 4, [numberAcesHighToNumber(quad)]) };
    }
    if (trip && trip2) {
        return { score: 4, output: [trip, trip2] };
    }
    else if (trip && pair) {
        return { score: 4, output: [trip, pair] };
    }
    const flush = bestFlushUnsafe(hand);
    if (flush[0] > 0) {
        return { score: 5, output: flush };
    }
    const str = bestStraight(hand, memo);
    if (str) {
        return { score: 6, output: [str] };
    }
    if (trip) {
        return { score: 7, output: appendKickers(hand, memo, 3, [numberAcesHighToNumber(trip)]) };
    }
    if (pair && pair2) {
        return {
            score: 8,
            output: appendKickers(hand, memo, 4, [numberAcesHighToNumber(pair), numberAcesHighToNumber(pair2)])
        };
    }
    if (pair) {
        return { score: 9, output: appendKickers(hand, memo, 2, [numberAcesHighToNumber(pair)]) };
    }
    return { score: 10, output: appendKickers(hand, memo, 0, []) };
}
exports.score = score;
function compareHands(a, b) {
    let { score: ascore, output: aout } = score(a);
    let { score: bscore, output: bout } = score(b);
    if (ascore !== bscore) {
        return ascore - bscore;
    }
    // tie-breakers
    if (aout.length !== bout.length) {
        throw new Error('cannot compare hands of unequal size');
    }
    let ret = aout.findIndex((a, i) => bout[i] !== a);
    if (ret === -1) {
        return 0;
    }
    return bout[ret] - aout[ret];
}
exports.compareHands = compareHands;
function bestStraight(hand, memo) {
    if (!memo.cardsPerRank.length) {
        return bestStraight(hand, memoize(hand));
    }
    let stringSoFar = 0;
    let prevHits = memo.cardsPerRank[0];
    // start at king, prev = ace hits
    for (let i = 12; i >= 0; i--) {
        if (memo.cardsPerRank[i] > 0 && prevHits > 0) {
            stringSoFar++;
            if (stringSoFar >= 4) {
                return numberToNumberAcesHigh(i + stringSoFar);
            }
        }
        else {
            stringSoFar = 0;
        }
        prevHits = memo.cardsPerRank[i];
    }
    return 0;
}
function handToSubSuits(hand) {
    let ret = [];
    let curr = 0;
    let start = 0;
    for (let max of 'MZmz') {
        for (let i = start; i <= hand.length; i++) {
            if (hand[i] > max || i === hand.length) {
                if (curr - start >= 5) {
                    ret.push(hand.substring(start, curr));
                }
                start = curr;
                break;
            }
            curr++;
        }
    }
    return ret;
}
function bestFlushUnsafe(hand) {
    let suits = handToSubSuits(hand);
    if (suits.length === 0) {
        return [0, 0, 0, 0, 0];
    }
    // if more than one flush is found, they have to be sorted element-wise, and I can't be having with that.
    // FIXME
    if (suits.length > 1) {
        throw new Error('requires safe flush finder');
    }
    if (shortToNumber(suits[0][0]) === 0) {
        return [14].concat(suits[0].slice(-4).split('').reverse().map(shortToNumberAcesHigh));
    }
    return suits[0].slice(-5).split('').reverse().map(shortToNumberAcesHigh);
}
if (require.main === module) { }
