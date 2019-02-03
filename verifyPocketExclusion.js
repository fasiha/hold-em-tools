"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const skinnyRank_1 = require("./skinnyRank");
const utils_1 = require("./utils");
function searchs(buf, r, key) {
    let keybuf = Buffer.from(key);
    const keylen = key.length;
    let hits = [];
    let nhits = [];
    let scores = Array.from(Array(11), _ => 0);
    outer: for (let n = 0; n < buf.length; n += (r + 1)) {
        let hand = buf.subarray(n, n + r);
        let targetIdx = 0;
        for (let c of hand) {
            if (c > keybuf[targetIdx]) {
                continue outer;
            }
            else if (c === keybuf[targetIdx]) {
                if (++targetIdx === keylen) {
                    hits.push(hand.toString());
                    const thisScore = buf[n + r];
                    scores[thisScore]++;
                    nhits.push(thisScore);
                    continue outer;
                }
            }
        }
    }
    return { hits, scores, nhits };
}
if (require.main === module) {
    const r = 5;
    let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
    let pocket = 'JQ';
    let board = 'z';
    let sorter = (s) => s.split('').sort().join('');
    let boardHits = searchs(buf, r, sorter(board));
    let Jab = searchs(buf, r, sorter(board + pocket[0]));
    let Qab = searchs(buf, r, sorter(board + pocket[1]));
    let JQab = searchs(buf, r, sorter(board + pocket));
    let abNoJQ = { hits: [], nhits: [], scores: Array.from(Array(11), _ => 0) };
    for (let i = 0; i < boardHits.hits.length; i++) {
        const hand = boardHits.hits[i];
        if (!skinnyRank_1.search(hand, pocket[0]) && !skinnyRank_1.search(hand, pocket[1])) {
            abNoJQ.hits.push(hand);
            const n = boardHits.nhits[i];
            abNoJQ.nhits.push(n);
            abNoJQ.scores[n]++;
        }
    }
    const describe = (o) => console.log(o.hits.length);
    describe(boardHits);
    describe(Jab);
    describe(Qab);
    describe(JQab);
    describe(abNoJQ);
    let actual = boardHits.hits.length - Jab.hits.length - Qab.hits.length + JQab.hits.length;
    let expected = abNoJQ.hits.length;
    console.log(actual, expected, actual === expected);
    console.log(utils_1.sum(abNoJQ.scores), abNoJQ.nhits.length);
    const vsum = (a, b) => a.map((a, i) => a + b[i]);
    const vsub = (a, b) => a.map((a, i) => a - b[i]);
    let vactual = vsub(vsum(boardHits.scores, JQab.scores), vsum(Jab.scores, Qab.scores));
    let vexpected = abNoJQ.scores;
    console.log(vactual, vexpected, vactual.every((a, i) => a === vexpected[i]));
    // console.log(searchScore(buf, r, 'bd', 1));
}
