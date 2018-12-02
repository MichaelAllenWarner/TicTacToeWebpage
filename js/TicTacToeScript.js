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

// listener for this handler is added in gameOn()
function cellClickHandler() {
  moveMade(this.parentNode.rowIndex, this.cellIndex, masterData); // works, but I have ?'s about scope / parameter-passing
}

// these listeners added on DOM load:
function onLoadListeners() {
  document.querySelector('#numRowsInput').addEventListener('keyup', event => {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      gameOn(masterData);
    }
  });
  document.querySelector('#numRowsButton').addEventListener('click', () => {gameOn(masterData);});
  document.querySelector('#playAgainButton').addEventListener('click', () => {playAgain(masterData, gameOn, alwaysDoAfterGame);});
  document.querySelector('#changeSizeButton').addEventListener('click', () => {resizeBoard(masterData, alwaysDoAfterGame);});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadListeners);
} else {
    onLoadListeners();
}



// gameplay functions:


function gameOn(masterData) {

  // grab number of rows from user input, add it to masterData object:
  const num = Number(document.querySelector('#numRowsInput').value);
  if (num && num >= 3 && num <= 10) {
    masterData.numRows = num;
    document.querySelector('#warning').classList.remove('warning');
  } else {
    document.querySelector('#warning').classList.add('warning');
    return;
  }

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


  // hide inputDiv:
  document.querySelector('#inputDiv').classList.add('hidden');


  // construct board

  // top and bottom rows
  function topOrBottomFiller(masterData, currRow) {
    for (let i = 0; i < masterData.numRows; i++) {
      let currCell = currRow.insertCell(-1);
      if (i !== 0 && i !== masterData.numRows - 1) {
        currCell.classList.add('topOrBottomEdge');
      }
    }
  }
  const topRow = document.querySelector('thead').insertRow(-1);
  topOrBottomFiller(masterData, topRow);
  const bottomRow = document.querySelector('tfoot').insertRow(-1);
  topOrBottomFiller(masterData, bottomRow);

  // body rows
  const tableBody = document.querySelector('tbody');
  for (let i = 0; i < masterData.numRows - 2; i++) {
    let currRow = tableBody.insertRow(-1);
    for (let j = 0; j < masterData.numRows; j++) {
      let currCell = currRow.insertCell(-1);
      if (j === 0 || j === masterData.numRows - 1) {
        currCell.classList.add('bodyEdge');
      }
    }
  }


  // buttonize the cells (for both style and functionality)
  const allCells = document.querySelectorAll('td');
  allCells.forEach(cell => {
    cell.classList.add('clickable');
    cell.addEventListener('click', cellClickHandler, {once:true}); // works, but I have ?'s about scope / parameter-passing
  });
}


function moveMade(cellRow, cellCol, masterData) {

  const board = document.querySelector('table');
  const currCell = board.rows[cellRow].cells[cellCol];

  // played on diagonals?
  const diag0 = (cellRow === cellCol) ? true : false;
  const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  // establish whose turn it is, add 1 to turn counter
  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;
  masterData.turnCounter++;

  // "shortcuts" to row/col/diag objects (to reduce verbosity):
  const rowPath = masterData.rowArray[cellRow];
  const colPath = masterData.colArray[cellCol];
  const diag0Path = masterData.diagArray[0];
  const diag1Path = masterData.diagArray[1];


  // un-buttonize this square (for style only; event listener removed automatically)
  currCell.classList.remove('clickable');

  // mark this square with X or O
  const mark = (player === 1) ? document.createTextNode('X') : document.createTextNode('O');
  currCell.appendChild(mark);

  // record that player has now moved in this row and column (and diagonals if applicable)
  rowPath[`p${player}WasHere`] = true;
  colPath[`p${player}WasHere`] = true;
  if (diag0) {
    diag0Path[`p${player}WasHere`] = true;
  }
  if (diag1) {
    diag1Path[`p${player}WasHere`] = true;
  }

  // add 1 to totalPlays counter for this row and column (and diagonals if applicable)
  rowPath.totalPlays++;
  colPath.totalPlays++;
  if (diag0) {
    diag0Path.totalPlays++;
  }
  if (diag1) {
    diag1Path.totalPlays++;
  }


  // this function called in case of win or tie:

  function gameOver(winner) {
    // un-buttonize all cells (for both style and functionality)
    const allCells = document.querySelectorAll('td');
    allCells.forEach(cell => {
      cell.classList.remove('clickable');
      cell.removeEventListener('click', cellClickHandler); // works, but I have ?'s about scope / parameter-passing
    });

    // announce result
    const winMessage = (winner)
    ? document.createTextNode(`Player ${winner} wins!`)
    : document.createTextNode('Tie game.');
    document.querySelector('#announceWinner').appendChild(winMessage);

    // reveal winnerDiv (has result announcement and replay options)
    document.querySelector('#winnerDiv').classList.remove('hidden');
  }


  // check for wins
  function winChecker(objectPath, masterData, otherPlayer) {
    if (objectPath.totalPlays === masterData.numRows && objectPath[`p${otherPlayer}WasHere`] === false) {
      return true;
    }
  }
  const wins = {
    rowWin: winChecker(rowPath, masterData, otherPlayer),
    colWin: winChecker(colPath, masterData, otherPlayer),
    diag0Win: winChecker(diag0Path, masterData, otherPlayer),
    diag1Win: winChecker(diag1Path, masterData, otherPlayer)
  };

  // establish winner (null if no wins)
  const winner = (Object.values(wins).includes(true)) ? player : null;

  // if there's a winner, style winning cells and end game:
  if (winner) {
    if (wins.rowWin) {
      currCell.parentNode.classList.add('winning');
    }
    if (wins.colWin) {
      for (let i = 0; i < masterData.numRows; i++) {
        board.rows[i].cells[cellCol].classList.add('winning');
      }
    }
    if (wins.diag0Win) {
      for (let i = 0; i < masterData.numRows; i++) {
        board.rows[i].cells[i].classList.add('winning');
      }
    }
    if (wins.diag1Win) {
      for (let i = 0; i < masterData.numRows; i++) {
        board.rows[i].cells[masterData.numRows - 1 - i].classList.add('winning');
      }
    }
    gameOver(winner);
    return;
  }


  // There's no winner, so add 1 to tieCounter for each row, column, and diagonal that is FRESHLY
  // un-winnable (both players have played in it AND its addedToTieCounter property is false).
  // If 1 is added to tieCounter, set that addedToTieCounter property to true.

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

  // if there's a tie, end game:
  if (masterData.tieCounter === (2 * masterData.numRows) + 2) {
    gameOver(winner);
  }
}



// post-game functions:

function alwaysDoAfterGame() {
  // delete winner announcement text from its <p>
  document.querySelector('#announceWinner').textContent = '';

  // hide winnerDiv
  document.querySelector('#winnerDiv').classList.add('hidden');

  // delete all table rows
  const allRows = document.querySelectorAll('tr');
  allRows.forEach(row => {row.remove();});
}

function playAgain(masterData, gameOn, alwaysDoAfterGame) {
  alwaysDoAfterGame();

  // reset masterData object, but preserve masterData.numRows
  const numRows = masterData.numRows;
  masterData.dataReset();
  masterData.numRows = numRows;

  gameOn(masterData)
}

function resizeBoard(masterData, alwaysDoAfterGame) {
  alwaysDoAfterGame();

  // reset masterData object
  masterData.dataReset();

  // un-hide inputDiv
  document.querySelector('#inputDiv').classList.remove('hidden');
}
