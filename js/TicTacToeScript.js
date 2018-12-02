'use strict';

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



// Event handling

// listener for this handler is added in gameOn()
function cellClickHandler() {
  moveMade(this.parentNode.rowIndex, this.cellIndex, masterData);
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



  // construct board (fill in table)

  function topOrBottomRowFiller(masterData, currRow) {
    for (let i = 0; i < masterData.numRows; i++) {
      let currCell = currRow.insertCell(-1);
      if (i !== 0 && i !== masterData.numRows - 1) {
        currCell.classList.add('topOrBottomEdge');
      }
    }
  }

  // top row
  const topRow = document.querySelector('thead').insertRow(-1);
  topOrBottomRowFiller(masterData, topRow);

  // bottom row
  const bottomRow = document.querySelector('tfoot').insertRow(-1);
  topOrBottomRowFiller(masterData, bottomRow);

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


  // buttonize the cells (for both style and function)
  const allCells = document.querySelectorAll('td');
  allCells.forEach(cell => {
    cell.classList.add('clickable');
    cell.addEventListener('click', cellClickHandler, {once:true});
  })

}


function moveMade(cellRow, cellCol, masterData) {

  const currCell = document.querySelector('table').rows[cellRow].cells[cellCol];

  // played on diagonals?
  const diag0 = (cellRow === cellCol) ? true : false;
  const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;


  // establish whose turn it is, add 1 to turn counter
  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;
  masterData.turnCounter++;


  // these "path" declarations (to row/col/diag objects) are just shortcuts to reduce verbosity:
  const rowPath = masterData.rowArray[cellRow];
  const colPath = masterData.colArray[cellCol];
  const diag0Path = masterData.diagArray[0];
  const diag1Path = masterData.diagArray[1];


  // make this square un-clickable (for style only; function handled automatically)
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



  // win/tie handling:

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
  }

  // highlight any winning cells:
  if (wins.rowWin) {
    currCell.parentNode.classList.add('winning');
  }
  if (wins.colWin) {
    for (let i = 0; i < masterData.numRows; i++) {
      document.querySelector('table').rows[i].cells[cellCol].classList.add('winning');
    }
  }
  if (wins.diag0Win) {
    for (let i = 0; i < masterData.numRows; i++) {
      document.querySelector('table').rows[i].cells[i].classList.add('winning');
    }
  }
  if (wins.diag1Win) {
    for (let i = 0; i < masterData.numRows; i++) {
      document.querySelector('table').rows[i].cells[masterData.numRows - 1 - i].classList.add('winning');
    }
  }



  const winner = (Object.values(wins).includes(true)) ? player : null;

  function gameOver(winner) {
    // announce winner or tie game
    const winMessage = (winner)
    ? document.createTextNode(`Player ${winner} wins!`)
    : document.createTextNode('Tie game.');
    document.querySelector('#announceWinner').appendChild(winMessage);

    // un-buttonize the cells (style and function)
    const allCells = document.querySelectorAll('td');
    allCells.forEach(cell => {
      cell.classList.remove('clickable');
      cell.removeEventListener('click', cellClickHandler);
    });

    // reveal winnerDiv (announcement, replay options)
    document.querySelector('#winnerDiv').classList.remove('hidden');
  }


  // end game if there's a winner
  if (winner) {
    gameOver(winner);
    return;
  }


  // there's no winner, so add 1 to tieCounter for each row, column, and applicable diagonal that is
  // FRESHLY un-winnable (both players have played in it AND its addedToTieCounter property is false).
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


  // end game if there's a tie
  if (masterData.tieCounter === (2 * masterData.numRows) + 2) {
    gameOver(winner);
  }
}



// endgame functions:

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
