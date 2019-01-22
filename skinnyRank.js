"use strict";
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
function shortToNumberAcesHigh(short) { return shortToNumber(short) || 13; }
function shortToRank(short) { return ranks[shortToNumber(short)]; }
function shortToSuit(short) {
    return ((short < 'N') && 'c') || ((short <= 'Z') && 'd') || ((short < 'n') && 'h') || 's';
}
function validateShort(short) { return /^[a-zA-Z]$/.test(short); }
// Not intended for speed!
function readableToShort(rank, suit) {
    let rankIdx = ranks.indexOf(rank);
    let suitIdx = suits.indexOf(suit);
    if (rankIdx === -1 || suitIdx === -1) {
        throw new Error('bad readable: ' + [[rank, rankIdx], [suit, suitIdx]]);
    }
    return shorts[suitIdx * 13 + rankIdx];
}
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
// 2: straight flushes
function bestStraightFlush(hand) {
    if (hand.length < 5) {
        return 0;
    }
    let straightFlushesFound = [];
    let nhits = 0;
    let prevCharCode = hand.charCodeAt(0);
    for (let i = 1; i < hand.length - 5; i++) {
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
// 3: four of a kind
function best4OfAKind(hand) {
    if (hand.length < 4) {
        return [0, 0];
    }
    return [0, 0];
}
if (require.main === module) {
    console.log(initCards());
    initHands(true);
}
