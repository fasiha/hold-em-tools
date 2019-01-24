const test = require('tape');
const {readableToShort, validateShort, isRoyalFlush, bestStraightFlush, best4OfAKind, best3OfAKind} =
    require('./skinnyRank');

var parseRank = s => {
  let res = parseInt(s.replace('A', '1'));
  return isNaN(res) ? s : '' + (res - 1);
};
var ss = s => {
  const arr = s.trim().split(' ').map(s => readableToShort(parseRank(s.slice(0, -1)), s.slice(-1)));
  if (!arr.every(validateShort)) { throw new Error('invalid'); }
  return arr.sort().join('');
};

test('royal flush', t => {
  t.equal(isRoyalFlush(ss('3c 4c 5c 6c 7c')), 0);
  t.equal(isRoyalFlush(ss('Ac 2c 3c 4c 5c')), 0);
  t.equal(isRoyalFlush(ss('Ks Ac 2c 3c 4c 5c')), 0);
  t.equal(isRoyalFlush(ss('Ac 2c 3c 4c 5c 7s')), 0);
  t.equal(isRoyalFlush(ss('Ks Ac 2c 3c 4c 5c 7s')), 0);

  t.equal(isRoyalFlush(ss('10s Js Qs Ks As')), 1);
  t.equal(isRoyalFlush(ss('10d Jd Qd Kd Ad')), 1);
  t.equal(isRoyalFlush(ss('10c Jc Qc Kc Ac')), 1);
  t.equal(isRoyalFlush(ss('10h Jh Qh Kh Ah')), 1);

  t.equal(isRoyalFlush(ss('3s 10s Js Qs Ks As')), 1, 'padding on the left');
  t.equal(isRoyalFlush(ss('10s Js Qs Ks As 3s')), 1, 'padding on the right');
  t.equal(isRoyalFlush(ss('9d 10s Js Qs Ks As 3s')), 1, 'padding on both sides');
  t.equal(isRoyalFlush(ss('10c Jc Qc Kc Ac 10d Jd Qd Kd Ad')), 1, 'two royal flushes');

  t.end();
});

test('bestStraightFlush', t => {
  t.equal(bestStraightFlush(ss('3c 4c 5c 6c 7c')), 7);
  t.equal(bestStraightFlush(ss('Ac 2c 3c 4c 5c')), 5, 'aces low');
  t.equal(bestStraightFlush(ss('Ks Ac 2c 3c 4c 5c')), 5, 'works with padding on left');
  t.equal(bestStraightFlush(ss('Ac 2c 3c 4c 5c 7s')), 5, 'works with padding on right');
  t.equal(bestStraightFlush(ss('Ks Ac 2c 3c 4c 5c 7s')), 5, 'works with padding on either side');
  t.end();
});

test('4 of a kind', t => {
  t.deepEqual(best4OfAKind(ss('3c 3d 3h 3s')), [3, 0]);
  t.deepEqual(best4OfAKind(ss('3s 3h 3d 3c')), [3, 0], 'shuffle does not matter');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s')), [3, 0], 'shuffle really does not matter');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s')), [4, 3], 'get highest');
  t.deepEqual(best4OfAKind(ss('3h 3c 3d 3s 4h 4c 4d 4s Ah Ac Ad As')), [14, 4], 'aces high');
  t.deepEqual(best4OfAKind(ss('3c 3d 3s')), [0, 0], '3 doesn\'t cut it');
  t.deepEqual(best4OfAKind(ss('3c 3d')), [0, 0], '2 doesn\'t cut it');
  t.deepEqual(best4OfAKind(ss('3c')), [0, 0], '1 doesn\'t cut it');
  t.end();
});

test('3 of a kind', t => {
  // t.deepEqual(best3OfAKind(ss('Ac Ah Ad 7s 7c')), [14, 7, 7], 'aces high');
  // t.deepEqual(best3OfAKind(ss('Kc Kh Kd 7s 7c')), [13, 7, 7]);
  // t.deepEqual(best3OfAKind(ss('Kc Kh Kd 7s 7c 7c')), [13, 7, 7], 'two trips ok');
  // t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d')), [13, 13, 7], 'quads and trips ok');
  // t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7c 7d 7h')), [13, 13, 7], 'quads and quads ok');
  // t.deepEqual(best3OfAKind(ss('Kc Kh Kd Ks 7s 7d 2s 2c 2d 2h')), [13, 13, 7], 'quads quads high-pairs get pairs');
  // t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 7s 7c 7d')), [7, 2, 2], 'low quad and high trips means trip');
  // t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 7s 7c')), [2, 7, 7], 'low quad and high pairs means low');
  // t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7s 7c')), [4, 7, 7], 'many quads and high pair');
  // t.deepEqual(best3OfAKind(ss('2c 2h 2d 2s 3s 3d 3h 3c 4s 4d 4h 4c 7c 7s 7h 6s 6d')), [7, 6, 6],
  //             'quads can be ignored');
  // t.deepEqual(best3OfAKind(ss('Kc Kh 7s 7c')), [0, 0, 0], 'not full house');
  // t.deepEqual(best3OfAKind(ss('Kc 7s 7d 7h')), [7, 13, 0], 'trip but no pair');
  // t.deepEqual(best3OfAKind(ss('7s 7d 7h')), [7, 0, 0], 'trip and nothing else');
  // t.deepEqual(best3OfAKind(ss('7s 7d')), [0, 0, 0], 'pair and nothing else');
  t.end();
});
