let masterData = {
  rowArray: [],
  columnArray: [],
  diagArray: [], // will have 2 elements: 0th for diag from top-left, 1st for diag from top-right
  tieCounter: 0,
  turnCounter: 0
};


function gameOn(masterData) {

  // grab number of rows from user input, add it to masterData object:
  let num = Number(document.querySelector('#numRowsInput').value);
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
  let tableHead = document.querySelector('thead');
  let tableBody = document.querySelector('tbody');
  let tableFoot = document.querySelector('tfoot');

  function turnCellIntoButton(currCell, cellPos) {
    currCell.setAttribute('onclick', `moveMade(${cellPos}, masterData)`);
    currCell.classList.add('clickable');
  }

  // top row
  let topRow = tableHead.insertRow(-1);
  for (let i = 0; i < masterData.numRows; i++) {
    let currCell = topRow.insertCell(-1);
    if (i !== 0 && i !== masterData.numRows - 1) {
      currCell.classList.add('topOrBottomEdge');
    }
    let cellPos = [0, i];
    turnCellIntoButton(currCell, cellPos);
  }

  // body rows
  let numBodyRows = masterData.numRows - 2;
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
  let bottomRow = tableFoot.insertRow(-1);
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

  let player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  let otherPlayer = (player === 1) ? 2 : 1;

  // make square un-clickable
  let currCell = document.querySelector('table').rows[cellRow].cells[cellCol];
  currCell.removeAttribute('onclick');
  currCell.classList.remove('clickable');

  // mark square with X or O
  let mark = (player === 1) ? document.createTextNode('X') : document.createTextNode('O');
  currCell.appendChild(mark);

  let playedOnDiagonal0 = (cellRow === cellCol) ? true : false;
  let playedOnDiagonal1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  // note that player has now moved in this row and column (and diagonals if applicable)
  masterData.rowArray[cellRow][`p${player}WasHere`] = true;
  masterData.columnArray[cellCol][`p${player}WasHere`] = true;
  if (playedOnDiagonal0) {
    masterData.diagArray[0][`p${player}WasHere`] = true;
  }
  if (playedOnDiagonal1) {
    masterData.diagArray[1][`p${player}WasHere`] = true;
  }

  // add to totalPlays counter for this row and column (and diagonals if applicable)
  masterData.rowArray[cellRow].totalPlays++;
  masterData.columnArray[cellCol].totalPlays++;
  if (playedOnDiagonal0) {
    masterData.diagArray[0].totalPlays++;
  }
  if (playedOnDiagonal1) {
    masterData.diagArray[1].totalPlays++;
  }



  let winner;

  function winSequence(winner) {
    // announce winner
    let winMessage = (winner) ? document.createTextNode(`Player ${winner} wins!`) : document.createTextNode('Tie game.');
    let winp = document.querySelector('#announceWinner');
    winp.appendChild(winMessage);

    // un-buttonize the cells
    let allCells = document.querySelectorAll('td');
    allCells.forEach((cell) => {
      cell.removeAttribute('onclick');
      cell.classList.remove('clickable');
    });

    // add play again option (un-hide "Play Again" button)
    document.querySelector('#playAgain').classList.remove('hidden');
  }


  // check for winner in row, column, and applicable diagonals (condition: it's full and other player hasn't played in it)

  function winnerChecker(totalPlays, numRows, otherPlayerStatus, player) {
    if (totalPlays === numRows && otherPlayerStatus === false) {
      return player;
    }
  }

  // check row
  winner = winnerChecker(masterData.rowArray[cellRow].totalPlays, masterData.numRows, masterData.rowArray[cellRow][`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    return;
  }

  // check column
  winner = winnerChecker(masterData.columnArray[cellCol].totalPlays, masterData.numRows, masterData.columnArray[cellCol][`p${otherPlayer}WasHere`], player);
  if (winner) {
    winSequence(winner);
    return;
  }
 
  // check for winner in diagonal 0 if applicable
  if (playedOnDiagonal0) {
    winner = winnerChecker(masterData.diagArray[0].totalPlays, masterData.numRows, masterData.diagArray[0][`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      return;
    }
  }

  // check for winner in diagonal 1 if applicable
  if (playedOnDiagonal1) {
    winner = winnerChecker(masterData.diagArray[1].totalPlays, masterData.numRows, masterData.diagArray[1][`p${otherPlayer}WasHere`], player);
    if (winner) {
      winSequence(winner);
      return;
    }
  }


  // there's no winner, so add 1 to tieCounter for each row, column, and applicable diagonal that is un-winnable (both players have played in it) AND has not already been included in the tieCounter tally

  function tieCounterTest(p1Status, p2Status, addedToTieCounter) {
    if (p1Status === true && p2Status === true && addedToTieCounter === false) {
      return true;
    }
  }

  // for row
  let rowTieCounterTest = tieCounterTest(masterData.rowArray[cellRow].p1WasHere, masterData.rowArray[cellRow].p2WasHere, masterData.rowArray[cellRow].addedToTieCounter);
  if (rowTieCounterTest) {
    masterData.tieCounter++;
    masterData.rowArray[cellRow].addedToTieCounter = true;
  }

  // for column
  let columnTieCounterTest = tieCounterTest(masterData.columnArray[cellCol].p1WasHere, masterData.columnArray[cellCol].p2WasHere, masterData.columnArray[cellCol].addedToTieCounter);
  if (columnTieCounterTest) {
    masterData.tieCounter++;
    masterData.columnArray[cellCol].addedToTieCounter = true;
  }

  // for diagonal 0 if applicable
  if (playedOnDiagonal0) {
    let diag0TieCounterTest = tieCounterTest(masterData.diagArray[0].p1WasHere, masterData.diagArray[0].p2WasHere, masterData.diagArray[0].addedToTieCounter);
    if (diag0TieCounterTest) {
      masterData.tieCounter++;
      masterData.diagArray[0].addedToTieCounter = true;
    }
  }

  // for diagonal 1 if applicable
  if (playedOnDiagonal1) {
    let diag1TieCounterTest = tieCounterTest(masterData.diagArray[1].p1WasHere, masterData.diagArray[1].p2WasHere, masterData.diagArray[1].addedToTieCounter);
    if (diag1TieCounterTest) {
      masterData.tieCounter++;
      masterData.diagArray[1].addedToTieCounter = true;
    }
  }



  // check for tie (all rows, columns, and diagonals are un-winnable and have been included in the tieCounter tally)
  if (masterData.tieCounter === (2 * masterData.numRows) + 2) {
    winSequence(winner);
  }


  masterData.turnCounter++;
}


function resetGame(masterData) {

  // delete winner announcement text from its <p>
  document.querySelector('#announceWinner').textContent = '';

  // hide Play Again button
  document.querySelector('#playAgain').classList.add('hidden');

  // reset masterData object
  masterData.rowArray = [];
  masterData.columnArray = [];
  masterData.diagArray = [];
  masterData.tieCounter = 0;
  masterData.turnCounter = 0;
  delete masterData.numRows;

  // delete all table rows
  let allRows = document.querySelectorAll('tr');
  allRows.forEach((row) => {row.parentNode.removeChild(row);});

  // un-hide inputDiv
  document.querySelector('#inputDiv').classList.remove('hidden');

}
