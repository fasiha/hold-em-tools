import {readFileSync, writeFileSync} from 'fs';

import {combinations} from './comb';
import {initCards} from './skinnyRank'

const {shorts} = initCards();

function search(buf: Buffer, r: number, key: string): number[] {
  let occurrences = Array.from(Array(10 + 1), _ => 0);
  let keybuf = Buffer.from(key);
  for (let n = 0; n < buf.length; n += (r + 1)) {
    let hand = buf.subarray(n, n + r);
    let start = 0;
    for (let idx = 0; idx < keybuf.length && start >= 0; idx++) { start = hand.indexOf(keybuf[idx], start); }
    if (start >= 0) { occurrences[buf[n + r]]++; }
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
    map.set(hand.join(), search(buf, r, hand.join()));
    console.log(hand);
  }
  writeFileSync(`map-npocket${npocket}.json`, JSON.stringify(Array.from(map)));
  console.log(map);
}