"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const leveldown_1 = __importDefault(require("leveldown"));
const levelup_1 = __importDefault(require("levelup"));
var Linerstream = require('linerstream');
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const port = 3000;
function initdb() {
    return __awaiter(this, void 0, void 0, function* () {
        var e_1, _a;
        let db = levelup_1.default(leveldown_1.default('./hands'));
        try {
            let check = yield Promise.all('uvwxyz,vwxyz,wxyz,xyz,yz'.split(',').map(s => db.get(s)));
            if (check.every(b => b.length > 0)) {
                return db;
            }
        }
        catch (e) { }
        console.log('Initializing database, please wait');
        let nrows = 0;
        let maxbatch = 10000;
        let batch = [];
        for (let n = 2; n <= 6; n++) {
            const fname = `map-r-7-n-${n}.ldjson`;
            console.log(fname);
            if (fs_1.existsSync(fname)) {
                let readStream = fs_1.createReadStream(`map-r-7-n-${n}.ldjson`, 'utf8');
                let lineByLineStream = readStream.pipe(new Linerstream());
                try {
                    for (var lineByLineStream_1 = __asyncValues(lineByLineStream), lineByLineStream_1_1; lineByLineStream_1_1 = yield lineByLineStream_1.next(), !lineByLineStream_1_1.done;) {
                        const line = lineByLineStream_1_1.value;
                        const str = line.substr(2, n);
                        batch.push({ type: 'put', key: str, value: line });
                        if (batch.length >= maxbatch) {
                            yield db.batch(batch);
                            batch = [];
                        }
                        nrows++;
                        if (nrows % 1e5 === 0) {
                            console.log(nrows / 1e6, str);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (lineByLineStream_1_1 && !lineByLineStream_1_1.done && (_a = lineByLineStream_1.return)) yield _a.call(lineByLineStream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        }
        yield db.batch(batch);
        return db;
    });
}
if (require.main === module) {
    (() => __awaiter(this, void 0, void 0, function* () {
        let db = yield initdb();
        app.get('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
            if ('hand' in req.query) {
                try {
                    const hit = yield db.get(req.query.hand);
                    res.json(hit.toString());
                }
                catch (e) {
                    res.status(404).end();
                }
            }
            else {
                res.status(400).end();
            }
        }));
        app.listen(port, () => console.log(`Server started. Try $ curl "localhost:${port}/?hand=abc"`));
    }))();
}
