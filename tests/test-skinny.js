const test = require('tape');
const {readableToShort, validateShort, score} = require('../skinnyRank');

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
  t.deepEqual(score(ss('Kc 7s 7d 7h')), mk([7, 13, 0]), 'trip but no pair');
  t.deepEqual(score(ss('Ac Ah Ad 7c')), mk([14, 7, 0]), 'aces high');
  t.deepEqual(score(ss('Kc Kh Kd 7c')), mk([13, 7, 0]));
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
  t.deepEqual(score(ss('Ac Ah Ad 7s 7c')), mk([14, 7]), 'aces high');
  t.end();
});

test('flush', t => {
  const mk = (output) => ({score: fl, output});
  t.deepEqual(score(ss('10c 9c 8c 7c 2c')), mk([10, 9, 8, 7, 2]));
  t.deepEqual(score(ss('10c 9c 8c 7c 2c Ah 8h 9h 5h')), mk([10, 9, 8, 7, 2]));
  t.deepEqual(score(ss('10c 9c 8c 7c Ah 8h 9h 5h 2h')), mk([14, 9, 8, 5, 2]), 'aces high');
  t.throws(() => score(ss('10c 9c 8c 7c 2c Ah 8h 9h 5h 4h')), 'do not know how to handle two flushes FIXME');
  t.end();
});

test('straight', t => {
  const mk = (output) => ({score: str, output});
  t.deepEqual(score(ss('10c 9d 8c 7s 6h')), mk([10]));
  t.deepEqual(score(ss('Ac 2d 3c 4s 5h')), mk([5]), 'aces low');
  t.deepEqual(score(ss('Ac 2d 3c 4s 5h 6s')), mk([6]), 'aces low with higher straight');
  t.deepEqual(score(ss('Ac 2d 3c 4s 5h 7s 8c 9h 10d Js')), mk([11]), 'aces low with higher disconnected straight');
  t.deepEqual(score(ss('Ac 2d 3c 4d 5c Ah Ks Qh Js 10h')), mk([14]), 'aces low and aces high');
  t.deepEqual(score(ss('Ac 10d Jc Ks Qh')), mk([14]), 'aces hi');
  t.deepEqual(score(ss('Ac 10d Jc Ks Qh Ad 10s Jh Kh Qs')), mk([14]), 'two straights, aces hi');
  t.end();
});

test('best two pairs', t => {
  const mk = (output) => ({score: twop, output});
  t.deepEqual(score(ss('Kc Kh 7s 7c')), mk([13, 7, 0]));
  t.deepEqual(score(ss('Kc Kh 9d 7c 7c')), mk([13, 7, 9]));
  t.deepEqual(score(ss('Kc Ks 7s 7d 2s 2h')), mk([13, 7, 2]));
  t.deepEqual(score(ss('2c 2h 3s 3d 4s 4d 7s 7c')), mk([7, 4, 3]));

  t.end();
});

test('pair', t => {
  const mk = (output) => ({score: pair, output});
  t.deepEqual(score(ss('Kc Kh 7c')), mk([13, 7, 0, 0]));
  t.deepEqual(score(ss('7s 7d')), mk([7, 0, 0, 0]), 'pair and nothing else');
  t.deepEqual(score(ss('Ac Ah 7c')), mk([14, 7, 0, 0]), 'aces high');
  t.end();
});

test('hi card', t => {
  const mk = (output) => ({score: hic, output});
  t.deepEqual(score(ss('Kc Qs 7c 2d 3h')), mk([13, 12, 7, 3, 2]));
  t.deepEqual(score(ss('Kc Qs 7c 5s 2d 3h')), mk([13, 12, 7, 5, 3]));
  t.deepEqual(score(ss('Kc Qs 7c')), mk([13, 12, 7, 0, 0]));
  t.deepEqual(score(ss('3c')), mk([3, 0, 0, 0, 0]), '1 doesn\'t cut it');
  t.end();
});
