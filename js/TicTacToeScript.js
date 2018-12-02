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

// triggered during gameplay
function cellClickEventHandler() {
  moveMade(this.parentNode.rowIndex, this.cellIndex, masterData);
}

// runs when DOM content has loaded
function setUpOnLoadEventListeners() {

  // allows pushing enter key in input box to start game
  document.querySelector('#numRowsInput').addEventListener('keyup', event => {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      gameOn(masterData);
    }
  });

  // allows pushing Submit button to start game
  document.querySelector('#numRowsButton').addEventListener('click', () => {gameOn(masterData);});

  // allows pushing Play Again button to play again
  document.querySelector('#playAgainButton').addEventListener('click', () => {playAgain(masterData, gameOn);});

  // allows pushing Change Size button to change size and play again
  document.querySelector('#changeSizeButton').addEventListener('click', () => {resizeBoard(masterData);});
}

// sets up event listeners once document has loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setUpOnLoadEventListeners);
} else {
    setUpOnLoadEventListeners();
}




// gameplay


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
    cell.addEventListener('click', cellClickEventHandler, {once:true});
  })

}


function moveMade(cellRow, cellCol, masterData) {

  const currCell = document.querySelector('table').rows[cellRow].cells[cellCol];
  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;

  const diag0 = (cellRow === cellCol) ? true : false;
  const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  // these "path" declarations are just shortcuts to reduce verbosity:
  const rowPath = masterData.rowArray[cellRow];
  const colPath = masterData.colArray[cellCol];
  const diag0Path = masterData.diagArray[0];
  const diag1Path = masterData.diagArray[1];


  // make square un-clickable (for style only; function handled automatically)
  currCell.classList.remove('clickable');

  // mark square with X or O
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

  let winner;

  function winnerChecker(totalPlays, numRows, otherPlayerStatus, player) {
    if (totalPlays === numRows && otherPlayerStatus === false) {
      return player;
    }
  }

  function winSequence(winner) {

    // announce winner or tie game
    const winMessage = (winner) ?
      document.createTextNode(`Player ${winner} wins!`)
      : document.createTextNode('Tie game.');
    document.querySelector('#announceWinner').appendChild(winMessage);

    // un-buttonize the cells (style and function)
    const allCells = document.querySelectorAll('td');
    allCells.forEach(cell => {
      cell.removeEventListener('click', cellClickEventHandler);
      cell.classList.remove('clickable');
    });

    // add play again option (un-hide winnerDiv)
    document.querySelector('#winnerDiv').classList.remove('hidden');
  }


  // check for winner ...

  // ... in row:
  winner = winnerChecker(rowPath.totalPlays, masterData.numRows, rowPath[`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    currCell.parentNode.classList.add('winning');
    return;
  }

  // ... in column:
  winner = winnerChecker(colPath.totalPlays, masterData.numRows, colPath[`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    for (let i = 0; i < masterData.numRows; i++) {
      document.querySelector('table').rows[i].cells[cellCol].classList.add('winning');
    }
    return;
  }
 
  // ... in diagonal 0 if applicable:
  if (diag0) {
    winner = winnerChecker(diag0Path.totalPlays, masterData.numRows, diag0Path[`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      for (let i = 0; i < masterData.numRows; i++) {
        document.querySelector('table').rows[i].cells[i].classList.add('winning');
      }
      return;
    }
  }

  // ... in diagonal 1 if applicable:
  if (diag1) {
    winner = winnerChecker(diag1Path.totalPlays, masterData.numRows, diag1Path[`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      for (let i = 0; i < masterData.numRows; i++) {
        document.querySelector('table').rows[i].cells[masterData.numRows - 1 - i].classList.add('winning');
      }
      return;
    }
  }



  // there's no winner, so add 1 to tieCounter for each row, column, and applicable diagonal that is freshly
  // un-winnable (both players have played in it AND its addedToTieCounter property is false).
  // If 1 is added to tieCounter, set that addedToTieCounter property to true.

  function tieCounterAdder(p1Status, p2Status, addedToTieCounter, masterData) {
    if (p1Status === true && p2Status === true && addedToTieCounter === false) {
      masterData.tieCounter++;
      return true;
    }
  }

  // for row
  const addedForRow = tieCounterAdder(rowPath.p1WasHere, rowPath.p2WasHere, rowPath.addedToTieCounter, masterData);
  if (addedForRow) {
    rowPath.addedToTieCounter = true;
  }

  // for column
  const addedForCol = tieCounterAdder(colPath.p1WasHere, colPath.p2WasHere, colPath.addedToTieCounter, masterData);
  if (addedForCol) {
    colPath.addedToTieCounter = true;
  }

  // for diagonal 0 if applicable
  if (diag0) {
    const addedForDiag0 = tieCounterAdder(diag0Path.p1WasHere, diag0Path.p2WasHere, diag0Path.addedToTieCounter, masterData);
    if (addedForDiag0) {
      diag0Path.addedToTieCounter = true;
    }
  }

  // for diagonal 1 if applicable
  if (diag1) {
    const addedForDiag1 = tieCounterAdder(diag1Path.p1WasHere, diag1Path.p2WasHere, diag1Path.addedToTieCounter, masterData);
    if (addedForDiag1) {
      diag1Path.addedToTieCounter = true;
    }
  }



  // check for tie (tieCounter === number of rows + number of columns + number of diagonals)
  if (masterData.tieCounter === (2 * masterData.numRows) + 2) {
    winSequence(winner);
  }


  masterData.turnCounter++;
}


function playAgain(masterData, gameOn) {

  // delete winner announcement text from its <p>
  document.querySelector('#announceWinner').textContent = '';

  // hide winnerDiv
  document.querySelector('#winnerDiv').classList.add('hidden');

  // reset masterData object, but preserve masterData.numRows
  const numRows = masterData.numRows;
  masterData.dataReset();
  masterData.numRows = numRows;

  // delete all table rows
  const allRows = document.querySelectorAll('tr');
  allRows.forEach(row => {row.remove();});

  gameOn(masterData)
}


function resizeBoard(masterData) {
  
  // delete winner announcement text from its <p>
  document.querySelector('#announceWinner').textContent = '';

  // hide winnerDiv
  document.querySelector('#winnerDiv').classList.add('hidden');

  // reset masterData object
  masterData.dataReset();

  // delete all table rows
  const allRows = document.querySelectorAll('tr');
  allRows.forEach(row => {row.remove();});

  // un-hide inputDiv
  document.querySelector('#inputDiv').classList.remove('hidden');
}
