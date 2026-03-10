import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';

const boardContainerStyle = {
  background: 'linear-gradient(135deg, #121212 0%, #000000 100%)',
  borderRadius: 18,
  padding: '1rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.6rem',
  width: '100%',
  height: '100%',
  boxSizing: 'border-box'
};



// Unicode chess pieces by color and type
const PIECE_SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' },
};

function Square({
  isLight,
  isSelected,
  isHighlight,
  isCaptureTarget,
  children,
  onClick,
  size
}) {
  // green and gray squares
  const baseColor = isLight ? '#8fcf7a' : '#374151';
  const background = isSelected
    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    : baseColor;
  const outline = isHighlight
    ? '0 0 0 3px rgba(34,197,94,0.65) inset'
    : isCaptureTarget
    ? '0 0 0 3px rgba(239,68,68,0.6) inset'
    : 'none';

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.8),
        userSelect: 'none',
        background,
        boxShadow: outline,
        transition: 'box-shadow 120ms ease, transform 80ms ease',
        border: '1px solid rgba(0,0,0,0.2)'
      }}
    >
      {children}
    </div>
  );
}

function PromotionChooser({ color, onChoose }) {
  const pieces = ['q', 'r', 'b', 'n'];
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      {pieces.map((t) => (
        <button
          key={t}
          onClick={() => onChoose(t)}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.35)',
            color: '#fff',
            background: 'rgba(2,6,23,0.7)',
            cursor: 'pointer',
          }}
        >
          {PIECE_SYMBOLS[color][t]}
        </button>
      ))}
    </div>
  );
}

/**
 * GameChess
 * - Full rules enforced via chess.js
 * - Whose turn logic derived from game.turn() and player color
 * - Sync over sockets using { from, to, promotion, fen }
 */
const GameChess = ({ isFirstPlayer, socket, partnerId, onGameEnd, updateScore, gameName = 'Chess' }) => {
  const [game] = useState(() => new Chess());
  const myColor = isFirstPlayer ? 'w' : 'b'; // first player plays white
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [status, setStatus] = useState('playing'); // 'playing', 'win', 'lose', 'draw'
  const [check, setCheck] = useState(false);
  const [promotion, setPromotion] = useState(null); // { from, to, color }

  const [pendingUndo, setPendingUndo] = useState(false); // true when you need to respond
  const [sentUndo, setSentUndo] = useState(false); // true when you requested undo
  const [reaction, setReaction] = useState(null); // transient emoji
  const containerRef = useRef(null);
  const [squareSize, setSquareSize] = useState(64);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const scoreUpdatedRef = useRef(false);

  // Responsive mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist minimal state during a match
  useEffect(() => {
    try {
      const key = 'chessState';
      const colorKey = 'chessColor';
      localStorage.setItem(key, game.fen());
      localStorage.setItem(colorKey, myColor);
    } catch (_) {}
  }, [game, game.fen(), myColor]);

  // Clear cache when match ends
  const clearCache = () => {
    try {
      localStorage.removeItem('chessState');
      localStorage.removeItem('chessColor');
    } catch (_) {}
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onChessMove = ({ move, fen }) => {
      try {
        const result = game.move({ from: move?.from, to: move?.to, promotion: move?.promotion || undefined });
        if (!result) {
          // Fallback: if fen provided, load that to resync
          if (fen) {
            game.load(fen);
          }
        }
      } catch {
        if (fen) {
          try { game.load(fen); } catch {}
        }
      }
      setSelectedSquare(null);
      setLegalTargets([]);

      updateStatus();
    };
    const onChessRematch = () => {
      game.reset();
      setSelectedSquare(null);
      setLegalTargets([]);
      setStatus('playing');
      setCheck(false);
      setPromotion(null);

    };
    const onUndoRequest = () => {
      setPendingUndo(true);
    };
    const onUndoApply = ({ fen }) => {
      try { game.load(fen); } catch {}
      updateStatus();
      setPendingUndo(false);
      setSentUndo(false);
    };
    const onUndoDecline = () => {
      setPendingUndo(false);
      setSentUndo(false);
    };
    const onUndoCancel = () => {
      setPendingUndo(false);
      setSentUndo(false);
    };
    const onResign = () => {
      // Opponent resigned, you win
      setStatus('win');
      clearCache();
    };
    const onReact = ({ emoji }) => {
      setReaction(emoji);
      setTimeout(() => setReaction(null), 1200);
    };
    socket.on('chess-move', onChessMove);
    socket.on('chess-rematch', onChessRematch);
    socket.on('chess-undo-request', onUndoRequest);
    socket.on('chess-undo-apply', onUndoApply);
    socket.on('chess-undo-decline', onUndoDecline);
    socket.on('chess-resign', onResign);
    socket.on('chess-undo-cancel', onUndoCancel);
    socket.on('chess-react', onReact);
    return () => {
      socket.off('chess-move', onChessMove);
      socket.off('chess-rematch', onChessRematch);
      socket.off('chess-undo-request', onUndoRequest);
      socket.off('chess-undo-apply', onUndoApply);
      socket.off('chess-undo-decline', onUndoDecline);
      socket.off('chess-resign', onResign);
      socket.off('chess-react', onReact);
      socket.off('chess-undo-cancel', onUndoCancel);
    };
  }, [socket, game]);

  const isMyTurn = useMemo(() => game.turn() === myColor, [game, myColor, game.fen()]);

  const updateStatus = () => {
    setCheck(game.inCheck());
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === 'w' ? 'b' : 'w';
      const outcome = winnerColor === myColor ? 'win' : 'lose';
      setStatus(outcome);
      if (!scoreUpdatedRef.current && socket && partnerId && (outcome === 'win' || outcome === 'lose')) {
        scoreUpdatedRef.current = true;
        const winnerLabel = outcome === 'win' ? 'you' : 'partner';
        socket.emit('gameScore', { to: partnerId, winner: winnerLabel, game: 'chess' });
        if (typeof updateScore === 'function') {
          updateScore(winnerLabel, gameName || 'Chess');
        }
      }
      clearCache();
    } else if (
      game.isDraw() ||
      game.isStalemate() ||
      game.isThreefoldRepetition() ||
      game.isInsufficientMaterial()
    ) {
      setStatus('draw');
      clearCache();
    } else {
      setStatus('playing');
    }
  };

  // Resize handling to fit container like Watch Along
  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect || element.getBoundingClientRect();
      const pad = 32; // padding around board and labels
      const usable = Math.min(rect.width, rect.height) - pad;
      const calc = Math.max(48, Math.min(96, Math.floor(usable / 8)));
      setSquareSize(calc);
    });
    ro.observe(element);
    return () => ro.disconnect();
  }, []);

  const coords = useMemo(() => {
    // Build an array of square identifiers in render order based on orientation
    // White at bottom: ranks 8->1 top-to-bottom, files a->h left-to-right
    // Black at bottom: ranks 1->8 top-to-bottom, files h->a left-to-right
    const filesWhite = ['a','b','c','d','e','f','g','h'];
    const ranksWhite = ['8','7','6','5','4','3','2','1'];
    const filesBlack = ['h','g','f','e','d','c','b','a'];
    const ranksBlack = ['1','2','3','4','5','6','7','8'];
    const files = myColor === 'w' ? filesWhite : filesBlack;
    const ranks = myColor === 'w' ? ranksWhite : ranksBlack;
    const list = [];
    for (const r of ranks) {
      for (const f of files) list.push(`${f}${r}`);
    }
    return list;
  }, [myColor]);

  const onSquareClick = (square) => {
    if (status !== 'playing') return;
    if (!isMyTurn) return;

    // If in promotion selection, ignore clicks except choosing promotion
    if (promotion) return;

    const piece = game.get(square);
    const isOwnPiece = piece && piece.color === myColor;

    // First click: select your own piece
    if (selectedSquare === null) {
      if (!isOwnPiece) return;
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalTargets(moves.map((m) => m.to));
      return;
    }

    // Automatic switch selection: if already have a piece selected, click another of your own pieces
    // to switch the selection immediately.
    if (isOwnPiece && square !== selectedSquare) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalTargets(moves.map((m) => m.to));
      return;
    }

    // Deselect if clicking the same square
    if (square === selectedSquare) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    // Attempt the move
    const tentative = { from: selectedSquare, to: square };
    const verboseMoves = game.moves({ square: selectedSquare, verbose: true });
    const match = verboseMoves.find((m) => m.to === square);
    
    if (!match) {
      // If clicking an empty square or opponent piece that isn't a legal move, just deselect
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    // Handle promotion if applicable
    if (match.flags.includes('p')) {
      setPromotion({ from: selectedSquare, to: square, color: myColor });
      return;
    }

    const result = game.move(tentative);
    if (!result) return; // invalid (chess.js already handles check logic, but we re-verify in updateStatus)

    emitAndPostMove(tentative);
  };

  const emitAndPostMove = ({ from, to, promotion: promo }) => {
    setSelectedSquare(null);
    setLegalTargets([]);

    updateStatus();
    if (socket && partnerId) {
      socket.emit('chess-move', { to: partnerId, move: { from, to, promotion: promo || null }, fen: game.fen() });
    }
  };

  const handleChoosePromotion = (pieceType) => {
    if (!promotion) return;
    const moveObj = { from: promotion.from, to: promotion.to, promotion: pieceType };
    const result = game.move(moveObj);
    if (!result) return;
    setPromotion(null);
    emitAndPostMove(moveObj);
  };

  const handleRematch = () => {
    game.reset();
    setSelectedSquare(null);
    setLegalTargets([]);
    setStatus('playing');
    setCheck(false);
    setPromotion(null);
    scoreUpdatedRef.current = false;

    if (socket && partnerId) socket.emit('chess-rematch', { to: partnerId });
  };

  // Undo request/response handlers
  const requestUndo = () => {
    if (!socket || !partnerId || sentUndo) return;
    socket.emit('chess-undo-request', { to: partnerId });
    setSentUndo(true);
  };
  const acceptUndo = () => {
    // Go back one move if possible and send FEN
    try {
      game.undo();
      const fen = game.fen();
      socket.emit('chess-undo-apply', { to: partnerId, fen });
      setPendingUndo(false);
      updateStatus();
    } catch (_) {
      setPendingUndo(false);
    }
  };
  const declineUndo = () => {
    socket.emit('chess-undo-decline', { to: partnerId });
    setPendingUndo(false);
  };

  const cancelUndo = () => {
    socket.emit('chess-undo-cancel', { to: partnerId });
    setSentUndo(false);
  };

  const resign = () => {
    setStatus('lose');
    clearCache();
    socket.emit('chess-resign', { to: partnerId });
    if (!scoreUpdatedRef.current && socket && partnerId) {
      scoreUpdatedRef.current = true;
      const winnerLabel = 'partner';
      socket.emit('gameScore', { to: partnerId, winner: winnerLabel, game: 'chess' });
      if (typeof updateScore === 'function') {
        updateScore(winnerLabel, gameName || 'Chess');
      }
    }
  };

  const sendReaction = (emoji) => {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 1200);
    socket.emit('chess-react', { to: partnerId, emoji });
  };

  const renderBoard = () => {
    const borderSize = Math.max(4, Math.round(squareSize / 10));
    const fontSize = Math.round(squareSize * 0.8);
    return (
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(8, ${squareSize}px)`, gridTemplateRows: `repeat(8, ${squareSize}px)`, gap: 0, border: `${borderSize}px solid #0b1220`, borderRadius: 12 }}>
        {coords.map((sq, idx) => {
          const light = ((Math.floor(idx / 8) + (idx % 8)) % 2) === 0;
          const piece = game.get(sq);
          const isSel = selectedSquare === sq;
          const isHL = legalTargets.includes(sq);
          const isCap = isHL && !!piece && piece.color !== myColor;
          return (
            <Square
              key={sq}
              isLight={light}
              isSelected={isSel}
              isHighlight={isHL && !isCap}
              isCaptureTarget={isCap}
              onClick={() => onSquareClick(sq)}
              size={squareSize}
            >
              {piece ? (
                <span style={{
                  color: piece.color === 'w' ? '#ffffff' : '#000000',
                  textShadow: piece.color === 'w' ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 1px rgba(255,255,255,0.12)',
                  fontSize
                }}>
                  {PIECE_SYMBOLS[piece.color][piece.type]}
                </span>
              ) : ''}
            </Square>
          );
        })}
        {reaction && (
          <div style={{ position: 'absolute', right: -Math.max(40, squareSize * 0.6), top: 8, fontSize: Math.round(squareSize * 0.9) }}>{reaction}</div>
        )}
      </div>
    );
  };

  let info;
  if (status === 'playing') {
    info = isMyTurn ? 'Your turn' : "Opponent's turn";
    if (check) info += ' — Check!';
  } else if (status === 'win') {
    info = 'Checkmate — You win! 🎉';
  } else if (status === 'lose') {
    info = 'Checkmate — You lose! 😢';
  } else {
    info = "Game drawn";
  }

  return (
    <div ref={containerRef} style={boardContainerStyle}>
      <button
        onClick={() => { clearCache(); onGameEnd && onGameEnd(); }}
        title="Exit"
        style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          padding: '0.35rem 0.7rem', 
          borderRadius: 8, 
          border: '1px solid rgba(255,255,255,0.15)', 
          background: 'rgba(0,0,0,0.7)', 
          color: '#fff', 
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        Exit
      </button>
      <div style={{ fontSize: '0.95rem', color: '#B3B3B3', minHeight: 20, textAlign: 'center' }}>{info}</div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: isMobile ? 20 : 12,
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {renderBoard()}
        </div>
        
        {/* controls wrapper */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 10,
          width: isMobile ? 'min(400px, 90vw)' : 'auto',
          alignItems: 'stretch'
        }}>
          <button onClick={() => { clearCache(); onGameEnd && onGameEnd(); }} style={{ padding: '0.7rem 1.1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(2,6,23,0.7)', color: '#fff', cursor: 'pointer', fontSize: '0.95rem' }}>Exit</button>
          <button onClick={requestUndo} disabled={sentUndo || status !== 'playing'} style={{ padding: '0.7rem 1.1rem', borderRadius: 12, border: '1px solid rgba(29,185,84,0.35)', background: sentUndo ? 'rgba(29,185,84,0.08)' : 'rgba(29,185,84,0.15)', color: '#1DB954', cursor: sentUndo ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>Revert 1 move</button>
          {sentUndo && (
            <button onClick={cancelUndo} style={{ padding: '0.55rem 0.9rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(2,6,23,0.6)', color: '#e5e7eb', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel Request</button>
          )}
          <button onClick={resign} style={{ padding: '0.7rem 1.1rem', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem' }}>Accept Defeat</button>
          {status !== 'playing' && (
            <button onClick={handleRematch} style={{ padding: '0.7rem 1.1rem', borderRadius: 12, border: '1px solid rgba(29,185,84,0.45)', background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 8px 24px rgba(29,185,84,0.25)' }}>Rematch</button>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {['👍','👏','🔥','😮','😂','❤️'].map(e => (
              <button key={e} onClick={() => sendReaction(e)} style={{ padding: '0.45rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(2,6,23,0.7)', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>{e}</button>
            ))}
          </div>
          {pendingUndo && (
            <div style={{ marginTop: 6, padding: '0.6rem 0.7rem', borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.65)', color: '#e5e7eb', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.92rem' }}>Opponent requests to revert last move.</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={acceptUndo} style={{ padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(16,185,129,0.2)', color: '#22c55e', cursor: 'pointer' }}>Accept</button>
                <button onClick={declineUndo} style={{ padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>Decline</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {promotion && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginTop: 6, marginBottom: 4, color: '#e5e7eb', fontSize: '0.9rem' }}>Choose promotion</div>
          <PromotionChooser color={promotion.color} onChoose={handleChoosePromotion} />
        </div>
      )}

      {/* pendingUndo prompt moved into side controls */}
    </div>
  );
};

export default GameChess;


