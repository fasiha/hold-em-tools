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
const rankNames = 'rf,sf,qu,fh,fl,st,tr,2p,pa,hi'.split(',');
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
        return '<1';
    }
    return Math.round(n * 100).toString();
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
function handsToTableCombine(hands) {
    return __awaiter(this, void 0, void 0, function* () {
        let table = [];
        const normalize = (arr) => {
            const tot = utils_1.sum(arr);
            return arr.map(n => n / tot);
        };
        for (const hand of hands) {
            const shand = hand.slice().sort().join('');
            if (hand.length > 3) {
                let arrMine = shand.length === 7 ? [] : normalize(yield handToFrequencyExclusion(shand));
                let pocket = hand.slice(0, 2).join('');
                let board = hand.slice(2).join('');
                let arrOthers = normalize(yield handToFrequencyExclusion(board, pocket));
                let numbers = arrOthers.map((o, i) => (i in arrMine ? fmt(arrMine[i]) : '') + `×${fmt(o)}`);
                let row = [
                    (string2readable(pocket) + '×' + string2readable(board)) + ' = ' + score2string.get(skinnyRank_1.fastScore(shand)),
                    ...numbers
                ];
                table.push(row);
            }
            else {
                let arrMine = normalize(yield handToFrequencyExclusion(hand.join('')));
                let numbers = arrMine.map(fmt);
                let row = [string2readable(shand) + ' = ' + score2string.get(skinnyRank_1.fastScore(shand)), ...numbers];
                table.push(row);
            }
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
        const sorter = (s) => s.split('').sort().join('');
        if (!exclude) {
            return handToFrequency(sorter(hand));
        }
        if (exclude.length !== 2) {
            throw new Error('exclusion length != 2 unimplemented');
        }
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
        let objects = cards.map((v, pid) => {
            const initial = v.slice();
            const hand = v.slice().sort().join('');
            const scoren = skinnyRank_1.fastScore(hand);
            const score = score2string.get(scoren);
            return { pid, hand, scoren, score, initial };
        });
        objects.sort((a, b) => skinnyRank_1.compareHands(a.hand, b.hand));
        for (let [hid, hand] of utils_1.enumerate(cards)) {
            console.log(makeheader(`Player ${hid + 1}`));
            console.log(markdownTable(yield handsToTableCombine([2, 5, 6, 7].map(n => hand.slice(0, n))), [`Percents`].concat(rankNames)));
        }
        console.log(makeheader('Finally'));
        console.log(objects
            .map((o, i) => `${i + 1}. Player ${o.pid + 1} :: ${string2readable(o.initial.slice(0, 2).sort().join(''))} | ${string2readable(o.initial.slice(2).join(''))} => ${o.score}`)
            .join('\n'));
    });
}
exports.printRealtime = printRealtime;
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
