const masterData = {
  rowArray: [],
  columnArray: [],
  diagArray: [], // will have 2 elements: 0th for diag from top-left, 1st for diag from top-right
  tieCounter: 0,
  turnCounter: 0,
  numRows: undefined,
  dataReset() {
    this.rowArray = [];
    this.columnArray = [];
    this.diagArray = [];
    this.tieCounter = 0;
    this.turnCounter = 0;
    this.numRows = undefined;
  }
};



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
  arrayFiller(masterData.columnArray, masterData.numRows);
  arrayFiller(masterData.diagArray, 2);


  // hide inputDiv:
  document.querySelector('#inputDiv').classList.add('hidden');



  // construct board (fill in table)

  const tableHead = document.querySelector('thead');
  const tableBody = document.querySelector('tbody');
  const tableFoot = document.querySelector('tfoot');

  function turnCellIntoButton(currCell, cellPos) {
    currCell.setAttribute('onclick', `moveMade(${cellPos}, masterData)`);
    currCell.classList.add('clickable');
  }

  // top row
  const topRow = tableHead.insertRow(-1);
  for (let i = 0; i < masterData.numRows; i++) {
    let currCell = topRow.insertCell(-1);
    if (i !== 0 && i !== masterData.numRows - 1) {
      currCell.classList.add('topOrBottomEdge');
    }
    let cellPos = [0, i];
    turnCellIntoButton(currCell, cellPos);
  }

  // body rows
  const numBodyRows = masterData.numRows - 2;
  for (let i = 0; i < numBodyRows; i++) {
    let currRow = tableBody.insertRow(-1);
    for (let j = 0; j < masterData.numRows; j++) {
      let currCell = currRow.insertCell(-1);
      if (j === 0 || j === masterData.numRows - 1) {
        currCell.classList.add('bodyEdge');
      }
      let cellPos = [i + 1, j];
      turnCellIntoButton(currCell, cellPos);
    }
  }

  // bottom row
  const bottomRow = tableFoot.insertRow(-1);
  for (let i = 0; i < masterData.numRows; i++) {
    let currCell = bottomRow.insertCell(-1);
    if (i !== 0 && i !== masterData.numRows - 1) {
      currCell.classList.add('topOrBottomEdge');
    }
    let cellPos = [masterData.numRows - 1, i];
    turnCellIntoButton(currCell, cellPos);
  }
}


function moveMade(cellRow, cellCol, masterData) {

  const currCell = document.querySelector('table').rows[cellRow].cells[cellCol];
  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;
  const playedOnDiagonal0 = (cellRow === cellCol) ? true : false;
  const playedOnDiagonal1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  // make square un-clickable
  currCell.removeAttribute('onclick');
  currCell.classList.remove('clickable');

  // mark square with X or O
  const mark = (player === 1) ? document.createTextNode('X') : document.createTextNode('O');
  currCell.appendChild(mark);


  // record that player has now moved in this row and column (and diagonals if applicable)
  masterData.rowArray[cellRow][`p${player}WasHere`] = true;
  masterData.columnArray[cellCol][`p${player}WasHere`] = true;
  if (playedOnDiagonal0) {
    masterData.diagArray[0][`p${player}WasHere`] = true;
  }
  if (playedOnDiagonal1) {
    masterData.diagArray[1][`p${player}WasHere`] = true;
  }

  // add 1 to totalPlays counter for this row and column (and diagonals if applicable)
  masterData.rowArray[cellRow].totalPlays++;
  masterData.columnArray[cellCol].totalPlays++;
  if (playedOnDiagonal0) {
    masterData.diagArray[0].totalPlays++;
  }
  if (playedOnDiagonal1) {
    masterData.diagArray[1].totalPlays++;
  }



  // everything else in this function is win/tie handling:

  let winner;

  function winnerChecker(totalPlays, numRows, otherPlayerStatus, player) {
    if (totalPlays === numRows && otherPlayerStatus === false) {
      return player;
    }
  }

  function winSequence(winner) {

    // announce winner or tie game
    const winMessage = (winner) ? document.createTextNode(`Player ${winner} wins!`) : document.createTextNode('Tie game.');
    document.querySelector('#announceWinner').appendChild(winMessage);

    // un-buttonize the cells
    let allCells = document.querySelectorAll('td');
    allCells.forEach((cell) => {
      cell.removeAttribute('onclick');
      cell.classList.remove('clickable');
    });

    // add play again option (un-hide winnerDiv)
    document.querySelector('#winnerDiv').classList.remove('hidden');
  }


  // check for winner ...

  // ... in row:
  winner = winnerChecker(masterData.rowArray[cellRow].totalPlays, masterData.numRows, masterData.rowArray[cellRow][`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    document.querySelector('table').rows[cellRow].classList.add('winning');
    return;
  }

  // ... in column:
  winner = winnerChecker(masterData.columnArray[cellCol].totalPlays, masterData.numRows, masterData.columnArray[cellCol][`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    for (let i = 0; i < masterData.numRows; i++) {
      document.querySelector('table').rows[i].cells[cellCol].classList.add('winning');
    }
    return;
  }
 
  // ... in diagonal 0 if applicable:
  if (playedOnDiagonal0) {
    winner = winnerChecker(masterData.diagArray[0].totalPlays, masterData.numRows, masterData.diagArray[0][`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      for (let i = 0; i < masterData.numRows; i++) {
        document.querySelector('table').rows[i].cells[i].classList.add('winning');
      }
      return;
    }
  }

  // ... in diagonal 1 if applicable:
  if (playedOnDiagonal1) {
    winner = winnerChecker(masterData.diagArray[1].totalPlays, masterData.numRows, masterData.diagArray[1][`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      for (let i = 0; i < masterData.numRows; i ++) {
        document.querySelector('table').rows[i].cells[masterData.numRows - 1 - i].classList.add('winning');
      }
      return;
    }
  }



  // there's no winner, so add 1 to tieCounter for each row, column, and applicable diagonal that is freshly
  // un-winnable (both players have played in it AND it hasn't already been included in the tieCounter tally).
  // After adding that 1, set addedToTieCounter property to true in the row/col/diag object, so that
  // no row/col/diag can be counted toward the tieCounter tally more than once.

  function tieCounterAdder(p1Status, p2Status, addedToTieCounter, masterData) {
    if (p1Status === true && p2Status === true && addedToTieCounter === false) {
      masterData.tieCounter++;
      return true;
    }
  }

  // for row
  const addedForRow = tieCounterAdder(masterData.rowArray[cellRow].p1WasHere, masterData.rowArray[cellRow].p2WasHere, masterData.rowArray[cellRow].addedToTieCounter, masterData);
  if (addedForRow) {
    masterData.rowArray[cellRow].addedToTieCounter = true;
  }

  // for column
  const addedForCol = tieCounterAdder(masterData.columnArray[cellCol].p1WasHere, masterData.columnArray[cellCol].p2WasHere, masterData.columnArray[cellCol].addedToTieCounter, masterData);
  if (addedForCol) {
    masterData.columnArray[cellCol].addedToTieCounter = true;
  }

  // for diagonal 0 if applicable
  if (playedOnDiagonal0) {
    const addedForDiag0 = tieCounterAdder(masterData.diagArray[0].p1WasHere, masterData.diagArray[0].p2WasHere, masterData.diagArray[0].addedToTieCounter, masterData);
    if (addedForDiag0) {
      masterData.diagArray[0].addedToTieCounter = true;
    }
  }

  // for diagonal 1 if applicable
  if (playedOnDiagonal1) {
    const addedForDiag1 = tieCounterAdder(masterData.diagArray[1].p1WasHere, masterData.diagArray[1].p2WasHere, masterData.diagArray[1].addedToTieCounter, masterData);
    if (addedForDiag1) {
      masterData.diagArray[1].addedToTieCounter = true;
    }
  }



  // check for tie (tieCounter = number of rows + number of columns + number of diagonals)
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
  let allRows = document.querySelectorAll('tr');
  allRows.forEach((row) => {row.parentNode.removeChild(row);});

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
  let allRows = document.querySelectorAll('tr');
  allRows.forEach((row) => {row.parentNode.removeChild(row);});

  // un-hide inputDiv
  document.querySelector('#inputDiv').classList.remove('hidden');
}



// allows pushing enter key in input box to start game
document.querySelector('#numRowsInput').onkeyup = (event) => {
  if (event.keyCode === 13) {
    gameOn(masterData);
  }
};

// allows pushing Submit button to start game
document.querySelector('#numRowsButton').onclick = () => {gameOn(masterData)};

// allows pushing Play Again button to play again
document.querySelector('#playAgainButton').onclick = () => {playAgain(masterData, gameOn)};

// allows pushing Change Size button to change size and play again
document.querySelector('#changeSizeButton').onclick = () => {resizeBoard(masterData)};
