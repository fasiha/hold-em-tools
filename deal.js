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
function prefixScan(arr, init = 1) {
    return arr.slice(init).reduce((o, n) => o.concat([o[o.length - 1].concat(n)]), [arr.slice(0, init)]);
}
function leftpad(str, desiredLen, padChar = ' ') {
    return padChar.repeat(Math.max(0, desiredLen - str.length)) + str;
}
function markdownTable(arr, header = []) {
    let cols = arr[0].length;
    let widths = Array.from(Array(cols), (_, n) => n).map(col => Math.max(...arr.map(v => v[col].length)));
    if (header.length) {
        arr = [header, header.map((_, col) => '-'.repeat(widths[col]))].concat(arr);
    }
    return arr.map(row => '| ' + row.map((elt, colidx) => leftpad(elt, widths[colidx], ' ')).join(' | ') + ' |')
        .join('\n');
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
        let objects = cards.map((v, pid) => {
            const initial = sortShorts(v.slice(0, 2)).concat(v.slice(2));
            const hand = v.slice().sort().join('');
            return { pid, hand, initial };
        });
        objects.sort((a, b) => skinnyRank_1.compareHands(a.hand, b.hand));
        for (const { pid, hand, initial } of objects) {
            const score = score2string.get(skinnyRank_1.fastScore(hand));
            const readable = [string2readable(initial.slice(0, 2).join(''), true), string2readable(initial.slice(2).join(''), false)].join(' | ');
            console.log(`\n### Seat ${pid + 1} :: ${readable} :: ${score}`);
            let cum = prefixScan(initial.slice(0, 6), 2);
            let table = [];
            for (const subhand of cum) {
                const sortedHand = subhand.slice().sort().join('');
                try {
                    let [_, arr] = yield (node_fetch_1.default('http://localhost:3000/?hand=' + sortedHand).then(x => x.json()));
                    let tot = utils_1.sum(arr);
                    table.push([string2readable(subhand.join(''))].concat(arr.map(n => fmt(n / tot))));
                }
                catch (e) { }
            }
            console.log(markdownTable(table, ['hand'].concat(rankNames)));
        }
    }))();
}
