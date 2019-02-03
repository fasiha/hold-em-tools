# hold-em-tools

## Installation
Ensure you have both [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) installed. Then run the following set of commands in your command-line prompt  (i.e., Terminal in macOS, xterm in Linux, Command Prompt in Windows, etc.), noting that the `$` symbol just indicates the start of the prompt and is not intended to be typed.
```
$ git clone https://github.com/fasiha/hold-em-tools.git
$ cd hold-em-tools
$ npm install
$ npm run build
```
The `git` command comes from the eponymous program you have installed, while `npm` was installed by Node.js.

## Run
```
$ node skinnyRank.js 7
$ node histogramBinfile.js --max-old-space-size=4096 2 3 4 5 6
$ node server.js
$ node deal.js 0 # run this in another tab
```
This will:
1. first generate a 1.1 GB file, `handsScore-7.bin`, containing all 134 million seven-card hands as well as the best ranking (one through ten, one for royal flush, ten for high card)—so eight bytes time 133784560 divided by 1024 bytes per kilobyte, and divided by 1024 kilobytes per megabyte yields 1020 megabytes.
2. Then generate five files, named `map-r-7-n-2.ldjson`, `map-r-7-n-3.ldjson`, and so on through `map-r-7-n-6.ldjson`, i.e., the "n" number goes from 2 to 6. These line-delimited JSON files (where each line is valid JSON) contains each "n"-card hand for "n" running from 2 to 6 (inclusive), and the total number of royal flushes, straight flushes, etc., that can be made with those "n" cards out of the universe of seven-card hands. The "n" = 2 file contains 52-choose-2, or 1326, rows. The "n" = 6 file contains 52-choose-6, or more than twenty million, rows.
1. Because of some [internal limitations](https://stackoverflow.com/q/54452896/500207) in Node.js, it's necessary to use a secondary database mapping each 2- to 6-card hand to the frequency table of how often each card is part of a royal flush, straight flush, etc. (for all ten rankings of poker hands). This step puts all that information inside Leveldb and serves this data as a webserver.
1. Finally, **in another terminal**, the last script will deal four players seven cards, rank them best to worst, and show you some histogram analysis of each hand.

N.B. If you run `$ node deal.js 0` several times, you'll see the exact same deal. If you want to shuffle and redeal, change the `0` to another number: this number is the random seed.

Currently, the final printout of the program results in the following Markdown, letting me analyze the probabilities of each final ranking for each player at each stage of the game, while also evaluating each of the *other* players' probabilities by excluding each players' own pocket cards:

### Pockets
| Pockets %s | rf | sf | qu | fh | fl | st | tr | 2p | pa | hi |
| ---------- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
|  2c 6s /hi | <1 | <1 | <1 |  2 |  2 |  4 |  4 | 23 | 45 | 19 |
|  5c Qc /hi | <1 | <1 | <1 |  2 |  7 |  3 |  4 | 22 | 43 | 18 |
|  4h 5h /hi | <1 | <1 | <1 |  2 |  6 |  9 |  4 | 22 | 41 | 16 |
|  Kd 3h /hi | <1 | <1 | <1 |  2 |  2 |  2 |  4 | 23 | 46 | 20 |

### Pockets + flop:  Qh 7c Js
| 5cards %s            |   rf |   sf |    qu |  fh |   fl |  st |  tr |    2p |    pa |    hi |
| -------------------- | ---- | ---- | ----- | --- | ---- | --- | --- | ----- | ----- | ----- |
|  2c 6s× Qh 7c Js /hi | 0×<1 | 0×<1 |  0×<1 | 0×2 | 0×<1 | 0×4 | 1×4 |  8×21 | 49×47 | 41×21 |
|  5c Qc× Qh 7c Js /pa | 0×<1 | 0×<1 | <1×<1 | 2×1 | 4×<1 | 0×4 | 7×3 | 37×19 | 50×48 |  0×24 |
|  4h 5h× Qh 7c Js /hi | 0×<1 | 0×<1 |  0×<1 | 0×2 | 4×<1 | 3×4 | 1×4 |  8×21 | 47×47 | 36×21 |
|  Kd 3h× Qh 7c Js /hi | 0×<1 | 0×<1 |  0×<1 | 0×2 | 0×<1 | 3×4 | 1×4 |  8×21 | 49×47 | 38×22 |

### Pockets + flop + turn:  Qh 7c Js 4c
| 6cards %s               |  rf |   sf |   qu |   fh |    fl |  st |  tr |    2p |    pa |    hi |
| ----------------------- | --- | ---- | ---- | ---- | ----- | --- | --- | ----- | ----- | ----- |
|  2c 6s× Qh 7c Js 4c /hi | 0×0 | 0×<1 | 0×<1 | 0×<1 |  0×<1 | 0×2 | 0×3 |  0×17 | 39×50 | 61×27 |
|  5c Qc× Qh 7c Js 4c /pa | 0×0 |  0×0 | 0×<1 | 0×<1 | 20×<1 | 0×2 | 4×3 | 24×15 | 52×50 |  0×30 |
|  4h 5h× Qh 7c Js 4c /pa | 0×0 | 0×<1 | 0×<1 | 0×<1 |   0×1 | 0×2 | 4×3 | 26×15 | 70×49 |  0×30 |
|  Kd 3h× Qh 7c Js 4c /hi | 0×0 | 0×<1 | 0×<1 | 0×<1 |   0×1 | 0×2 | 0×3 |  0×17 | 39×50 | 61×27 |

### Flop + turn + river:  Qh 7c Js 4c 3d
| 7cards ≈%s                 | rf | sf | qu | fh | fl | st | tr | 2p |  pa |  hi |
| -------------------------- | -- | -- | -- | -- | -- | -- | -- | -- | --- | --- |
|  2c 6s× Qh 7c Js 4c 3d /hi | ×0 | ×0 | ×0 | ×0 | ×0 | ×1 | ×2 | ×9 | ×50 | ×38 |
|  5c Qc× Qh 7c Js 4c 3d /pa | ×0 | ×0 | ×0 | ×0 | ×0 | ×1 | ×1 | ×8 | ×48 | ×41 |
|  4h 5h× Qh 7c Js 4c 3d /pa | ×0 | ×0 | ×0 | ×0 | ×0 | ×1 | ×1 | ×8 | ×48 | ×41 |
|  Kd 3h× Qh 7c Js 4c 3d /pa | ×0 | ×0 | ×0 | ×0 | ×0 | ×2 | ×1 | ×8 | ×48 | ×41 |
1. Player 2 ::  5c Qc |  Qh 7c Js 4c 3d => pa
2. Player 3 ::  4h 5h |  Qh 7c Js 4c 3d => pa
3. Player 4 ::  Kd 3h |  Qh 7c Js 4c 3d => pa
4. Player 1 ::  2c 6s |  Qh 7c Js 4c 3d => hi
