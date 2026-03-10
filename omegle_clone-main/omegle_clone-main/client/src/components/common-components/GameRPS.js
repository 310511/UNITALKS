import React, { useState, useEffect, useRef } from 'react';

const choices = [
  { value: 'rock', label: '✊ Rock', emoji: '✊' },
  { value: 'paper', label: '✋ Paper', emoji: '✋' },
  { value: 'scissors', label: '✌️ Scissors', emoji: '✌️' },
];

const getResult = (my, opp) => {
  if (my === opp) return 'draw';
  if (
    (my === 'rock' && opp === 'scissors') ||
    (my === 'scissors' && opp === 'paper') ||
    (my === 'paper' && opp === 'rock')
  ) return 'win';
  return 'lose';
};

const GameRPS = ({ isFirstPlayer, socket, partnerId, onGameEnd }) => {
  const [myChoice, setMyChoice] = useState(null);
  const [oppChoice, setOppChoice] = useState(null);
  const [result, setResult] = useState(null);


  const [showingResult, setShowingResult] = useState(false);
  const [shuffleEmoji, setShuffleEmoji] = useState('✊');
  const [moveConfirmed, setMoveConfirmed] = useState(false);
  const shuffleInterval = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const onRpsMove = ({ choice }) => {
      // Only set opponent's choice when both players have made their moves
      setOppChoice(choice);
      setMoveConfirmed(false); // Reset move confirmation when opponent's move is received

    };
    const onRpsMoveConfirmed = () => {
      setMoveConfirmed(true);
    };
    const onRpsRematch = () => {
      setMyChoice(null);
      setOppChoice(null);
      setResult(null);


      setShowingResult(false);
      setMoveConfirmed(false);
    };
    socket.on('rps-move', onRpsMove);
    socket.on('rps-move-confirmed', onRpsMoveConfirmed);
    socket.on('rps-rematch', onRpsRematch);
    return () => {
      socket.off('rps-move', onRpsMove);
      socket.off('rps-move-confirmed', onRpsMoveConfirmed);
      socket.off('rps-rematch', onRpsRematch);
    };
  }, [socket]);

  useEffect(() => {
    if (myChoice && oppChoice && !showingResult && !result) {
      setShowingResult(true);
      let i = 0;
      shuffleInterval.current = setInterval(() => {
        setShuffleEmoji(choices[i % 3].emoji);
        i++;
      }, 200); // slower shuffle
      setTimeout(() => {
        clearInterval(shuffleInterval.current);
        setShowingResult(false);
        setResult(getResult(myChoice, oppChoice));
      }, 3000); // 3 seconds
    }
    return () => {
      if (shuffleInterval.current) {
        clearInterval(shuffleInterval.current);
      }
    };
  }, [myChoice, oppChoice, showingResult, result]);

  const handleChoice = (choice) => {
    if (myChoice || result) return;
    setMyChoice(choice);
    socket.emit('rps-move', { to: partnerId, choice });
  };

  const handleRematch = () => {
    setMyChoice(null);
    setOppChoice(null);
    setResult(null);


    setShowingResult(false);
    socket.emit('rps-rematch', { to: partnerId });
  };

  let info;
  if (!myChoice) {
    info = 'Choose your move!';
  } else if (!oppChoice) {
    info = moveConfirmed ? 'Move sent! Waiting for opponent...' : 'Waiting for opponent to make their move...';
  } else if (showingResult) {
    info = 'Revealing...';
  } else if (result === 'win') {
    info = 'You win! 🎉';
  } else if (result === 'lose') {
    info = 'You lose! 😢';
  } else if (result === 'draw') {
    info = "It's a draw!";
  } else if (oppChoice && !showingResult && !result) {
    info = 'Both moves made! Revealing...';
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #121212 0%, #000000 100%)',
      borderRadius: 18,
      padding: '1rem 1rem',
      minWidth: 260,
      maxWidth: 350,
      margin: '0 auto',
      boxShadow: '0 8px 32px #000a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>
        Stone Paper Scissors
      </div>
      <div style={{ fontSize: '1rem', marginBottom: 2 }}>{info}</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {choices.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleChoice(value)}
            disabled={!!myChoice || !!result || showingResult}
            style={{
              padding: '0.7rem 0.7rem',
              background: myChoice === value ? 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)' : '#121212',
              color: '#fff',
              border: '2px solid rgba(29,185,84,0.35)',
              borderRadius: 10,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: myChoice || result || showingResult ? 'not-allowed' : 'pointer',
              boxShadow: myChoice === value ? '0 0 12px rgba(29,185,84,0.4)' : 'none',
              transition: 'background 0.2s',
              minWidth: 50,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {myChoice && (
        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>
          Your move: <b>{choices.find(c => c.value === myChoice).label}</b>
        </div>
      )}
      {oppChoice && (result || showingResult) && (
        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>
          Opponent's move: <b>{choices.find(c => c.value === oppChoice).label}</b>
        </div>
      )}
      {showingResult && (
        <div style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{shuffleEmoji}</div>
      )}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {result && !showingResult && (
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
            }}
          >
            Rematch
          </button>
        )}
        <button
          onClick={onGameEnd}
          style={{
            padding: '0.5rem 1.2rem',
            background: 'none',
            color: '#bbb',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            opacity: 0.8,
          }}
        >
          Exit Game
        </button>
      </div>
    </div>
  );
};

export default GameRPS; 