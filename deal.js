"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
var shuffle = require('knuth-shuffle-seeded');
const skinnyRank_1 = require("./skinnyRank");
const { shorts } = skinnyRank_1.initCards();
const score2string = new Map('rf,sf,quad,fh,fl,str,trip,twop,pair,hic'.split(',').map((s, i) => [i + 1, s]));
function string2readable(hand, sort = false, ascending = true) {
    let a = hand.split('');
    if (sort) {
        a.sort((a, b) => (ascending ? 1 : -1) * (skinnyRank_1.shortToNumberAcesHigh(a) - skinnyRank_1.shortToNumberAcesHigh(b)));
    }
    return a.map(skinnyRank_1.shortToReadable).join(' ');
}
if (module === require.main) {
    let args = process.argv.slice(2);
    let seed = parseInt(args[0]) || 0;
    let players = parseInt(args[1]) || 4;
    let shuffled = shuffle(shorts.slice(), seed);
    let cards = Array.from(Array(players), _ => []);
    for (let cid = 0; cid < 7; cid++) {
        for (let pid = 0; pid < players; pid++) {
            cards[pid].push(shuffled.pop());
        }
    }
    let histogram = new Map();
    try {
        let rows = fs_1.readFileSync('map-r-7-n-2.ldjson', 'utf8').trim().split('\n').map(s => JSON.parse(s));
        histogram.set(2, new Map(rows));
    }
    catch (e) {
        console.error('n=2 file not found. Skipping.', e);
    }
    let hands = cards
        .map((v, pid) => {
        const initial = v.slice();
        const hand = v.sort().join('');
        return { pid, hand, initial };
    })
        .sort((a, b) => skinnyRank_1.compareHands(a.hand, b.hand))
        .map(({ pid, hand, initial }) => {
        const score = score2string.get(skinnyRank_1.fastScore(hand));
        const readable = [
            string2readable(initial.slice(0, 2).join(''), true, false),
            string2readable(initial.slice(2).join(''), true)
        ].join(' | ');
        let printable = `Player ${pid + 1}: ${readable} :: ${score}`;
        if (histogram.has(2)) {
            let h = histogram.get(2);
            if (h) {
                let hist = h.get(initial.slice(0, 2).sort().join('')) || [];
                printable += ` :: Histogram: [${hist.join(', ')}]`;
            }
        }
        return printable;
    });
    console.log(hands.join('\n'));
}
