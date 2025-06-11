import React, { useState, useEffect } from 'react';
import '../styles/crossword.css';

// Type definitions
interface ClueData {
  clue: string;
  answer: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
  number: number;
}

interface CrosswordPuzzleData {
  title: string;
  size: { rows: number, cols: number };
  clues: ClueData[];
}

// Sample puzzle data
const samplePuzzle: CrosswordPuzzleData = {
  title: "Simple Crossword",
  size: { rows: 10, cols: 10 },
  clues: [
    { clue: "When it comes to us all", answer: "TIME", direction: 'across', row: 0, col: 0, number: 1 },
    { clue: "Illuminating invention", answer: "LAMP", direction: 'down', row: 0, col: 0, number: 1 },
    { clue: "Computer brain", answer: "CPU", direction: 'across', row: 2, col: 2, number: 2 },
    { clue: "Place to get coffee", answer: "CAFE", direction: 'down', row: 2, col: 2, number: 2 },
    { clue: "Programming language with hooks", answer: "REACT", direction: 'across', row: 4, col: 0, number: 3 },
    { clue: "Internet search giant", answer: "GOOGLE", direction: 'across', row: 6, col: 3, number: 4 },
    { clue: "Cloud service provider", answer: "AWS", direction: 'down', row: 4, col: 4, number: 5 },
    { clue: "Version control system", answer: "GIT", direction: 'across', row: 8, col: 1, number: 6 }
  ]
};

const Crossword: React.FC = () => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [puzzle] = useState<CrosswordPuzzleData>(samplePuzzle);
  const [complete, setComplete] = useState(false);

  // Initialize the grid when component loads
  useEffect(() => {
    const { rows, cols } = puzzle.size;
    
    // Create the solution grid
    const solutionGrid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
    
    // Fill in the solution grid
    puzzle.clues.forEach(clue => {
      const { row, col, answer, direction } = clue;
      for (let i = 0; i < answer.length; i++) {
        if (direction === 'across') {
          solutionGrid[row][col + i] = answer[i];
        } else {
          solutionGrid[row + i][col] = answer[i];
        }
      }
    });
    
    setGrid(solutionGrid);
    
    // Create the user input grid (empty)
    const emptyUserGrid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
    setUserGrid(emptyUserGrid);
  }, [puzzle]);

  // Check if a cell is part of the puzzle
  const isActiveCell = (row: number, col: number): boolean => {
    return grid[row]?.[col] !== '';
  };

  // Check if a cell has a clue number
  const getCellNumber = (row: number, col: number): number | null => {
    const clue = puzzle.clues.find(c => c.row === row && c.col === col);
    return clue ? clue.number : null;
  };

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    if (!isActiveCell(row, col)) return;

    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      // Toggle direction if clicking the same cell
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }
  };

  // Handle key presses
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const { key } = event;
    const { rows, cols } = puzzle.size;

    if (/^[a-zA-Z]$/.test(key)) {
      // Update the cell with the letter
      const newUserGrid = [...userGrid];
      newUserGrid[row][col] = key.toUpperCase();
      setUserGrid(newUserGrid);
      
      // Move to next cell
      moveToNextCell();
    } else if (key === 'Backspace') {
      // Clear the current cell and move back
      const newUserGrid = [...userGrid];
      newUserGrid[row][col] = '';
      setUserGrid(newUserGrid);
      moveToPrevCell();
    } else if (key === 'ArrowRight') {
      moveToCell(row, col + 1);
    } else if (key === 'ArrowLeft') {
      moveToCell(row, col - 1);
    } else if (key === 'ArrowUp') {
      moveToCell(row - 1, col);
    } else if (key === 'ArrowDown') {
      moveToCell(row + 1, col);
    }
  };

  // Move to the next cell in the current direction
  const moveToNextCell = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const { rows, cols } = puzzle.size;
    
    if (direction === 'across') {
      let nextCol = col + 1;
      while (nextCol < cols && !isActiveCell(row, nextCol)) {
        nextCol++;
      }
      
      if (nextCol < cols) {
        setSelectedCell({ row, col: nextCol });
      }
    } else {
      let nextRow = row + 1;
      while (nextRow < rows && !isActiveCell(nextRow, col)) {
        nextRow++;
      }
      
      if (nextRow < rows) {
        setSelectedCell({ row: nextRow, col });
      }
    }
  };

  // Move to the previous cell in the current direction
  const moveToPrevCell = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    if (direction === 'across') {
      let prevCol = col - 1;
      while (prevCol >= 0 && !isActiveCell(row, prevCol)) {
        prevCol--;
      }
      
      if (prevCol >= 0) {
        setSelectedCell({ row, col: prevCol });
      }
    } else {
      let prevRow = row - 1;
      while (prevRow >= 0 && !isActiveCell(prevRow, col)) {
        prevRow--;
      }
      
      if (prevRow >= 0) {
        setSelectedCell({ row: prevRow, col });
      }
    }
  };

  // Move to a specific cell if it's active
  const moveToCell = (newRow: number, newCol: number) => {
    if (newRow >= 0 && newRow < puzzle.size.rows && 
        newCol >= 0 && newCol < puzzle.size.cols && 
        isActiveCell(newRow, newCol)) {
      setSelectedCell({ row: newRow, col: newCol });
    }
  };

  // Check if the puzzle is complete
  const checkPuzzle = () => {
    let isCorrect = true;
    
    for (let row = 0; row < puzzle.size.rows; row++) {
      for (let col = 0; col < puzzle.size.cols; col++) {
        if (grid[row][col] !== '' && userGrid[row][col] !== grid[row][col]) {
          isCorrect = false;
          break;
        }
      }
    }
    
    setComplete(isCorrect);
  };

  // Reset the puzzle
  const resetPuzzle = () => {
    const emptyUserGrid: string[][] = Array(puzzle.size.rows).fill(null).map(() => Array(puzzle.size.cols).fill(''));
    setUserGrid(emptyUserGrid);
    setComplete(false);
  };

  // Render the clues list
  const renderClues = () => {
    const acrossClues = puzzle.clues.filter(clue => clue.direction === 'across');
    const downClues = puzzle.clues.filter(clue => clue.direction === 'down');
    
    return (
      <div className="clues">
        <div className="clues-section">
          <h3>Across</h3>
          <ul>
            {acrossClues.map(clue => (
              <li key={`across-${clue.number}`}>
                <strong>{clue.number}.</strong> {clue.clue}
              </li>
            ))}
          </ul>
        </div>
        <div className="clues-section">
          <h3>Down</h3>
          <ul>
            {downClues.map(clue => (
              <li key={`down-${clue.number}`}>
                <strong>{clue.number}.</strong> {clue.clue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="crossword-page">
      <h1>Crossword Puzzle</h1>
      <h2>{puzzle.title}</h2>
      
      <div className="crossword-container">
        <div 
          className="crossword-grid" 
          tabIndex={0} 
          onKeyDown={handleKeyDown}
        >
          {grid.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid-row">
              {row.map((cell, colIndex) => {
                const isActive = isActiveCell(rowIndex, colIndex);
                const cellNumber = getCellNumber(rowIndex, colIndex);
                const isSelected = selectedCell && 
                  selectedCell.row === rowIndex && 
                  selectedCell.col === colIndex;
                
                return (
                  <div 
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`grid-cell ${isActive ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cellNumber && <div className="cell-number">{cellNumber}</div>}
                    {isActive && <div className="cell-letter">{userGrid[rowIndex]?.[colIndex] || ''}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {renderClues()}
      </div>
      
      <div className="crossword-controls">
        <button onClick={checkPuzzle}>Check Puzzle</button>
        <button onClick={resetPuzzle}>Reset</button>
      </div>
      
      {complete && (
        <div className="completion-message">
          Congratulations! You've completed the puzzle!
        </div>
      )}
    </div>
  );
};

export default Crossword;
