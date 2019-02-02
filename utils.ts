/**
 * Does an input string have any kanji? Applies XRegExp's '\Han' Unicode block test.
 * @param s string to test
 * See https://stackoverflow.com/questions/7344871/javascript-regular-expression-to-catch-kanji#comment91884309_7351856
 */
export function hasKanji(s: string): boolean {
  const k =
      /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9]/;
  return k.test(s);
}

/**
 * Flatten once.
 * @param arr array of arrays
 */
export function flatten<T>(arr: T[][]): T[] { return arr.reduce((memo, curr) => memo.concat(curr), []); }

/**
 * Generates `[index, value]` 2-tuples, so you can `for (let [index, value] of enumerate(v) {...})`.
 * @param v array or iterable iterator to enumerate
 * @param n starting number (defaults to 0)
 *
 * Hat tip: https://docs.python.org/3/library/functions.html#enumerate
 */
export function* enumerate<T>(v: T[]|IterableIterator<T>, n: number = 0): IterableIterator<[number, T]> {
  for (let x of v) { yield [n++, x]; }
}

/**
 * Generates tuples slicing across each of the input arrays, like Python's zip.
 * @param arrs arrays to zip over
 *
 * Outputs only as many times as the *shortest* input array.
 * Example:
 * `for (let [num, let] of zip([1, 2, 3], ['one', 'two', 'three', 'four'])) { console.log(num, let); }` produces the
 * following:
 * - `[1, 'one']`
 * - `[2, 'two']`
 * - `[3, 'three']`
 *
 * Hat tip: https://docs.python.org/3/library/functions.html#zip
 */
export function* zip(...arrs: any[][]) {
  const stop = Math.min(...arrs.map(v => v.length));
  for (let i = 0; i < stop; i++) { yield arrs.map(v => v[i]); }
}

/**
 * Apply a predicate to an array from its end, returning the continguously-passing sub-array.
 * @param arr Array to filter from the right (end)
 * @param predicate Function to apply to each element, defaults to boolean check
 *
 * See alo `filterLeft`.
 */
export function filterRight<T>(arr: T[], predicate: (element: T) => boolean = (element) => !!element): T[] {
  let ret: T[] = [];
  if (arr.length === 0) { return ret; }
  for (let idx = arr.length - 1; idx >= 0; idx--) {
    if (predicate(arr[idx])) {
      ret.push(arr[idx]);
    } else {
      break;
    }
  }
  return ret.reverse();
}
/**
 * Get the leading elements of an array that pass a predicate function.
 * @param arr Array to filter from the beginning (left)
 * @param predicate Function to apply to each element, defaults to boolean check
 *
 * See also `filterRight`.
 */
export function filterLeft<T>(arr: T[], predicate: (element: T) => boolean = (element) => !!element): T[] {
  let ret: T[] = [];
  for (let x of arr) {
    if (predicate(x)) {
      ret.push(x);
    } else {
      break;
    }
  }
  return ret;
}

export function argmin<T>(arr: T[]|IterableIterator<T>, map: (element: T) => number,
                          status?: {min?: T, argmin?: number, minmapped?: number}): number {
  let smallestElement: T|undefined = undefined;
  let smallestMapped = Infinity;
  let smallestIdx = -1;
  for (const [i, x] of enumerate(arr)) {
    const mapped = map(x)
    if (mapped < smallestMapped) {
      smallestElement = x;
      smallestMapped = mapped;
      smallestIdx = i;
    }
  }
  if (status) {
    status.min = smallestElement;
    status.argmin = smallestIdx;
    status.minmapped = smallestMapped;
  }
  return smallestIdx;
}

export function fillHoles<T>(a: T[], b: T[], predicate: (a: T) => boolean = (o => !o)) {
  let bidx = 0;
  for (let aidx in a) {
    if (predicate(a[aidx])) { a[aidx] = b[bidx++]; }
  }
  return a;
}

export function setEq<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) { return false; }
  return isSuperset(a, b);
}

// From
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations
export function isSuperset<T>(set: Set<T>, subset: Set<T>) {
  for (var elem of subset) {
    if (!set.has(elem)) { return false; }
  }
  return true;
}

export function union<T>(setA: Set<T>, setB: Set<T>) {
  var _union = new Set(setA);
  for (var elem of setB) { _union.add(elem); }
  return _union;
}

export function intersection<T>(setA: Set<T>, setB: Set<T>) {
  var _intersection = new Set();
  for (var elem of setB) {
    if (setA.has(elem)) { _intersection.add(elem); }
  }
  return _intersection;
}

export function difference<T>(setA: Set<T>, setB: Set<T>) {
  var _difference = new Set(setA);
  for (var elem of setB) { _difference.delete(elem); }
  return _difference;
}

export function reservoirSample<T>(list: IterableIterator<T>|T[], N: number): T[] {
  let ret: T[] = [];
  for (let [idx, elem] of enumerate(list)) {
    if (idx < N) {
      ret.push(elem);
    } else {
      const r = Math.floor(Math.random() * (idx + 1));
      if (r < N) { ret[r] = elem; }
    }
  }
  return ret;
}
export function groupBy<T, U>(list: T[]|IterableIterator<T>, f: (x: T) => U): Map<U, T[]> {
  let ret: Map<U, T[]> = new Map([]);
  for (let x of list) {
    const y = f(x);
    ret.set(y, (ret.get(y) || []).concat(x));
  }
  return ret;
}

/**
 * Evaluates the number of combinations, i.e., how many ways can you choose `r` items for `n`.
 *
 * Returns `n! / (r! (n-r)!)`. Evaluates this without using factorials, using only a few arithmetic operations.
 *
 * @param n total number of items available
 * @param r number of items one can choose
 */
export function ncr(n: number, r: number): number {
  let ret = 1;
  for (let i = 0; i < r; i++) { ret *= (n - i) / (1 + i); }
  return ret;
}

export function sum(arr: number[]): number { return arr.reduce((o, n) => o + n); }