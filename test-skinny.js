const test = require('tape');
const {readableToShort, validateShort, score} = require('./skinnyRank');

var parseRank = s => {
  let res = parseInt(s.replace('A', '1'));
  return isNaN(res) ? s : '' + (res - 1);
};
var ss = s => {
  const arr = s.trim().split(' ').map(s => readableToShort(parseRank(s.slice(0, -1)), s.slice(-1)));
  if (!arr.every(validateShort)) { throw new Error('invalid'); }
  return arr.sort().join('');
};

const rf = 1, sf = 2, quad = 3, fh = 4, fl = 5, str = 6, trip = 7, twop = 8, pair = 9, hic = 10;
test('royal flush', t => {
  const mk = (output) => ({score: rf, output});
  const scoreOnly = o => score(o).score;
  t.notEqual(scoreOnly(ss('3c 4c 5c 6c 7c')), rf);
  t.notEqual(scoreOnly(ss('Ac 2c 3c 4c 5c')), rf);
  t.notEqual(scoreOnly(ss('Ks Ac 2c 3c 4c 5c')), rf);
  t.notEqual(scoreOnly(ss('Ac 2c 3c 4c 5c 7s')), rf);
  t.notEqual(scoreOnly(ss('Ks Ac 2c 3c 4c 5c 7s')), rf);

  t.deepEqual(score(ss('10s Js Qs Ks As')), mk([1]));
  t.deepEqual(score(ss('10d Jd Qd Kd Ad')), mk([1]));
  t.deepEqual(score(ss('10c Jc Qc Kc Ac')), mk([1]));
  t.deepEqual(score(ss('10h Jh Qh Kh Ah')), mk([1]));

  t.deepEqual(score(ss('3s 10s Js Qs Ks As')), mk([1]), 'padding on the left');
  t.deepEqual(score(ss('10s Js Qs Ks As 3s')), mk([1]), 'padding on the right');
  t.deepEqual(score(ss('9d 10s Js Qs Ks As 3s')), mk([1]), 'padding on both sides');
  t.deepEqual(score(ss('10c Jc Qc Kc Ac 10d Jd Qd Kd Ad')), mk([1]), 'two royal flushes');

  t.end();
});

test('bestStraightFlush', t => {
  const mk = (output) => ({score: sf, output});

  t.deepEqual(score(ss('3c 4c 5c 6c 7c')), mk([7]));
  t.deepEqual(score(ss('Ac 2c 3c 4c 5c')), mk([5]), 'aces low');
  t.deepEqual(score(ss('Ks Ac 2c 3c 4c 5c')), mk([5]), 'works with padding on left');
  t.deepEqual(score(ss('Ac 2c 3c 4c 5c 7s')), mk([5]), 'works with padding on right');
  t.deepEqual(score(ss('Ks Ac 2c 3c 4c 5c 7s')), mk([5]), 'works with padding on either side');
  t.end();
});

test('4 of a kind', t => {
  const mk = (output) => ({score: quad, output});

  t.deepEqual(score(ss('3c 3d 3h 3s')), mk([3, 0]));
  t.deepEqual(score(ss('3s 3h 3d 3c')), mk([3, 0]), 'shuffle does not matter');
  t.deepEqual(score(ss('3h 3c 3d 3s')), mk([3, 0]), 'shuffle really does not matter');
  t.deepEqual(score(ss('3h 3c 3d 3s 4h 4c 4d 4s')), mk([4, 3]), 'get highest');
  t.deepEqual(score(ss('3h 3c 3d 3s 4h 4c 4d 4s Ah Ac Ad As')), mk([14, 4]), 'aces high');
  t.end();
});

test('3 of a kind', t => {
  const mk = (output) => ({score: trip, output});
  t.deepEqual(score(ss('3c 3d 3s')), mk([3, 0, 0]), '3 doesn\'t cut it');

  t.deepEqual(score(ss('Ac Ah Ad 7c')), mk([14, 7]), 'aces high');
  t.deepEqual(score(ss('Kc Kh Kd 7c')), mk([13, 7]));
  t.deepEqual(score(ss('Ac Ah Ad 7c 2s')), mk([14, 7, 2]), 'aces high');
  t.deepEqual(score(ss('Kc Kh Kd 7c 2s')), mk([13, 7, 2]));
  t.end();
});

test('full house', t => {
  const mk = (output) => ({score: fh, output});
  t.deepEqual(score(ss('Kc Kh Kd 7s 7c')), mk([13, 7]));
  t.deepEqual(score(ss('Kc Kh Kd 7s 7c 7c')), mk([13, 7]), 'two trips ok');
  t.deepEqual(score(ss('2c 2h 2d 7s 7c 7d')), mk([7, 2]), 'low quad and high trips means trip');
  t.deepEqual(score(ss('2c 2h 2d 7s 7c')), mk([2, 7]), 'low quad and high pairs means low');
  t.deepEqual(score(ss('Kc Kh Kd 7s 7c Qs Qd Qh')), mk([13, 12]), 'do not ignore second trips higher than pairs');
  t.end();
});

// t.deepEqual(score(ss('Kc Kh 7s 7c')), mk([0, 0, 0]), 'not full house');
// t.deepEqual(score(ss('Kc 7s 7d 7h')), mk([7, 13, 0]), 'trip but no pair');
// t.deepEqual(score(ss('7s 7d 7h')), mk([7, 0, 0]), 'trip and nothing else');
// t.deepEqual(score(ss('7s 7d')), mk([0, 0, 0]), 'pair and nothing else');

// t.deepEqual(score(ss('3c 3d')), [0, 0], '2 doesn\'t cut it');
// t.deepEqual(score(ss('3c')), [0, 0], '1 doesn\'t cut it');

// t.deepEqual(score(ss('Kc Kh 7s 7c')), mk([0, 0]), 'not full house');
// t.deepEqual(score(ss('Kc 7s 7d 7h')), mk([0, 0]), 'trip but no pair');
// t.deepEqual(score(ss('7s 7d 7h')), mk([0, 0]), 'trip and nothing else');
// t.deepEqual(score(ss('7s 7d')), mk([0, 0]), 'pair and nothing else');

// test('best pair', t => {
//   t.deepEqual(bestPair(ss('Kc Kh Kd 7s 7c')), [13, 7, 7, 0]);
//   t.deepEqual(bestPair(ss('Kc Kh Kd 7s 7c 7c')), [13, 7, 7, 7], 'two trips ok, returns at most 4');
//   t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 7, 7, 7], 'quads and trips ok');
//   t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 7, 7, 7], 'quads and quads ok');
//   t.deepEqual(bestPair(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 7, 7, 2], 'quads quads high-pairs get pairs');
//   t.deepEqual(bestPair(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2, 2, 2], 'low quad and high trips means trip');
//   t.deepEqual(bestPair(ss('2c 2h 2d 2s 7s 7c')), [7, 2, 2, 2], 'low quad and high pairs means low');
//   t.deepEqual(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [7, 4, 4, 4], 'many quads and high pair');
//   t.deepEqual(bestPair(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6, 6, 4], 'quads can be
//   ignored'); t.deepEqual(bestPair(ss('Kc Kh 7s 7c')), [13, 7, 7, 0], 'not full house'); t.deepEqual(bestPair(ss('Kc
//   7s 7d 7h')), [7, 13, 0, 0], 'trip but no pair'); t.deepEqual(bestPair(ss('7s 7d 7h')), [7, 0, 0, 0], 'trip and
//   nothing else'); t.deepEqual(bestPair(ss('7s 7d')), [7, 0, 0, 0], 'pair and nothing else');
//   t.deepEqual(bestPair(ss('7s')), [0, 0, 0, 0], 'single');
//   t.deepEqual(bestPair(ss('7s 8s 9s 10s')), [0, 0, 0, 0], 'no pair => 4 zeros');
//   t.deepEqual(bestPair(ss('7s 8s 9s 10s Js Qs Ks')), [0, 0, 0, 0], 'tons of no pair still has 4 zeros');
//   t.deepEqual(bestPair(ss('Ac Ah Ad 7s 7c')), [14, 7, 7, 0], 'aces high');
//   t.end();
// });
