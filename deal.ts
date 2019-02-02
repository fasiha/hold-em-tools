import fetch from 'node-fetch';

var shuffle = require('knuth-shuffle-seeded');
import {shortToReadable, shortToNumberAcesHigh, fastScore, compareHands, initCards} from './skinnyRank';
import {sum} from './utils';
const {shorts} = initCards();

const rankNames = 'roya,strf,quad,fuho,flus,str8,trip,twop,pair,hica'.split(',');
const score2string: Map<number, string> = new Map(rankNames.map((s, i) => [i + 1, s] as [number, string]));
function sortShorts(hand: string[], ascending: boolean = true): string[] {
  return hand.sort((a, b) => (ascending ? 1 : -1) * (shortToNumberAcesHigh(a) - shortToNumberAcesHigh(b)));
}
function string2readable(hand: string, sort: boolean = false, ascending: boolean = true): string {
  let a = hand.split('');
  if (sort) { sortShorts(a, ascending); }
  return a.map(shortToReadable).join('');
}
function fmt(n: number): string {
  if (n === 0) { return '0'; }
  if (n < .01) { return (n * 100).toExponential(0); }
  return (n * 100).toFixed(1);
}
function pad(str: string, desiredLen: number, padChar: string = ' ', left: boolean = true) {
  return (left ? '' : str) + padChar.repeat(Math.max(0, desiredLen - str.length)) + (left ? str : '');
}
function markdownTable(arr: string[][], header: string[] = []): string {
  let cols = arr[0].length;
  if (header.length) { arr = [header].concat(arr); }
  let widths = Array.from(Array(cols), (_, n) => n).map(col => Math.max(...arr.map(v => v[col].length)));
  if (header.length) { arr.splice(1, 0, header.map((_, col) => '-'.repeat(widths[col]))); }
  return arr.map(row => '| ' + row.map((elt, colidx) => pad(elt, widths[colidx], ' ', colidx !== 0)).join(' | ') + ' |')
      .join('\n');
}
if (module === require.main) {
  (async () => {
    let args = process.argv.slice(2);
    let seed = parseInt(args[0]) || 0;
    let players = parseInt(args[1]) || 4;
    let shuffled = shuffle(shorts.slice(), seed);
    let cards: string[][] = Array.from(Array(players), _ => []);
    for (let cid = 0; cid < 2; cid++) {
      for (let pid = 0; pid < players; pid++) { cards[pid].push(shuffled.pop()); }
    }
    for (let cid = 0; cid < 5; cid++) {
      const c = shuffled.pop();
      for (let pid = 0; pid < players; pid++) { cards[pid].push(c); }
    }

    let objects = cards.map((v, pid) => {
      const initial = sortShorts(v.slice(0, 2)).concat(v.slice(2));
      const hand = v.slice().sort().join('');
      return {pid, hand, initial};
    });
    objects.sort((a, b) => compareHands(a.hand, b.hand));
    for (const {pid, hand, initial} of objects) {
      const score = score2string.get(fastScore(hand));
      const readable =
          [string2readable(initial.slice(0, 2).join(''), true), string2readable(initial.slice(2).join(''), false)].join(
              ' | ');

      console.log(makeheader(`Seat ${pid + 1} :: ${readable} :: ${score}`));

      let cumulative = [initial.slice(0, 2), initial.slice(0, 5), initial.slice(0, 6)];
      let table: string[][] = await handsToTable(cumulative)
      console.log(markdownTable(table, ['hand'].concat(rankNames)));
    }
    // board: "audience" view
    {
      const board = cards[0].slice(2);
      let cumulative = [board.slice(0, 3), board.slice(0, 4), board.slice()];
      let table: string[][] = await handsToTable(cumulative)
      console.log(makeheader(`Board :: ${string2readable(board.join(''))}`));
      console.log(markdownTable(table, ['board'].concat(rankNames)));
    }
  })();
}

function makeheader(text: string): string { return `\n### ${text}`; }

async function handsToTable(hands: string[][]) {
  let table: string[][] = [];
  for (const subhand of hands) {
    const sortedHand = subhand.slice().sort().join('');
    try {
      let [_, arr]: [string, number[]] = await (fetch('http://localhost:3000/?hand=' + sortedHand).then(x => x.json()));
      let tot = sum(arr);
      let sub = subhand.join('');
      table.push(
          [string2readable(sub) + ` (${score2string.get(fastScore(sortedHand))})`].concat(arr.map(n => fmt(n / tot))));
    } catch (e) {}
  }
  return table;
}