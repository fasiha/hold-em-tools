""" 
This script will save 'ncr52_7.txt', a 1.1 GB text file containing all
133,784,560 (almost 134 million) ways you can choose seven from
fifty-two, i.e., `nCr(52, 7)`, separated by newlines. The fifty-two
elements are uppercase and lowercase Latin letters ('A' to 'Z', 'a' to
'z'), and each line is guaranteed to be sorted, e.g., first line is
`ABCDEFG` and the last is `tuvwxyz`. Because of this, each
seven-character string is guaranteed to be sorted.

On my laptop (2015-vintage with SSD) and Python 3.6, it takes about a
minute to run.
"""

import itertools as it
from string import ascii_lowercase, ascii_uppercase
if __name__ == '__main__':
    cards = list(ascii_uppercase + ascii_lowercase)
    with open('ncr52_7.txt', 'wt') as fid:
        for comb in it.combinations(cards, 7):
            fid.write(''.join(comb) + '\n')
    print('done')
