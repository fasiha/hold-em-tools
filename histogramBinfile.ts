import {readFileSync} from 'fs';
if (require.main === module) {
  let buf = readFileSync('handsScore.bin');
  let occurrences = Array.from(Array(256), _ => 0);
  for (let n of buf) { occurrences[n]++; }
  console.log(occurrences.map((n, i) => [n, i]));
}