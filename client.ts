
import React, {createElement as ce} from 'react';
import ReactDOM from 'react-dom';
import {initCards, shortToReadable} from "./skinnyRank";
const shuffle: ((v: string[], seed?: number) => string[]) = require('knuth-shuffle-seeded');

const shortsString = initCards().shorts.join('');
export const socket = io();

interface Table {
  tableName: string;
  myName: string;
  players: string[];
  seed?: number;
  pocket?: string[];
  board?: string[];
  otherPockets?: Record<string, string[]>;
}

interface JoiningMsg {
  msgName: 'joining';
  name: string;
}
interface WelcomeMsg {
  msgName: 'welcome';
  from: string;
  players: string[]; // will include `from` and new joiner (if any)
}
interface DealMsg {
  msgName: 'pocket'|'flop'|'turn'|'river'|'showdown';
  players: string[];
  seed: number;
}
type Msg = JoiningMsg|WelcomeMsg|DealMsg;

import {observable, action, autorun, toJS} from "mobx";
import {observer} from 'mobx-react-lite';
export const table = observable({
  tableName: 'default',
  myName: Math.random().toString(36).slice(2).slice(0, 4),
  players: [],
} as Table);
const Table = observer(function Table() {
  if (!table.tableName) {
    return ce('button', {
      onClick: action(() => {
        const res = prompt('Table name?');
        if (res) { table.tableName = res; }
      })
    },
              'Set table name');
  }
  if (!table.myName) {
    return ce('button', {
      onClick: action(() => {
        const res = prompt('Your name?');
        if (res) {
          table.myName = res;
          table.players = sortedUnique(table.players.concat(table.myName));
          announce();
        }
      })
    },
              'Set your name');
  }
  const tableName = ce('p', null, `Table: ${table.tableName}`);
  const myName = ce('p', null, `My name: ${table.myName}`);
  const allPlayers = ce(
      'div', null, table.players.length <= 1 ? ce('button', {onClick: () => announce()}, 'Announce') : 'Players here:',
      ce('ol', null, ...table.players.map(n => ce('li', null, n))));

  let cards =
      ce('div', null, ce('p', null, table.pocket ? ('Pocket: ' + table.pocket.map(shortToReadable).join(' ')) : ''),
         ce('p', null, table.board ? ('Board: ' + table.board.map(shortToReadable).join(' ')) : ''),
         ce('ol', null,
            ...Object.entries(table.otherPockets || {})
                .map(([k, v]) => ce('li', null, `${k} : ${v.map(shortToReadable).join(' ')}`))));

  let buttonText = '';
  let onClick: () => void = () => {};
  if (table.players.length > 1) {
    if (!table.pocket || table.otherPockets) {
      buttonText = 'Deal pockets';
      onClick = () => {
        table.seed = Math.random();
        table.board = undefined;
        table.pocket = undefined;
        table.otherPockets = undefined;
        const msg: DealMsg = {msgName: 'pocket', players: table.players, seed: table.seed};
        socket.emit(table.tableName, msg);
      };
    } else if (!table.board) {
      buttonText = 'Deal flop';
      onClick = () => {
        if (!table.seed) { return; }
        const msg: DealMsg = {msgName: 'flop', players: table.players, seed: table.seed};
        socket.emit(table.tableName, msg)
      };
    } else if (table.board.length === 3) {
      buttonText = 'Deal turn'
      onClick = () => {
        if (!table.seed) { return; }
        const msg: DealMsg = {msgName: 'turn', players: table.players, seed: table.seed};
        socket.emit(table.tableName, msg)
      };
    } else if (table.board.length === 4) {
      buttonText = 'Deal river'
      onClick = () => {
        if (!table.seed) { return; }
        const msg: DealMsg = {msgName: 'river', players: table.players, seed: table.seed};
        socket.emit(table.tableName, msg)
      };
    } else {
      buttonText = 'Showdown!'
      onClick = () => {
        if (!table.seed) { return; }
        const msg: DealMsg = {msgName: 'showdown', players: table.players, seed: table.seed};
        socket.emit(table.tableName, msg)
      };
    }
  }
  const advanceGame = buttonText ? ce('button', {onClick: action(onClick)}, buttonText) : '';
  return ce('div', null, tableName, myName, allPlayers, advanceGame, cards);
})

ReactDOM.render(ce(React.StrictMode, null, ce(React.Suspense, {fallback: ce('p', null, 'Loading…')}, ce(Table))),
                document.getElementById('root'));

export const announce = action(function announce() {
  table.players = sortedUnique(table.players.concat(table.myName));

  socket.emit('join-room', table.tableName);
  const myJoiningMsg: JoiningMsg = {msgName: 'joining', name: table.myName};
  socket.emit(table.tableName, myJoiningMsg);
});

socket.on(
    table.tableName,
    action((m: Msg) => {
      console.log('MSG RECEIVED!', m);
      if (m.msgName === 'joining') {
        // new player is announcing a join
        if (!table.pocket && table.myName !== m.name) {
          table.players = sortedUnique(table.players.concat(m.name));
          const welcome: WelcomeMsg = {msgName: 'welcome', from: table.myName, players: table.players};
          socket.emit(table.tableName, welcome);
        }
      } else if (m.msgName === 'welcome') {
        // everyone is welcoming a new player
        table.players = sortedUnique(table.players.concat(m.players));
        if (!m.players.includes(table.myName)) {
          const myJoiningMsg: JoiningMsg = {msgName: 'joining', name: table.myName};
          socket.emit(table.tableName, myJoiningMsg);
        }
      } else if (m.msgName === 'pocket' || m.msgName === 'flop' || m.msgName === 'turn' || m.msgName === 'river' ||
                 m.msgName === 'showdown') {
        table.seed = m.seed;
        if (arrayEqual(m.players, table.players) && table.players.includes(table.myName)) {
          table.pocket = undefined;
          table.board = undefined;

          const shorts = shortsString.split('');
          shuffle(shorts, table.seed);

          const otherPockets: Record<string, string[]> = {};

          for (const name of table.players) {
            const first = shorts.pop();
            const second = shorts.pop();
            if (!(first && second)) { throw new Error('ran out of cards for pocket?') }
            if (name === table.myName) {
              table.pocket = [first, second];
            } else {
              otherPockets[name] = [first, second];
            }
          }

          if (m.msgName === 'pocket') {
            table.board = undefined;
            table.otherPockets = undefined;
            return;
          }

          table.board = [];
          for (let i = 0; i < 3; i++) {
            const popped = shorts.pop();
            if (!popped) { throw new Error('ran out of cards for flop?') }
            table.board.push(popped);
          }
          if (m.msgName === 'flop') { return; }

          const turn = shorts.pop();
          if (!turn) { throw new Error('ran out of cards for turn?') }
          table.board.push(turn);
          if (m.msgName === 'turn') { return; }

          const river = shorts.pop();
          if (!river) { throw new Error('ran out of cards for river?') }
          table.board.push(river);

          if (m.msgName === 'showdown') { table.otherPockets = otherPockets; }
        } else {
          table.pocket === undefined;
        }
      } else {
        assertNever(m.msgName);
      }
    }),
);

function arrayEqual<T>(a: T[], b: T[]): boolean { return a.length === b.length && a.every((a, i) => a === b[i]); }
function sortedUnique<T>(v: T[]): T[] { return Array.from(new Set(v)).sort(); }
function assertNever(never: never) { throw new Error(never); }

// client.socket.emit('hello', {wasap:'whee'}) // talks to server