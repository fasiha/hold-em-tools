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
// (0 to 12) || 13 means aces get mapped to 13.
function shortToNumberAcesHigh(short) { return (shortToNumber(short) || 13) + 1; }
function shortsToBestNumberAcesHigh2(shorts) {
    return Math.max(...shorts.map(shortToNumberAcesHigh));
}
function shortsToBestNumberAcesHigh(shorts) { return shortsToBestNumberAcesHigh2(shorts.split('')); }
function numberAcesHighToNumber(n) { return n === 14 ? 0 : n - 1; }
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
function removeCards(hand, remove) { return hand.replace(new RegExp(`[${remove}]`, 'g'), ''); }
function best4OfAKind(hand) {
    if (hand.length < 4) {
        return [0, 0];
    }
    let quadsFound = [];
    const shortToFriends = (short) => {
        let rank = shortToNumber(short);
        return [shorts[rank + 13], shorts[rank + 13 * 2], shorts[rank + 13 * 3]];
    };
    for (let i = 0; i < hand.length; i++) {
        let short = hand[i];
        if (short >= 'N') {
            break;
        }
        let friends = shortToFriends(short);
        let start = i + 1;
        for (let fi = 0; fi < friends.length && start >= 0; fi++) {
            start = hand.indexOf(friends[fi], start);
        }
        if (start < 0) {
            continue;
        }
        quadsFound.push(short);
    }
    if (quadsFound.length > 0) {
        let best = shortsToBestNumberAcesHigh2(quadsFound);
        if (hand.length === 4) {
            return [best, 0];
        }
        let bestShort = shorts[numberAcesHighToNumber(best)];
        let kicker = shortsToBestNumberAcesHigh(removeCards(hand, bestShort + shortToFriends(bestShort)));
        return [best, kicker];
    }
    return [0, 0];
}
exports.best4OfAKind = best4OfAKind;
// 4: full house. First implement 3-of-a-kind and best-pair
function handToSubSuits(hand) {
    let ret = [];
    let curr = 0;
    let start = 0;
    for (let max of 'MZmz') {
        for (let i = start; i <= hand.length; i++) {
            if (hand[i] > max || i === hand.length) {
                ret.push(hand.substring(start, curr));
                start = curr;
                break;
            }
            curr++;
        }
    }
    return ret;
}
function best3OfAKind(hand) {
    let perSuit = handToSubSuits(hand);
    let tripsFound = [];
    for (let suitIdx = 0; suitIdx < 2; suitIdx++) {
        for (let card of perSuit[suitIdx]) {
            let rank = shortToNumber(card);
            let hits = 1;
            for (let friendIdx = suitIdx + 1; friendIdx < 4; friendIdx++) {
                let friend = shorts[13 * friendIdx + rank];
                if (perSuit[friendIdx].indexOf(friend) >= 0 && (++hits) >= 3) {
                    break;
                }
            }
            if (hits >= 3) {
                tripsFound.push(card);
            }
        }
    }
    return tripsFound.map(shortToNumberAcesHigh);
}
exports.best3OfAKind = best3OfAKind;
function bestFullHouse(hand) {
    1;
    return 0;
}
if (require.main === module) {
    console.log(initCards());
    initHands(true);
}
