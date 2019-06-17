"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const comb_1 = require("./comb");
const deal_1 = require("./deal");
const skinnyRank_1 = require("./skinnyRank");
function parseRank(s) {
    let res = parseInt(s.replace('A', '1'));
    return isNaN(res) ? s : '' + (res - 1);
}
;
function readablesToShorts(s) {
    const arr = s.trim().split(' ').map(s => skinnyRank_1.readableToShort(parseRank(s.slice(0, -1)), s.slice(-1)));
    if (!arr.every(skinnyRank_1.validateShort)) {
        throw new Error('invalid');
    }
    return arr;
}
;
function pocketsAndBoard(pockets, board) {
    return pockets.map(pocket => readablesToShorts(pocket.trim() + ' ' + board.trim()));
}
if (module === require.main) {
    (function () {
        return __awaiter(this, void 0, void 0, function* () {
            { // watching analysis
                console.log('\n# Audience views');
                console.log('## Game 1');
                yield deal_1.audiencePrintRealtime(readablesToShorts('9d 8h 10d 9s 4s'));
                console.log('## Game 2');
                yield deal_1.audiencePrintRealtime(readablesToShorts('Jh Kc Kd 5c 3c'));
            }
            console.log('\n# Using `boardAndPockets` for a game');
            yield deal_1.printRealtime(pocketsAndBoard('3h 4h, 6d 8h, 7s Js, 10s 6h, 6c Jd'.split(', '), 'Kc 8c 8d Qc As'));
            console.log('\n# Using `readablesToShorts` for several unrelated cards');
            yield deal_1.printRealtime([
                readablesToShorts('Kd 4c 4d 7h 9h 8h 6d'),
                readablesToShorts('5h 5c 8c 4h 4s Qh Ah'),
                readablesToShorts('Qc 10d 10s 7d 10h 2c Jd'),
                readablesToShorts('Jh 3s Js 8s 5d Qd 7c'),
            ]);
            {
                // Pockets, suited and unsuited
                const { shorts } = skinnyRank_1.initCards();
                let pockets = [];
                for (let first of shorts.slice(0, 13)) {
                    for (let second of shorts.slice(13, 26)) {
                        pockets.push([first, second]);
                    }
                }
                console.log(deal_1.markdownTable(yield deal_1.handsToTableCombine(pockets), [`Percents`].concat(deal_1.rankNames)));
                pockets = [];
                for (let pocket of comb_1.combinations(shorts.slice(0, 13), 2)) {
                    pockets.push(pocket);
                }
                console.log(deal_1.markdownTable(yield deal_1.handsToTableCombine(pockets), [`Percents`].concat(deal_1.rankNames)));
            }
        });
    })();
}
