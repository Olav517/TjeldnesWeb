import React, { useState, useEffect } from 'react';
import '../styles/tictactoe.css';
import { useScoreboardApi } from '../components/scoreboardApi';

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
  const [winCount, setWinCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { incrementWinCount, getWinCount, isAuthenticated } = useScoreboardApi();

  // Load win count on component mount
  useEffect(() => {
    if (isAuthenticated) {
      getWinCount()
        .then(data => setWinCount(data.wins))
        .catch(err => console.error('Failed to load win count:', err));
    }
  }, [isAuthenticated, getWinCount]);

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

  // Handle win detection and API call
  useEffect(() => {
    const winner = calculateWinner(squares);
    if (winner && isAuthenticated) {
      // Only increment for the current player (assuming X is the user)
      if (winner === 'X') {
        incrementWinCount()
          .then(data => {
            setWinCount(data.wins);
            setError(null);
          })
          .catch(err => {
            setError('Failed to update score. Please try again.');
            console.error('Error updating score:', err);
          });
      }
    }
  }, [squares, isAuthenticated, incrementWinCount]);

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
    setError(null);
  };

  return (
    <div className="tictactoe-page">
      <h1>Tic Tac Toe</h1>
      
      {/* Win count display */}
      {isAuthenticated && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h3>Your Wins: {winCount !== null ? winCount : 'Loading...'}</h3>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
      
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
        {isAuthenticated && (
          <p><strong>Note:</strong> Your wins are automatically tracked when you win as X!</p>
        )}
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