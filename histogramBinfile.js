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
var bindAll = require('bind-all');
const { shorts } = skinnyRank_1.initCards();
function search(buf, r, key) {
    let occurrences = Array.from(Array(10 + 1), _ => 0);
    let keybuf = Buffer.from(key);
    const keylen = key.length;
    outer: for (let n = 0; n < buf.length; n += (r + 1)) {
        let hand = buf.subarray(n, n + r);
        let targetIdx = 0;
        if (hand[r - 2] < keybuf[0]) {
            continue;
        }
        for (let c of hand) {
            if (c > keybuf[targetIdx]) {
                continue outer;
            }
            else if (c === keybuf[targetIdx]) {
                if (++targetIdx === keylen) {
                    occurrences[buf[n + r]]++;
                    continue outer;
                }
            }
        }
    }
    return occurrences.slice(1);
}
exports.search = search;
const sqlite3_1 = __importDefault(require("sqlite3"));
if (require.main === module) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const npocket = 3;
        const r = 7;
        let buf = fs_1.readFileSync('handsScore-' + r + '.bin');
        {
            let occurrences = Array.from(Array(10 + 1), _ => 0);
            for (let n = r; n < buf.length; n += (r + 1)) {
                occurrences[buf[n]]++;
            }
            console.log(occurrences.map((n, i) => [n, i]));
        }
        let db = pify_1.default(bindAll(new sqlite3_1.default.Database(`holdem-r-${r}-n-${npocket}.sqlite`)));
        yield db.run(`CREATE TABLE IF NOT EXISTS holdem (
        seen TEXT UNIQUE NOT NULL,
        royalFlush NUMBER,
        straightFlush NUMBER,
        fourOak NUMBER,
        fullHouse NUMBER,
        flush NUMBER,
        straight NUMBER,
        threeOak NUMBER,
        twoPair NUMBER,
        pair NUMBER,
        high NUMBER
      )`);
        for (let hand of comb_1.combinations(shorts, npocket)) {
            let s = hand.join('');
            let dbhits = yield db.get(`SELECT COUNT(1) as hits FROM holdem WHERE seen = ?`, [s]);
            if ('hits' in dbhits && dbhits.hits > 0) {
                continue;
            }
            let thisOccur = search(buf, r, s);
            console.log(hand, thisOccur);
            yield db.run("INSERT INTO holdem VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [s, ...thisOccur]);
        }
        db.close();
    }))();
}
