import fetch from 'node-fetch';

var shuffle = require('knuth-shuffle-seeded');
import {shortToReadable, shortToNumberAcesHigh, fastScore, compareHands, initCards} from './skinnyRank';
import {sum, enumerate} from './utils';
const {shorts} = initCards();

const rankNames = 'rf,sf,qu,fh,fl,st,tr,2p,pa,hi'.split(',');
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
  if (n < .01) { return '<1'; }
  return Math.round(n * 100).toString();
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

function makeheader(text: string, level: number = 3): string { return `\n${'#'.repeat(level)} ${text}`; }

async function handsToTable(hands: string[][], excludes: string[][] = []) {
  if (excludes.length > 0 && excludes.length !== hands.length) { throw new Error('need as many exclusions as hands'); }
  let table: string[][] = [];
  for (const [idx, hand] of enumerate(hands)) {
    const sortedHand = hand.slice().sort().join('');
    let ex = excludes[idx] ? excludes[idx].join('') : '';
    let arr = await handToFrequencyExclusion(sortedHand, ex);
    let tot = sum(arr);
    let sub = hand.join('');
    table.push([
      string2readable(sub) + (ex ? ` (minus: ${string2readable(ex)})` : '') +
      ` (${score2string.get(fastScore(sortedHand))})`
    ].concat(arr.map(n => fmt(n / tot))));
  }
  return table;
}
async function handsToTableCombine(hands: string[][]) {
  let table: string[][] = [];
  const normalize = (arr: number[]) => {
    const tot = sum(arr);
    return arr.map(n => n / tot);
  };
  for (const hand of hands) {
    const shand = hand.slice().sort().join('');
    if (hand.length > 3) {
      let arrMine = normalize(await handToFrequencyExclusion(shand));
      let pocket = hand.slice(0, 2).join('');
      let board = hand.slice(2).join('');
      let arrOthers = normalize(await handToFrequencyExclusion(board, pocket));
      let numbers = arrMine.map((mine, i) => fmt(mine) + `÷${fmt(arrOthers[i])}`);
      let row = [
        (string2readable(pocket) + '+' + string2readable(board)) + ' /' + score2string.get(fastScore(shand)), ...numbers
      ];
      table.push(row);
    } else {
      let arrMine = normalize(await handToFrequencyExclusion(hand.join('')));
      let numbers = arrMine.map(fmt);
      let row = [string2readable(shand) + ' /' + score2string.get(fastScore(shand)), ...numbers];
      table.push(row);
    }
  }
  return table;
}

async function handToFrequency(hand: string) {
  let res = await fetch('http://localhost:3000/?hand=' + hand);
  if (!res.ok) { throw new Error('HTTP error ' + res.status + ' for: ' + hand); }
  let [_, arr]: [string, number[]] = await res.json();
  return arr;
}

async function handToFrequencyExclusion(hand: string, exclude: string = '') {
  const sorter = (s: string) => s.split('').sort().join('');
  if (!exclude) { return handToFrequency(sorter(hand)); }
  if (exclude.length !== 2) { throw new Error('exclusion length != 2 unimplemented'); }

  const vsum = (a: number[], b: number[]) => a.map((a, i) => a + b[i]);
  const vsub = (a: number[], b: number[]) => a.map((a, i) => a - b[i]);

  let handHits = await handToFrequency(sorter(hand))
  let handEx0Hits = await handToFrequency(sorter(hand + exclude[0]));
  let handEx1Hits = await handToFrequency(sorter(hand + exclude[1]));
  let handEx12Hits: number[] = Array.from(Array(10), _ => 0);
  if (hand.length < 5) { handEx12Hits = await handToFrequency(sorter(hand + exclude)); }
  return vsub(vsum(handHits, handEx12Hits), vsum(handEx1Hits, handEx0Hits));
}

async function printRealtime(cards: string[][]) {
  // print each pocket & rating
  // then print pockets+flop, and flop
  // then pockets+flop+turn, and flop+turn
  // etc. with the river

  let n = 2;
  console.log(
      markdownTable(await handsToTableCombine(cards.map(hand => hand.slice(0, 2))), ['Pockets %s'].concat(rankNames)));

  n = 5;
  console.log(makeheader('Pockets + flop', 4));
  console.log(
      markdownTable(await handsToTableCombine(cards.map(hand => hand.slice(0, n))), ['Pocket+flop'].concat(rankNames)));

  n = 6;
  console.log(makeheader('Pockets + flop + turn'));
  console.log(markdownTable(await handsToTableCombine(cards.map(hand => hand.slice(0, n))),
                            ['Pocket+flop+turn %s'].concat(rankNames)));

  let objects = cards.map((v, pid) => {
    const initial = v.slice();
    const hand = v.slice().sort().join('');
    const scoren = fastScore(hand);
    const score = score2string.get(scoren);
    return {pid, hand, scoren, score, initial};
  });
  objects.sort((a, b) => compareHands(a.hand, b.hand));
  console.log(makeheader('Final'))
  console.log(markdownTable(await handsToTable([cards[0].slice(2)]), ['Final board %s'].concat(rankNames)));
  n = 7;
  console.log(makeheader('Board minus each player\'s pocket ≈%s', 4));
  console.log(
      markdownTable(await handsToTable(cards.map(hand => hand.slice(2, n)), cards.map(hand => hand.slice(0, 2))),
                    ['Board-pocket'].concat(rankNames)));

  console.log(objects
                  .map((o, i) => `${i + 1}. Player ${o.pid + 1} :: ${
                           string2readable(o.initial.slice(0, 2).sort().join(
                               ''))} | ${string2readable(o.initial.slice(2).join(''))} => ${o.score}`)
                  .join('\n'));
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

    // await printResult(cards);
    printRealtime(cards);
  })();
}
