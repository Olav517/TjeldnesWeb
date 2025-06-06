import { useState, useCallback } from 'react';
import '../styles/hangman.css';

const words = ['TYPESCRIPT', 'REACT', 'JAVASCRIPT', 'PROGRAMMING', 'DEVELOPER', 'VITE'];

function Hangman() {
  const [word, setWord] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [remainingGuesses, setRemainingGuesses] = useState(6);

  const incorrectGuesses = Array.from(guessedLetters).filter(letter => !word.includes(letter));
  const isWinner = word.split('').every(letter => guessedLetters.has(letter));
  const isGameOver = remainingGuesses <= 0;

  const handleGuess = useCallback((letter: string) => {
    if (guessedLetters.has(letter) || isGameOver || isWinner) return;

    const newGuessedLetters = new Set(guessedLetters).add(letter);
    setGuessedLetters(newGuessedLetters);

    if (!word.includes(letter)) {
      setRemainingGuesses(prev => prev - 1);
    }
  }, [guessedLetters, isGameOver, isWinner, word]);

  const renderWord = () => {
    return word.split('').map((letter, index) => (
      <span key={index} className="letter">
        {guessedLetters.has(letter) ? letter : '_'}
      </span>
    ));
  };

  const renderKeyboard = () => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
      <button
        key={letter}
        onClick={() => handleGuess(letter)}
        disabled={guessedLetters.has(letter) || isGameOver || isWinner}
        className={`keyboard-button ${guessedLetters.has(letter) ? 'used' : ''}`}
      >
        {letter}
      </button>
    ));
  };

  const resetGame = () => {
    setWord(words[Math.floor(Math.random() * words.length)]);
    setGuessedLetters(new Set());
    setRemainingGuesses(6);
  };

  return (
    <div className="hangman-container">
      <h1>Hangman Game</h1>
      <div className="game-status">
        <p>Remaining Guesses: {remainingGuesses}</p>
        <p>Incorrect Guesses: {incorrectGuesses.join(', ')}</p>
      </div>
      <div className="word-display">{renderWord()}</div>
      <div className="keyboard">{renderKeyboard()}</div>
      {(isWinner || isGameOver) && (
        <div className="game-over">
          <h2>{isWinner ? 'Congratulations! You won!' : 'Game Over!'}</h2>
          {isGameOver && <p>The word was: {word}</p>}
          <button onClick={resetGame} className="reset-button">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default Hangman;
