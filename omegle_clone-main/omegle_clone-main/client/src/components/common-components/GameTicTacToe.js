import React, { useState, useEffect } from 'react';

const emptyBoard = () => Array(9).fill(null);

const getWinner = (board) => {
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
  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const isDraw = (board) => board.every(cell => cell);

const cellStyle = (highlight) => ({
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  background: highlight ? 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)' : '#121212',
  border: '2px solid rgba(29,185,84,0.35)',
  cursor: 'pointer',
  transition: 'background 0.2s',
  color: '#fff',
  borderRadius: 12,
  boxShadow: highlight ? '0 0 12px rgba(29,185,84,0.4)' : 'none',
});

const GameTicTacToe = ({ isFirstPlayer, socket, partnerId, onGameEnd }) => {
  const mySymbol = isFirstPlayer ? 'X' : 'O';
  const oppSymbol = isFirstPlayer ? 'O' : 'X';
  const [board, setBoard] = useState(emptyBoard());
  const [currentSymbol, setCurrentSymbol] = useState('X'); // X always starts
  const [status, setStatus] = useState('playing'); // 'playing', 'win', 'lose', 'draw'
  const [winningLine, setWinningLine] = useState([]);

  // Debug info
  useEffect(() => {
    if (socket) {
      // Game state debug info
    }
  }, [socket, partnerId, isFirstPlayer, mySymbol, currentSymbol]);

  useEffect(() => {
    if (!socket) return;
    const onMove = ({ index, symbol }) => {
      setBoard(prev => {
        if (prev[index]) return prev;
        const newBoard = [...prev];
        newBoard[index] = symbol;
        return newBoard;
      });
      setCurrentSymbol(symbol === 'X' ? 'O' : 'X');
    };
    socket.on('tictactoe-move', onMove);
    return () => {
      socket.off('tictactoe-move', onMove);
    };
  }, [socket]);

  useEffect(() => {
    const winner = getWinner(board);
    if (winner) {
      setStatus(winner === mySymbol ? 'win' : 'lose');
      // Find winning line
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (let line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          setWinningLine(line);
          break;
        }
      }
    } else if (isDraw(board)) {
      setStatus('draw');
    }
  }, [board, mySymbol]);

  const handleCellClick = (idx) => {
    if (status !== 'playing' || board[idx] || currentSymbol !== mySymbol) return;
    const symbol = mySymbol;
    const newBoard = [...board];
    newBoard[idx] = symbol;
    setBoard(newBoard);
    setCurrentSymbol(oppSymbol);
    socket.emit('tictactoe-move', { to: partnerId, index: idx, symbol });
  };

  const handleRematch = () => {
    setBoard(emptyBoard());
    setCurrentSymbol('X');
    setStatus('playing');
    setWinningLine([]);
    socket.emit('tictactoe-rematch', { to: partnerId });
  };

  useEffect(() => {
    if (!socket) return;
    const onRematch = () => {
      setBoard(emptyBoard());
      setCurrentSymbol('X');
      setStatus('playing');
      setWinningLine([]);
    };
    socket.on('tictactoe-rematch', onRematch);
    return () => {
      socket.off('tictactoe-rematch', onRematch);
    };
  }, [socket]);

  let info;
  if (status === 'playing') {
    info = currentSymbol === mySymbol ? "Your turn" : "Opponent's turn";
  } else if (status === 'win') {
    info = 'You win! 🎉';
  } else if (status === 'lose') {
    info = 'You lose! 😢';
  } else {
    info = "It's a draw!";
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #121212 0%, #000000 100%)',
      borderRadius: 18,
      padding: '1.5rem 1.5rem',
      minWidth: 260,
      maxWidth: 350,
      margin: '0 auto',
      boxShadow: '0 8px 32px #000a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.8rem',
    }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
        Tic Tac Toe
      </div>
      <div style={{ fontSize: '1rem', marginBottom: 4 }}>{info}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 40px)',
        gridTemplateRows: 'repeat(3, 40px)',
        gap: 5,
        marginBottom: 8,
      }}>
        {board.map((cell, idx) => (
          <div
            key={idx}
            style={cellStyle(winningLine.includes(idx))}
            onClick={() => handleCellClick(idx)}
          >
            {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
          </div>
        ))}
      </div>
      {status !== 'playing' && (
        <button
          onClick={handleRematch}
          style={{
            padding: '0.7rem 1.5rem',
            background: 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 6,
          }}
        >
          Rematch
        </button>
      )}
      <button
        onClick={onGameEnd}
        style={{
          padding: '0.4rem 1rem',
          background: 'none',
          color: '#bbb',
          border: 'none',
          fontSize: '0.9rem',
          cursor: 'pointer',
          textDecoration: 'underline',
          opacity: 0.8,
        }}
      >
        Exit Game
      </button>
    </div>
  );
};

export default GameTicTacToe; 