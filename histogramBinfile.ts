import {appendFile as appendFileCb, readFileSync, renameSync, writeFileSync} from 'fs';
import pify from 'pify';

import {combinations} from './comb';
import {initCards} from './skinnyRank'
import {enumerate} from './utils';

let appendFile = pify(appendFileCb);
const {shorts} = initCards();

function searchBufBigN(buf: Buffer, r: number, npocket: number, verbose: boolean = false) {
  let char2num: Map<string, number> = new Map();
  for (let [i, c] of enumerate(shorts)) { char2num.set(c, i); }
  let str2nums: Map<string, number>[] = shorts.map(_ => new Map());
  let totalCombinations = 0;
  for (let pocket of combinations(shorts, npocket)) {
    str2nums[(char2num.get(pocket[0]) || 0)].set(pocket.join(''), 10 * totalCombinations);
    if ((++totalCombinations) % 1e5 === 0 && verbose) {
      process.stdout.write((totalCombinations / 1e6).toString() + ' ');
    }
  }

  let hugeOccurBuffer = new Uint32Array(totalCombinations * 10);
  const buflen = buf.length;
  for (let n = 0, i = 0; n < buflen; n += (r + 1), ++i) {
    if (verbose && i % 1e5 === 0) { console.log(i / 1e6); }
    const hand = buf.subarray(n, n + r).toString().split('');
    const rankIdx = buf[n + r] - 1;
    for (let pocket of combinations(hand, npocket)) {
      const idx = str2nums[char2num.get(pocket[0]) || 0].get(pocket.join('')) || 0;
      hugeOccurBuffer[rankIdx + idx]++;
    }
  }
  return bigNToStrNumArr(hugeOccurBuffer, npocket);
}

function* bigNToStrNumArr(occurBuf: Uint32Array, npocket: number): IterableIterator<[string, number[]]> {
  let i = 0;
  for (let pocket of combinations(shorts, npocket)) {
    yield [pocket.join(''), Array.from(occurBuf.slice(i, i + 10))];
    i += 10;
  }
}

if (require.main === module) {
  (async () => {
    const r = 7;
    let buf = readFileSync('handsScore-' + r + '.bin');
    {
      let occurrences = Array.from(Array(10 + 1), _ => 0);
      for (let n = r; n < buf.length; n += (r + 1)) { occurrences[buf[n]]++; }
      console.log(occurrences.map((n, i) => [n, i]));
    }
    let args = process.argv.slice(2).map(n => parseInt(n));
    for (let npocket of args) {
      const fname = `map-r-${r}-n-${npocket}.ldjson`;
      const fnameTemp = fname + '_' + Math.random().toString(36).slice(2);
      writeFileSync(fnameTemp, "");

      let strings: string[] = [];
      for (let kv of searchBufBigN(buf, r, npocket, true)) {
        if (strings.length === 1000) {
          await appendFile(fnameTemp, strings.join('\n') + '\n');
          strings = [];
        }
        strings.push(JSON.stringify(kv));
      }
      await appendFile(fnameTemp, strings.join('\n'));
      renameSync(fnameTemp, fname);
    }
  })();
}
