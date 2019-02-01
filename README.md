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
$ node deal.js 0
```
This will:
1. first generate a 1.1 GB file, `handsScore-7.bin`, containing all 134 million seven-card hands as well as the best ranking (one through ten, one for royal flush, ten for high card)—so eight bytes time 133784560 divided by 1024 bytes per kilobyte, and divided by 1024 kilobytes per megabyte yields 1020 megabytes.
2. Then generate five files, named `map-r-7-n-2.ldjson`, `map-r-7-n-3.ldjson`, and so on through `map-r-7-n-6.ldjson`, i.e., the "n" number goes from 2 to 6. These line-delimited JSON files (where each line is valid JSON) contains each "n"-card hand for "n" running from 2 to 6 (inclusive), and the total number of royal flushes, straight flushes, etc., that can be made with those "n" cards out of the universe of seven-card hands. The "n" = 2 file contains 52-choose-2, or 1326, rows. The "n" = 6 file contains 52-choose-6, or more than twenty million, rows.
3. Finally, the last script will deal four players seven cards, rank them best to worst, and show you some histogram analysis of each hand.
