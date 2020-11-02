"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const comb_1 = require("./comb");
const pocket = __importStar(require("./map-r-7-n-2.json"));
const flop = __importStar(require("./map-r-7-n-3.json"));
const skinnyRank_1 = require("./skinnyRank");
const { shorts } = skinnyRank_1.initCards();
function playerAnalysis(shortsSoFar) {
    const len = shortsSoFar.length;
    if (len === 2) {
        const v = pocket[shortsSoFar.slice().sort().join('')];
        return { my: v };
    }
    const deckRemaining = shorts.filter(s => !shortsSoFar.includes(s));
    const myHistogram = Array.from(Array(11), _ => 0);
    let restHistogram = Array.from(Array(11), _ => 0);
    if (len < 7) {
        for (const newCards of comb_1.combinations(deckRemaining, 7 - len)) {
            myHistogram[skinnyRank_1.fastScore(shortsSoFar.concat(newCards).sort().join(''))]++;
        }
    }
    if (len >= 5) {
        const board = shortsSoFar.slice(2);
        if (board.length === 3) {
            restHistogram = [0].concat(flop[board.slice().sort().join('')]);
        }
        else {
            for (const newCards of comb_1.combinations(deckRemaining, 7 - board.length)) {
                restHistogram[skinnyRank_1.fastScore(board.concat(newCards).sort().join(''))]++;
            }
        }
    }
    return len === 2 ? { my: myHistogram.slice(1) }
        : len === 7 ? { rest: restHistogram.slice(1) }
            : { my: myHistogram.slice(1), rest: restHistogram.slice(1) };
}
exports.playerAnalysis = playerAnalysis;
function formatHistogram(v) {
    const sum = v.reduce((p, c) => p + c);
    return v.map(x => Math.round(x / sum * 1000) / 10);
}
function readablesToShorts(s) {
    const arr = s.trim().split(' ').map(s => skinnyRank_1.readableToShort(s));
    if (!arr.every(skinnyRank_1.validateShort)) {
        throw new Error('invalid');
    }
    return arr;
}
;
if (module === require.main) {
    const readable = 'As Qd Qh 6c Kh 7h 9c' || '2c 6s Qh 7c Js 4c 3d';
    const short = readablesToShorts(readable);
    console.log(readable, short, skinnyRank_1.fastScore(short.slice().sort().join('')));
    for (const len of [2, 5, 6, 7]) {
        const soFar = short.slice(0, len);
        const { my, rest } = playerAnalysis(soFar);
        const summary = soFar.map(skinnyRank_1.shortToReadable).join(' ') + ' '.repeat(4 * (7 - len));
        if (my) {
            console.log(`My   ${summary}: ${formatHistogram(my).join(' | ')}`);
        }
        if (rest) {
            console.log(`Rest ${summary}: ${formatHistogram(rest).join(' | ')}`);
        }
        console.log('');
    }
}
