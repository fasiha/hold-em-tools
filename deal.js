"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
var shuffle = require('knuth-shuffle-seeded');
const skinnyRank_1 = require("./skinnyRank");
const utils_1 = require("./utils");
const { shorts } = skinnyRank_1.initCards();
const rankNames = 'roya,strf,quad,fuho,flus,str8,trip,twop,pair,hica'.split(',');
const score2string = new Map(rankNames.map((s, i) => [i + 1, s]));
function sortShorts(hand, ascending = true) {
    return hand.sort((a, b) => (ascending ? 1 : -1) * (skinnyRank_1.shortToNumberAcesHigh(a) - skinnyRank_1.shortToNumberAcesHigh(b)));
}
function string2readable(hand, sort = false, ascending = true) {
    let a = hand.split('');
    if (sort) {
        sortShorts(a, ascending);
    }
    return a.map(skinnyRank_1.shortToReadable).join('');
}
function fmt(n) {
    if (n === 0) {
        return '0';
    }
    if (n < .01) {
        return (n * 100).toExponential(0);
    }
    return (n * 100).toFixed(1);
}
function pad(str, desiredLen, padChar = ' ', left = true) {
    return (left ? '' : str) + padChar.repeat(Math.max(0, desiredLen - str.length)) + (left ? str : '');
}
function markdownTable(arr, header = []) {
    let cols = arr[0].length;
    if (header.length) {
        arr = [header].concat(arr);
    }
    let widths = Array.from(Array(cols), (_, n) => n).map(col => Math.max(...arr.map(v => v[col].length)));
    if (header.length) {
        arr.splice(1, 0, header.map((_, col) => '-'.repeat(widths[col])));
    }
    return arr.map(row => '| ' + row.map((elt, colidx) => pad(elt, widths[colidx], ' ', colidx !== 0)).join(' | ') + ' |')
        .join('\n');
}
function makeheader(text, level = 3) { return `\n${'#'.repeat(level)} ${text}`; }
function handsToTable(hands, excludes = []) {
    return __awaiter(this, void 0, void 0, function* () {
        if (excludes.length > 0 && excludes.length !== hands.length) {
            throw new Error('need as many exclusions as hands');
        }
        let table = [];
        for (const [idx, hand] of utils_1.enumerate(hands)) {
            const sortedHand = hand.slice().sort().join('');
            let ex = excludes[idx] ? excludes[idx].join('') : '';
            let arr = yield handToFrequencyExclusion(sortedHand, ex);
            let tot = utils_1.sum(arr);
            let sub = hand.join('');
            table.push([
                string2readable(sub) + (ex ? ` (minus: ${string2readable(ex)})` : '') +
                    ` (${score2string.get(skinnyRank_1.fastScore(sortedHand))})`
            ].concat(arr.map(n => fmt(n / tot))));
        }
        return table;
    });
}
function handToFrequency(hand) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield node_fetch_1.default('http://localhost:3000/?hand=' + hand);
        if (!res.ok) {
            throw new Error('HTTP error ' + res.status + ' for: ' + hand);
        }
        let [_, arr] = yield res.json();
        return arr;
    });
}
function handToFrequencyExclusion(hand, exclude = '') {
    return __awaiter(this, void 0, void 0, function* () {
        if (!exclude) {
            return handToFrequency(hand);
        }
        if (exclude.length !== 2) {
            throw new Error('exclusion length != 2 unimplemented');
        }
        const sorter = (s) => s.split('').sort().join('');
        const vsum = (a, b) => a.map((a, i) => a + b[i]);
        const vsub = (a, b) => a.map((a, i) => a - b[i]);
        let handHits = yield handToFrequency(sorter(hand));
        let handEx0Hits = yield handToFrequency(sorter(hand + exclude[0]));
        let handEx1Hits = yield handToFrequency(sorter(hand + exclude[1]));
        let handEx12Hits = Array.from(Array(10), _ => 0);
        if (hand.length < 5) {
            handEx12Hits = yield handToFrequency(sorter(hand + exclude));
        }
        return vsub(vsum(handHits, handEx12Hits), vsum(handEx1Hits, handEx0Hits));
    });
}
function printRealtime(cards) {
    return __awaiter(this, void 0, void 0, function* () {
        // print each pocket & rating
        // then print pockets+flop, and flop
        // then pockets+flop+turn, and flop+turn
        // etc. with the river
        let n = 2;
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(0, 2))), ['Pockets %s'].concat(rankNames)));
        n = 5;
        console.log(makeheader('Pockets + flop'));
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(0, n))), ['Pockets+flop %s'].concat(rankNames)));
        console.log(makeheader('(Just flop)', 4));
        console.log(markdownTable(yield handsToTable([cards[0].slice(2, n)]), ['(Flop %s)'].concat(rankNames)));
        console.log(makeheader('Flop minus each player\'s pocket', 4));
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(2, n)), cards.map(hand => hand.slice(0, 2))), ['Flop-pocket %s'].concat(rankNames)));
        n = 6;
        console.log(makeheader('Pockets + flop + turn'));
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(0, n))), ['Pocket+flop+turn %s'].concat(rankNames)));
        console.log(makeheader('(Just flop+turn %s)', 4));
        console.log(markdownTable(yield handsToTable([cards[0].slice(2, n)]), ['(flop+turn)'].concat(rankNames)));
        console.log(makeheader('Flop+turn minus each player\'s pocket', 4));
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(2, n)), cards.map(hand => hand.slice(0, 2))), ['Board-pocket %s'].concat(rankNames)));
        let objects = cards.map((v, pid) => {
            const initial = v.slice();
            const hand = v.slice().sort().join('');
            const scoren = skinnyRank_1.fastScore(hand);
            const score = score2string.get(scoren);
            return { pid, hand, scoren, score, initial };
        });
        objects.sort((a, b) => skinnyRank_1.compareHands(a.hand, b.hand));
        console.log(makeheader('Final'));
        console.log(markdownTable(yield handsToTable([cards[0].slice(2)]), ['Final board %s'].concat(rankNames)));
        n = 7;
        console.log(makeheader('Board minus each player\'s pocket ≈%s', 4));
        console.log(markdownTable(yield handsToTable(cards.map(hand => hand.slice(2, n)), cards.map(hand => hand.slice(0, 2))), ['Board-pocket'].concat(rankNames)));
        console.log(objects
            .map((o, i) => `${i + 1}. Player ${o.pid + 1} :: ${string2readable(o.initial.slice(0, 2).sort().join(''))} | ${string2readable(o.initial.slice(2).join(''))} => ${o.score}`)
            .join('\n'));
    });
}
if (module === require.main) {
    (() => __awaiter(this, void 0, void 0, function* () {
        let args = process.argv.slice(2);
        let seed = parseInt(args[0]) || 0;
        let players = parseInt(args[1]) || 4;
        let shuffled = shuffle(shorts.slice(), seed);
        let cards = Array.from(Array(players), _ => []);
        for (let cid = 0; cid < 2; cid++) {
            for (let pid = 0; pid < players; pid++) {
                cards[pid].push(shuffled.pop());
            }
        }
        for (let cid = 0; cid < 5; cid++) {
            const c = shuffled.pop();
            for (let pid = 0; pid < players; pid++) {
                cards[pid].push(c);
            }
        }
        // await printResult(cards);
        printRealtime(cards);
    }))();
}
