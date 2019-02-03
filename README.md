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

| Pockets %s    | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  2c 6s (hica) | 2e-4 | 2e-2 | 1e-1 |  2.2 |  2.0 |  4.0 |  4.4 | 22.7 | 45.3 | 19.3 |
|  5c Qc (hica) | 2e-3 | 2e-2 | 1e-1 |  2.2 |  6.6 |  3.2 |  4.4 | 22.3 | 43.4 | 17.8 |
|  4h 5h (hica) | 2e-4 | 2e-1 | 1e-1 |  2.2 |  6.4 |  8.6 |  4.3 | 21.8 | 40.6 | 15.8 |
|  Kd 3h (hica) | 2e-3 | 1e-2 | 1e-1 |  2.2 |  2.0 |  2.3 |  4.5 | 22.8 | 46.1 | 20.0 |

### Pockets + flop
| Pockets+flop %s        | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ---------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  2c 6s Qh 7c Js (hica) |    0 |    0 |    0 |    0 |    0 |    0 |  1.4 |  8.3 | 48.8 | 41.4 |
|  5c Qc Qh 7c Js (pair) |    0 |    0 | 9e-2 |  2.5 |  4.2 |    0 |  6.7 | 36.6 | 50.0 |    0 |
|  4h 5h Qh 7c Js (hica) |    0 |    0 |    0 |    0 |  4.2 |  2.8 |  1.4 |  8.2 | 47.4 | 36.1 |
|  Kd 3h Qh 7c Js (hica) |    0 |    0 |    0 |    0 |    0 |  3.0 |  1.4 |  8.3 | 48.8 | 38.5 |

#### (Just flop)
| (Flop %s)        | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ---------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js (hica) | 9e-4 | 5e-3 | 7e-2 |  1.5 | 7e-1 |  3.8 |  3.7 | 20.3 | 47.4 | 22.4 |

#### Flop minus each player's pocket
| Flop-pocket %s                   | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| -------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js (minus:  2c 6s) (hica) | 1e-3 | 6e-3 | 8e-2 |  1.7 | 6e-1 |  4.2 |  3.9 | 21.2 | 47.0 | 21.3 |
|  Qh 7c Js (minus:  5c Qc) (hica) | 1e-3 | 4e-3 | 5e-2 |  1.2 | 7e-1 |  4.2 |  3.4 | 18.8 | 47.6 | 23.9 |
|  Qh 7c Js (minus:  4h 5h) (hica) | 1e-3 | 6e-3 | 8e-2 |  1.7 | 7e-1 |  4.2 |  3.9 | 21.2 | 47.0 | 21.3 |
|  Qh 7c Js (minus:  Kd 3h) (hica) | 1e-3 | 6e-3 | 8e-2 |  1.7 | 7e-1 |  3.7 |  3.9 | 21.2 | 47.2 | 21.5 |

### Pockets + flop + turn
| Pocket+flop+turn %s       | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  2c 6s Qh 7c Js 4c (hica) |    0 |    0 |    0 |    0 |    0 |    0 |    0 |    0 | 39.1 | 60.9 |
|  5c Qc Qh 7c Js 4c (pair) |    0 |    0 |    0 |    0 | 19.6 |    0 |  4.3 | 23.9 | 52.2 |    0 |
|  4h 5h Qh 7c Js 4c (pair) |    0 |    0 |    0 |    0 |    0 |    0 |  4.3 | 26.1 | 69.6 |    0 |
|  Kd 3h Qh 7c Js 4c (hica) |    0 |    0 |    0 |    0 |    0 |    0 |    0 |    0 | 39.1 | 60.9 |

#### (Just flop+turn %s)
| (flop+turn)         | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js 4c (hica) |    0 | 1e-2 | 2e-2 | 6e-1 | 9e-1 |  1.8 |  2.7 | 15.6 | 49.5 | 28.8 |

#### Flop+turn minus each player's pocket
| Board-pocket %s                     | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ----------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js 4c (minus:  2c 6s) (hica) |    0 | 1e-2 | 3e-2 | 7e-1 | 8e-1 |  1.9 |  2.9 | 16.5 | 49.7 | 27.5 |
|  Qh 7c Js 4c (minus:  5c Qc) (hica) |    0 |    0 | 2e-2 | 5e-1 | 6e-1 |  1.9 |  2.5 | 14.6 | 49.7 | 30.2 |
|  Qh 7c Js 4c (minus:  4h 5h) (hica) |    0 | 1e-2 | 2e-2 | 5e-1 |  1.1 |  1.9 |  2.5 | 14.5 | 49.4 | 30.0 |
|  Qh 7c Js 4c (minus:  Kd 3h) (hica) |    0 | 1e-2 | 3e-2 | 7e-1 |  1.1 |  1.8 |  2.9 | 16.5 | 49.6 | 27.4 |

### Final
| Final board %s         | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| ---------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js 4c 3d (hica) |    0 |    0 |    0 |    0 |    0 |  1.5 |  1.4 |  8.3 | 48.8 | 40.0 |

#### Board minus each player's pocket ≈%s
| Board-pocket                           | roya | strf | quad | fuho | flus | str8 | trip | twop | pair | hica |
| -------------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  Qh 7c Js 4c 3d (minus:  2c 6s) (hica) |    0 |    0 |    0 |    0 |    0 |  1.2 |  1.5 |  9.1 | 49.7 | 38.4 |
|  Qh 7c Js 4c 3d (minus:  5c Qc) (hica) |    0 |    0 |    0 |    0 |    0 |  1.2 |  1.3 |  7.9 | 48.3 | 41.3 |
|  Qh 7c Js 4c 3d (minus:  4h 5h) (hica) |    0 |    0 |    0 |    0 |    0 |  1.2 |  1.3 |  7.9 | 48.3 | 41.3 |
|  Qh 7c Js 4c 3d (minus:  Kd 3h) (hica) |    0 |    0 |    0 |    0 |    0 |  1.6 |  1.3 |  7.9 | 48.3 | 40.8 |
1. Player 2 ::  5c Qc |  Qh 7c Js 4c 3d => pair
2. Player 3 ::  4h 5h |  Qh 7c Js 4c 3d => pair
3. Player 4 ::  Kd 3h |  Qh 7c Js 4c 3d => pair
4. Player 1 ::  2c 6s |  Qh 7c Js 4c 3d => hica
