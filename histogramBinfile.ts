import {readFileSync, writeFileSync} from 'fs';

import {combinations} from './comb';
import {initCards} from './skinnyRank'

const {shorts} = initCards();

export function search(buf: Buffer, r: number, key: string): number[] {
  let occurrences = Array.from(Array(10 + 1), _ => 0);
  let keybuf = Buffer.from(key);
  const keylen = key.length;
  outer: for (let n = 0; n < buf.length; n += (r + 1)) {
    let hand = buf.subarray(n, n + r);
    let targetIdx = 0;
    if (hand[r - 2] < keybuf[0]) { continue; }
    for (let c of hand) {
      if (c > keybuf[targetIdx]) {
        continue outer;
      } else if (c === keybuf[targetIdx]) {
        if (++targetIdx === keylen) {
          occurrences[buf[n + r]]++;
          continue outer;
        }
      }
    }
  }
  return occurrences;
}

if (require.main === module) {
  const r = 5;
  let buf = readFileSync('handsScore-' + r + '.bin');
  let occurrences = Array.from(Array(10 + 1), _ => 0);
  for (let n = r; n < buf.length; n += (r + 1)) { occurrences[buf[n]]++; }
  console.log(occurrences.map((n, i) => [n, i]));

  let npocket = 2;
  let map: Map<string, number[]> = new Map();
  for (let hand of combinations(shorts, npocket)) {
    let thisOccur = search(buf, r, hand.join(''));
    map.set(hand.join(''), thisOccur);
    console.log(hand, thisOccur);
  }
  writeFileSync(`map-npocket${npocket}.json`, JSON.stringify(Array.from(map)));
  console.log(map);
}