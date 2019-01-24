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
const upACode = 'A'.charCodeAt(0);
function shortToNumber(short) {
    let uppercase = short < 'a';
    return (short.charCodeAt(0) - (uppercase ? upACode : loACode)) % 13;
}
const ACEHIRANK = 13;
// (0 to 12) || 13 means aces get mapped to 13.
function numberToNumberAcesHigh(rank) { return (rank || ACEHIRANK) + 1; }
function shortToNumberAcesHigh(short) { return numberToNumberAcesHigh(shortToNumber(short)); }
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
// 3: four of a kind
function bestNOfAKind(hand, N, nokickers = false, memo = undefined) {
    let kickersNeeded = nokickers ? 0 : 5 - N;
    if (hand.length < N) {
        return Array.from(Array(kickersNeeded + 1), _ => 0);
    }
    let hitsFound = [];
    let cardsPerRank;
    let best = 0;
    if (memo && memo.cardsPerRank) {
        cardsPerRank = memo.cardsPerRank;
        for (let i = 13; i > 0; i--) {
            if (cardsPerRank[i % 13] >= N) {
                hitsFound.push(shorts[i % 13]);
            }
        }
        best = shortToNumberAcesHigh(hitsFound[0]);
    }
    else {
        cardsPerRank = Array.from(Array(13), _ => 0);
        for (let short of hand) {
            const n = ++cardsPerRank[shortToNumber(short)];
            // push ONLY for `n===N`
            if (n === N) {
                hitsFound.push(short);
            }
        }
    }
    if (hitsFound.length > 0) {
        if (best === 0) {
            best = shortsToBestNumberAcesHighArr(hitsFound);
        }
        if (nokickers) {
            return [best];
        }
        if (hand.length === N) {
            return [best].concat(Array.from(Array(kickersNeeded), _ => 0));
        }
        let bestNumber = numberAcesHighToNumber(best);
        let kickers = [];
        for (let j = 13; j > 0 && kickers.length < kickersNeeded; j--) {
            const i = j % 13; // map 13->0 (i.e., look at aces first) but leave the rest alone.
            if (i !== bestNumber && cardsPerRank[i] > 0) {
                let kicker = numberToNumberAcesHigh(i);
                for (let copy = cardsPerRank[i]; copy > 0 && kickers.length < kickersNeeded; copy--) {
                    kickers.push(kicker);
                }
            }
        }
        return [best].concat(kickers).concat(Array.from(Array(kickersNeeded - kickers.length), _ => 0));
    }
    return Array.from(Array(kickersNeeded + 1), _ => 0);
}
function best4OfAKind(hand) { return bestNOfAKind(hand, 4); }
exports.best4OfAKind = best4OfAKind;
// 4: full house. First implement 3-of-a-kind (#7) and best-pair (#9)
function best3OfAKind(hand) { return bestNOfAKind(hand, 3); }
exports.best3OfAKind = best3OfAKind;
function bestPair(hand) { return bestNOfAKind(hand, 2); }
exports.bestPair = bestPair;
function removeCards(hand, remove) { return hand.replace(new RegExp(`[${remove}]`, 'g'), ''); }
function bestFullHouse(hand) {
    let memo = {};
    let trip = bestNOfAKind(hand, 3, true, memo)[0];
    let rank = numberAcesHighToNumber(trip);
    let toremove = [0, 1, 2, 3].map(n => shorts[n * 13 + rank]).join('');
    let pair = bestNOfAKind(removeCards(hand, toremove), 2, true, memo)[0];
    return (trip && pair) ? [trip, pair] : [0, 0];
}
exports.bestFullHouse = bestFullHouse;
if (require.main === module) {
    console.log(initCards());
    initHands(true);
}
