const masterData = {
  rowArray: [],
  colArray: [],
  diagArray: [], // will have 2 elements: 0th for diag from top-left, 1st for diag from top-right
  tieCounter: 0,
  turnCounter: 0,
  numRows: undefined,
  dataReset() {
    this.rowArray = [];
    this.colArray = [];
    this.diagArray = [];
    this.tieCounter = 0;
    this.turnCounter = 0;
    this.numRows = undefined;
  }
};


// Event handling:

function cellClickHandler() {
  moveMade(this.parentNode.rowIndex, this.cellIndex, masterData);
}

/* Listener for above handler is added in gameOn() and removed in moveMade().
I'd use an anonymous function or arrow function in gameOn() instead, but
handler function must be declared for removeEventListener to work, and it
seems that it must be declared GLOBALLY (doesn't work otherwise). The use
of 'this' here leaves me uneasy, but I think it's correct. I also don't
pass this handler as a parameter to gameOn() or moveMade(), because I think
that those functions don't actually call it; rather, they leave instructions
for ... something else ... to call it (something w/ access to global scope). */


// these listeners added on DOM load:
function onLoadListeners() {
  document.querySelector('#numRowsInput').addEventListener('keyup', event => {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      gameOn(masterData);
    }
  });
  document.querySelector('#numRowsButton').addEventListener('click', () => {
    gameOn(masterData);
  });
  document.querySelector('#playAgainButton').addEventListener('click', () => {
    playAgain(masterData, gameOn, alwaysDoBeforeNewGame);
  });
  document.querySelector('#changeSizeButton').addEventListener('click', () => {
    resizeBoard(masterData, alwaysDoBeforeNewGame);
  });
  document.querySelector('#stopGameButton').addEventListener('click', () => {
    const allCells = document.querySelectorAll('td');
    allCells.forEach(cell => {
      cell.classList.remove('clickable');
      cell.removeEventListener('click', cellClickHandler);
    });
    document.querySelector('#winnerDiv').classList.remove('hidden');
    document.querySelector('#stopGameDiv').classList.add('hidden');
  });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadListeners);
} else {
    onLoadListeners();
}



// gameplay functions:


function gameOn(masterData) {

  const num = Number(document.querySelector('#numRowsInput').value);
  if (num && num >= 3 && num <= 10) {
    masterData.numRows = num;
    document.querySelector('#warning').classList.remove('warning');
  } else {
    document.querySelector('#warning').classList.add('warning');
    return;
  }

  document.querySelector('#inputDiv').classList.add('hidden');
  document.querySelector('#stopGameDiv').classList.remove('hidden');


  // make an object for every row, column, and diagonal (for tracking win/tie conditions)
  function arrayFiller(arr, upperBound) {
    for (let i = 0; i < upperBound; i++) {
      arr.push({
        p1WasHere: false,
        p2WasHere: false,
        totalPlays: 0,
        addedToTieCounter: false
      });
    }
  }
  arrayFiller(masterData.rowArray, masterData.numRows);
  arrayFiller(masterData.colArray, masterData.numRows);
  arrayFiller(masterData.diagArray, 2);

  // construct top and bottom rows
  function topOrBottomFiller(masterData, currRow) {
    for (let i = 0; i < masterData.numRows; i++) {
      const currCell = currRow.insertCell(-1);
      if (i !== 0 && i !== masterData.numRows - 1) {
        currCell.classList.add('topOrBottomEdge');
      }
    }
  }
  const topRow = document.querySelector('thead').insertRow(-1);
  topOrBottomFiller(masterData, topRow);
  const bottomRow = document.querySelector('tfoot').insertRow(-1);
  topOrBottomFiller(masterData, bottomRow);

  // construct body rows
  const tableBody = document.querySelector('tbody');
  for (let i = 0; i < masterData.numRows - 2; i++) {
    const currRow = tableBody.insertRow(-1);
    for (let j = 0; j < masterData.numRows; j++) {
      const currCell = currRow.insertCell(-1);
      if (j === 0 || j === masterData.numRows - 1) {
        currCell.classList.add('bodyEdge');
      }
    }
  }

  const allCells = document.querySelectorAll('td');
  allCells.forEach(cell => {
    cell.classList.add('clickable');
    cell.addEventListener('click', cellClickHandler, {once:true});
  });
}


function moveMade(cellRow, cellCol, masterData) {

  const board = document.querySelector('table');
  const currCell = board.rows[cellRow].cells[cellCol];
  currCell.classList.remove('clickable');

  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;
  const mark = (player === 1) ? document.createTextNode('X') : document.createTextNode('O');
  currCell.appendChild(mark);

  masterData.turnCounter++;

  const rowPath = masterData.rowArray[cellRow];
  const colPath = masterData.colArray[cellCol];
  const diag0Path = masterData.diagArray[0];
  const diag1Path = masterData.diagArray[1];

  const diag0 = (cellRow === cellCol) ? true : false;
  const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  function recordMoveAndCheckWin(objectPath, player, masterData, otherPlayer) {
    objectPath[`p${player}WasHere`] = true;
    objectPath.totalPlays++;
    return (objectPath.totalPlays === masterData.numRows && objectPath[`p${otherPlayer}WasHere`] === false);
  }
  const wins = {
    rowWin: recordMoveAndCheckWin(rowPath, player, masterData, otherPlayer),
    colWin: recordMoveAndCheckWin(colPath, player, masterData, otherPlayer),
    diag0Win: (diag0) ? recordMoveAndCheckWin(diag0Path, player, masterData, otherPlayer) : false,
    diag1Win: (diag1) ? recordMoveAndCheckWin(diag1Path, player, masterData, otherPlayer) : false
  };

  function styleWinningCells(wins, board, cellRow, cellCol) {
    if (wins.rowWin) {
      board.rows[cellRow].classList.add('winning');
    }
    if (wins.colWin || wins.diag0Win || wins.diag1Win) {
      for (let i = 0; i < board.rows.length; i++) {
        if (wins.colWin) {
          board.rows[i].cells[cellCol].classList.add('winning');
        }
        if (wins.diag0Win) {
          board.rows[i].cells[i].classList.add('winning');
        }
        if (wins.diag1Win) {
          board.rows[i].cells[board.rows.length - 1 - i].classList.add('winning');
        }
      }
    }
  }

  function gameOver(winner) {
    const allCells = document.querySelectorAll('td');
    allCells.forEach(cell => {
      cell.classList.remove('clickable');
      cell.removeEventListener('click', cellClickHandler);
    });
    const winMessage = (winner)
    ? document.createTextNode(`Player ${winner} wins!`)
    : document.createTextNode('Tie game.');
    document.querySelector('#announceWinner').appendChild(winMessage);
    document.querySelector('#winnerDiv').classList.remove('hidden');
    document.querySelector('#stopGameDiv').classList.add('hidden');
  }

  const winner = (Object.values(wins).includes(true)) ? player : null;

  if (winner) {
    styleWinningCells(wins, board, cellRow, cellCol);
    gameOver(winner);
    return;
  }

  function tieCounterAdder(masterData, objectPath) {
    if (objectPath.p1WasHere === true && objectPath.p2WasHere === true && objectPath.addedToTieCounter === false) {
      masterData.tieCounter++;
      objectPath.addedToTieCounter = true;
    }
  }
  tieCounterAdder(masterData, rowPath);
  tieCounterAdder(masterData, colPath);
  tieCounterAdder(masterData, diag0Path);
  tieCounterAdder(masterData, diag1Path);

  // check for tie:
  if (masterData.tieCounter === (2 * masterData.numRows) + 2) {
    gameOver(winner);
  }
}



// post-game functions:

function alwaysDoBeforeNewGame() {
  const allRows = document.querySelectorAll('tr');
  allRows.forEach(row => {
    row.remove();
  });
  document.querySelector('#announceWinner').textContent = '';
  document.querySelector('#winnerDiv').classList.add('hidden');
}

function playAgain(masterData, gameOn, alwaysDoBeforeNewGame) {
  alwaysDoBeforeNewGame();

  const numRows = masterData.numRows;
  masterData.dataReset();
  masterData.numRows = numRows;

  gameOn(masterData)
}

function resizeBoard(masterData, alwaysDoBeforeNewGame) {
  alwaysDoBeforeNewGame();
  masterData.dataReset();
  document.querySelector('#inputDiv').classList.remove('hidden');
}
