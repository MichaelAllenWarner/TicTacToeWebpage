const masterData = {
  rowArray: [],
  colArray: [],
  diagArray: [], // will have 2 elements: 0th for diag from top-left, 1st for diag from top-right
  tieCounter: 0,
  turnCounter: 0,
  numRows: undefined,
  computer: false,
  difficulty: undefined,
  computerAnimationsInProgress: 0,
  dataReset() {
    this.rowArray = [];
    this.colArray = [];
    this.diagArray = [];
    this.tieCounter = 0;
    this.turnCounter = 0;
    this.computerAnimationsInProgress = 0;
  }
};


function gameOn(masterData) {

  const num = +document.querySelector('#numRowsInput').value;
  if (Number.isInteger(num) && num >= 3 && num <= 10) {
    masterData.numRows = num;
  } else {
    document.querySelector('#warning').classList.add('warning');
    return 'badInput';
  }

  document.querySelector('#optionsDiv').classList.add('hidden');
  document.querySelector('#stopGameDiv').classList.remove('hidden');


  // make an object for every row, column, and diagonal (for tracking win/tie conditions)
  function arrayFiller(arr, upperBound) {
    for (let i = 0; i < upperBound; i++) {
      arr.push({
        p1Plays: 0,
        p2Plays: 0,
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
    const cellSpan = document.createElement('span');
    cellSpan.classList.add('cellSpan');
    cellSpan.textContent = 'X';
    cell.appendChild(cellSpan);
  });
}


function moveMade(cellRow, cellCol, masterData) {

  const board = document.querySelector('table');
  const currCell = board.rows[cellRow].cells[cellCol];
  currCell.classList.remove('clickable');

  const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
  const otherPlayer = (player === 1) ? 2 : 1;
  const mark = (player === 1) ? 'X' : 'O';
  const otherMark = (mark === 'X') ? 'O' : 'X';
  currCell.textContent = mark;
  const allCellSpans = document.querySelectorAll('.cellSpan');
  allCellSpans.forEach(cellSpan => {
    cellSpan.textContent = otherMark;
  });

  masterData.turnCounter++;

  const rowPath = masterData.rowArray[cellRow];
  const colPath = masterData.colArray[cellCol];
  const diag0Path = masterData.diagArray[0];
  const diag1Path = masterData.diagArray[1];

  const diag0 = (cellRow === cellCol) ? true : false;
  const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

  function recordMoveAndCheckWin(objectPath, player, masterData, otherPlayer) {
    objectPath[`p${player}Plays`]++;
    objectPath.totalPlays++;
    return (objectPath.totalPlays === masterData.numRows && !objectPath[`p${otherPlayer}Plays`]);
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
    const allCellSpans = document.querySelectorAll('.cellSpan');
    allCellSpans.forEach(cellSpan => {
      cellSpan.remove();
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
    // to make sure computer's winning cells always get styled all at once:
    if (masterData.computerAnimationsInProgress !== 0 && !currCell.matches(':hover')) {
      const computerCellsThatMightBeAnimating = document.querySelectorAll('.computerMove');
      computerCellsThatMightBeAnimating.forEach(candidate => {
        candidate.addEventListener('animationend', () => {
          if (masterData.computerAnimationsInProgress === 0) {
            styleWinningCells(wins, board, cellRow, cellCol);
          }
        }, {once:true});
      });
    }
    if (masterData.computerAnimationsInProgress === 0 || currCell.matches(':hover')) {
      styleWinningCells(wins, board, cellRow, cellCol);
    }
    gameOver(winner);
    return;
  }

  function tieCounterAdder(masterData, objectPath) {
    if (objectPath.p1Plays && objectPath.p2Plays && objectPath.addedToTieCounter === false) {
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
    return;
  }
}


// current computer strategy:
// 1) find imminent self-victory
// 2) find imminent otherPlayer-victory and stop it
// 3) create a fork if possible
// 4) play a square w/ most player marks in cross-lines that have NO other-player marks
// 5) if (3) don't exist, play a square w/ most OTHER-player cross-marks with NO current-player marks
// 6) play a random open cell
// note: it's a start, but it limits computer moves (e.g., will never play in opposite corners if you play in middle);
// 4 and 5 aren't particularly good strategy

function triggerComputerMove(masterData) {
  const openCellSpans = document.querySelectorAll('.cellSpan');
  if (masterData.difficulty === 'easy' || masterData.difficulty === 'hard') {
    const player = (masterData.turnCounter % 2 === 0) ? 1 : 2;
    const otherPlayer = (player === 1) ? 2 : 1;
    const openCellObjects = [];
    openCellSpans.forEach((span, index) => {
      const cellRow = span.parentNode.parentNode.rowIndex;
      const cellCol = span.parentNode.cellIndex;
      const rowPath = masterData.rowArray[cellRow];
      const colPath = masterData.colArray[cellCol];
      const diag0Path = masterData.diagArray[0];
      const diag1Path = masterData.diagArray[1];
      const diag0 = (cellRow === cellCol) ? true : false;
      const diag1 = (cellRow + cellCol === masterData.numRows - 1) ? true : false;

      const winOppFinder = (objectPath, masterData) => !objectPath[`p${otherPlayer}Plays`] && objectPath.totalPlays === masterData.numRows - 1;
      const winOpp = (winOppFinder(rowPath, masterData) || winOppFinder(colPath, masterData) || (diag0 && winOppFinder(diag0Path, masterData)) || (diag1 && winOppFinder(diag1Path, masterData)));

      const loseThreatFinder = (objectPath, masterData) => !objectPath[`p${player}Plays`] && objectPath.totalPlays === masterData.numRows - 1;
      const loseThreat = (loseThreatFinder(rowPath, masterData) || loseThreatFinder(colPath, masterData) || (diag0 && loseThreatFinder(diag0Path, masterData)) || (diag1 && loseThreatFinder(diag1Path, masterData)));

      const ownForkOppFinder = (objectPath, masterData) => (!objectPath[`p${otherPlayer}Plays`] && objectPath.totalPlays === masterData.numRows - 2);
      let ownForkOppCounter = 0;
      if (ownForkOppFinder(rowPath, masterData)) {
        ownForkOppCounter++;
      }
      if (ownForkOppFinder(colPath, masterData)) {
        ownForkOppCounter++;
      }
      if (diag0) {
        if (ownForkOppFinder(diag0Path, masterData)) {
          ownForkOppCounter++;
        }
      }
      if (diag1) {
        if (ownForkOppFinder(diag1Path, masterData)) {
          ownForkOppCounter++;
        }
      }
      const ownForkOpp = (ownForkOppCounter >= 2) ? true : false;

      const pButNotOPFinder = objectPath => (objectPath[`p${player}Plays`] && !objectPath[`p${otherPlayer}Plays`]) ? objectPath[`p${player}Plays`] : 0;
      let pMarksWithNoOPMarks = pButNotOPFinder(rowPath) + pButNotOPFinder(colPath);
      if (diag0) {
        pMarksWithNoOPMarks = pMarksWithNoOPMarks + pButNotOPFinder(diag0);
      }
      if (diag1) {
        pMarksWithNoOPMarks = pMarksWithNoOPMarks + pButNotOPFinder(diag1);
      }

      const oPButNotPFinder = objectPath => (objectPath[`p${otherPlayer}Plays`] && !objectPath[`p${player}Plays`]) ? objectPath[`p${otherPlayer}Plays`] : 0;
      let oPMarksWithNoPMarks = oPButNotPFinder(rowPath) + oPButNotPFinder(colPath);
      if (diag0) {
        oPMarksWithNoPMarks = oPMarksWithNoPMarks + oPButNotPFinder(diag0);
      }
      if (diag1) {
        oPMarksWithNoPMarks = oPMarksWithNoPMarks + oPButNotPFinder(diag1);
      }

      openCellObjects.push({
        openCellSpansIndex: index,
        winOpp,
        loseThreat,
        ownForkOpp,
        pMarksWithNoOPMarks,
        oPMarksWithNoPMarks,
      });
    });

    let cellToPlay;

    for (let i = 0; i < openCellObjects.length; i++) {
      if (openCellObjects[i]['winOpp']) {
        cellToPlay = openCellSpans[openCellObjects[i].openCellSpansIndex];
        break;
      }
    }
    if (cellToPlay) {
      cellToPlay.click();
      return;
    }
    for (let i = 0; i < openCellObjects.length; i++) {
      if (openCellObjects[i]['loseThreat']) {
        cellToPlay = openCellSpans[openCellObjects[i].openCellSpansIndex];
        break;
      }
    }
    if (cellToPlay) {
      cellToPlay.click();
      return;
    }
    openCellObjects.forEach(obj => {
      if (obj.ownForkOpp) {
        cellToPlay = openCellSpans[obj.openCellSpansIndex];
      }
    });
    if (cellToPlay) {
      cellToPlay.click();
      return;
    }

    openCellObjects.sort((a, b) => b.pMarksWithNoOPMarks - a.pMarksWithNoOPMarks);
    const maxPMarksWithNoOPMarks = openCellObjects[0].pMarksWithNoOPMarks;
    if (maxPMarksWithNoOPMarks !== 0) {
      const possibleSquares = [];
      for (let i = 0; i < openCellObjects.length; i++) {
        if (openCellObjects[i].pMarksWithNoOPMarks === maxPMarksWithNoOPMarks) {
          possibleSquares.push(openCellObjects[i].openCellSpansIndex);
        } else {
          break;
        }
      }
      cellToPlay = openCellSpans[possibleSquares[Math.floor(possibleSquares.length * Math.random())]];
      cellToPlay.click();
      return;
    }
    openCellObjects.sort((a, b) => b.oPMarksWithNoPMarks - a.oPMarksWithNoPMarks);
    const maxOPMarksWithNoPMarks = openCellObjects[0].oPMarksWithNoPMarks;
    if (maxOPMarksWithNoPMarks !== 0) {
      const possibleSquares = [];
      for (let i = 0; i < openCellObjects.length; i++) {
        if (openCellObjects[i].oPMarksWithNoPMarks === maxOPMarksWithNoPMarks) {
          possibleSquares.push(openCellObjects[i].openCellSpansIndex);
        } else {
          break;
        }
      }
      cellToPlay = openCellSpans[possibleSquares[Math.floor(possibleSquares.length * Math.random())]];
      cellToPlay.click();
      return;
    }
    cellToPlay = openCellSpans[Math.floor(openCellSpans.length * Math.random())].parentNode;
    cellToPlay.click();
  }
}

function stopGame() {
  const allCells = document.querySelectorAll('td');
  allCells.forEach(cell => {
    cell.classList.remove('clickable');
    cell.removeEventListener('click', cellClickHandler);
  });
  const allCellSpans = document.querySelectorAll('.cellSpan');
  allCellSpans.forEach(cellSpan => {
    cellSpan.textContent = '';
  });
  document.querySelector('#winnerDiv').classList.remove('hidden');
  document.querySelector('#resumeGameDiv').classList.remove('hidden');
  document.querySelector('#stopGameDiv').classList.add('hidden');
}

function resumeGame(masterData) {
  const allCells = document.querySelectorAll('td');
  allCells.forEach(cell => {
    if (cell.childNodes[0].nodeType === Node.ELEMENT_NODE) {
      cell.classList.add('clickable');
      cell.addEventListener('click', cellClickHandler, {once:true});
    }
  });
  const otherMark = (masterData.turnCounter % 2 === 0) ? 'X' : 'O';
  const allCellSpans = document.querySelectorAll('.cellSpan');
  allCellSpans.forEach(cellSpan => {
    cellSpan.textContent = otherMark;
  });
  document.querySelector('#stopGameDiv').classList.remove('hidden');
  document.querySelector('#winnerDiv').classList.add('hidden');
  document.querySelector('#resumeGameDiv').classList.add('hidden');
}

function alwaysDoBeforeNewGame(masterData) {
  const allRows = document.querySelectorAll('tr');
  allRows.forEach(row => {
    row.remove();
  });
  document.querySelector('#announceWinner').textContent = '';
  document.querySelector('#winnerDiv').classList.add('hidden');
  document.querySelector('#resumeGameDiv').classList.add('hidden');
  masterData.dataReset();
}

function newGame(masterData, gameOn, alwaysDoBeforeNewGame) {
  alwaysDoBeforeNewGame(masterData);
  gameOn(masterData);
  if (masterData.computer === true) {
    const whoGoesFirst = Math.floor(2 * Math.random());
    if (whoGoesFirst === 0) {
      triggerComputerMove(masterData);
    }
  }
}

function resizeBoard(masterData, alwaysDoBeforeNewGame) {
  alwaysDoBeforeNewGame(masterData);
  document.querySelector('#optionsDiv').classList.remove('hidden');
}



// Event handling:

function cellClickHandler() {
  moveMade(this.parentNode.rowIndex, this.cellIndex, masterData);
  if (!this.matches(':hover') && document.querySelector('.cellSpan')) {
    masterData.computerAnimationsInProgress++;
    this.addEventListener('animationend', () => {
      masterData.computerAnimationsInProgress--;
    }, {once:true});
    this.classList.add('computerMove');
  }
  if (masterData.computer === true && document.querySelector('.cellSpan') && this.matches(':hover')) {
    triggerComputerMove(masterData);
  }
}

function onLoadListeners() {
  document.querySelector('#playHvHButton').addEventListener('click', () => {
    masterData.computer = false;
    gameOn(masterData);
  });
  document.querySelector('#playHvCButton').addEventListener('click', () => {
    masterData.computer = true;
    masterData.difficulty = (document.querySelector('#easyRadio').checked) ? 'easy' : 'hard';
    const inputQuery = gameOn(masterData);
    if (inputQuery !== 'badInput') {
      const whoGoesFirst = Math.floor(2 * Math.random());
      if (whoGoesFirst === 0) {
        triggerComputerMove(masterData);
      }
    }
  });
  document.querySelector('#newGameButton').addEventListener('click', () => {
    newGame(masterData, gameOn, alwaysDoBeforeNewGame);
  });
  document.querySelector('#optionsButton').addEventListener('click', () => {
    resizeBoard(masterData, alwaysDoBeforeNewGame);
  });
  document.querySelector('#stopGameButton').addEventListener('click', () => {
    stopGame();
  });
  document.querySelector('#resumeGameButton').addEventListener('click', () => {
    resumeGame(masterData);
  });
  document.querySelector('#warning').addEventListener('animationend', function() {
    this.classList.remove('warning'); 
  });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoadListeners);
} else {
    onLoadListeners();
}
