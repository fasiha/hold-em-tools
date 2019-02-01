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
const fs_1 = require("fs");
const pify_1 = __importDefault(require("pify"));
const comb_1 = require("./comb");
const skinnyRank_1 = require("./skinnyRank");
const utils_1 = require("./utils");
let appendFile = pify_1.default(fs_1.appendFile);
const { shorts } = skinnyRank_1.initCards();
function searchBufBigN(buf, r, npocket, verbose = false) {
    let char2num = new Map();
    for (let [i, c] of utils_1.enumerate(shorts)) {
        char2num.set(c, i);
    }
    let str2nums = Array.from(Array(shorts.length), _ => new Map());
    let totalCombinations = 0;
    for (let pocket of comb_1.combinations(shorts, npocket)) {
        str2nums[(char2num.get(pocket[0]) || 0)].set(pocket.join(''), totalCombinations);
        if ((++totalCombinations) % 1e5 === 0 && verbose) {
            process.stdout.write((totalCombinations / 1e6).toString() + ' ');
        }
    }
    let hugeOccurBuffer = new Uint32Array(totalCombinations * 10);
    const buflen = buf.length;
    for (let n = 0, i = 0; n < buflen; n += (r + 1), ++i) {
        if (verbose && i % 1e5 === 0) {
            console.log(i / 1e6);
        }
        const hand = buf.subarray(n, n + r).toString().split('');
        const rankIdx = buf[n + r] - 1;
        for (let pocket of comb_1.combinations(hand, npocket)) {
            const idx = str2nums[char2num.get(pocket[0]) || 0].get(pocket.join('')) || 0;
            hugeOccurBuffer[rankIdx + idx]++;
        }
    }
    return bigNToStrNumArr(hugeOccurBuffer, npocket);
}
function* bigNToStrNumArr(occurBuf, npocket) {
    let i = 0;
    for (let pocket of comb_1.combinations(shorts, npocket)) {
        yield [pocket.join(''), Array.from(occurBuf.slice(i, i + 10))];
        i += 10;
    }
}
if (require.main === module) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const r = 7;
        let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
        {
            let occurrences = Array.from(Array(10 + 1), _ => 0);
            for (let n = r; n < buf.length; n += (r + 1)) {
                occurrences[buf[n]]++;
            }
            console.log(occurrences.map((n, i) => [n, i]));
        }
        let args = process.argv.slice(2).map(parseInt);
        for (let npocket of args) {
            const fname = `map-r-${r}-n-${npocket}-search3.ldjson`;
            fs_1.writeFileSync(fname, "");
            let strings = [];
            for (let kv of searchBufBigN(buf, r, npocket, true)) {
                if (strings.length === 1000) {
                    yield appendFile(fname, strings.join('\n') + '\n');
                    strings = [];
                }
                strings.push(JSON.stringify(kv));
            }
            yield appendFile(fname, strings.join('\n'));
        }
    }))();
}
