import React, { useState } from 'react';
import '../styles/tictactoe.css';

type SquareValue = 'X' | 'O' | null;

interface SquareProps {
  value: SquareValue;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ value, onClick }) => {
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  );
};

const TicTacToe: React.FC = () => {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  const handleClick = (i: number) => {
    const squaresCopy = [...squares];
    
    // Return early if there's a winner or the square is already filled
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    
    // Update the board
    squaresCopy[i] = xIsNext ? 'X' : 'O';
    setSquares(squaresCopy);
    setXIsNext(!xIsNext);
  };

  const renderSquare = (i: number) => {
    return <Square value={squares[i]} onClick={() => handleClick(i)} />;
  };

  const winner = calculateWinner(squares);
  const isBoardFull = squares.every(square => square !== null);
  
  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isBoardFull) {
    status = 'Game ended in a draw!';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="tictactoe-page">
      <h1>Tic Tac Toe</h1>
      <div className="game">
        <div className="game-info">
          <div className="status">{status}</div>
          <button className="reset-button" onClick={resetGame}>
            Reset Game
          </button>
        </div>
        <div className="game-board">
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>
      </div>
      <div className="game-instructions">
        <h2>How to Play</h2>
        <p>1. Players take turns placing their mark (X or O) on the board.</p>
        <p>2. The first player to get three marks in a row (horizontally, vertically, or diagonally) wins.</p>
        <p>3. If all squares are filled and no player has won, the game is a draw.</p>
      </div>
    </div>
  );
};

// Helper function to determine winner
function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  
  return null;
}

export default TicTacToe;