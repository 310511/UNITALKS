import React, { useEffect, useState } from 'react';

const panel = {
  background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(18,18,18,0.92) 100%)',
  borderRadius: 18,
  padding: '1.4rem',
  boxShadow: '0 14px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  minHeight: '100%',
  height: 'auto',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative'
};

const truthPrompts = [
  'What is a childhood nickname you had?',
  'What’s the most embarrassing thing you’ve done on camera?',
  'If you could undo one decision, what would it be?',
  'What’s a secret talent no one knows?',
  'What’s your funniest fail at school?',
  'Who is your oldest friend and why?',
  'What’s a weird food combo you love?',
  'What’s the last thing you binge-watched?',
  'What’s a fear you overcame?',
  'What’s your go-to karaoke song?'
];

const darePrompts = [
  'Do your best animal impression for 10 seconds',
  'Speak in a movie trailer voice for 30 seconds',
  'Balance a book on your head and walk 5 steps',
  'Mime brushing teeth dramatically for 20 seconds',
  'Show a random object and make up a jingle about it',
  'Hold a plank for 15 seconds (on cam)',
  'Make a heart with your hands and freeze for 10 seconds',
  'Do 5 air squats while smiling at the camera',
  'Pretend to be a news anchor for 20 seconds',
  'Spell your name backwards out loud'
];

const messages = {
  truth: {
    success: [
      "✅ Truth verified!",
      "Looks honest 👀",
      "Partner confirms the truth."
    ],
    failure: [
      "🤨 That doesn't sound true!",
      "Partner says that's not honest!",
      "Caught hiding the truth 😏"
    ]
  },
  dare: {
    success: [
      "🔥 Dare completed!",
      "Nice! That dare was done.",
      "Partner confirms the dare is completed."
    ],
    failure: [
      "😏 Dare not completed!",
      "Looks like someone chickened out!",
      "Partner says the dare wasn't done."
    ]
  }
};



function Reel({ items, spinning, selectedIndex }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!spinning) return;
    let raf;
    let y = 0;
    const speed = 24; // px per tick
    const tick = () => {
      y = (y + speed) % (items.length * 40);
      setOffset(y);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning, items.length]);
  const renderList = () => (
    <div style={{ position: 'absolute', left: 0, right: 0 }}>
      {items.concat(items).map((t, i) => (
        <div key={i} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', fontSize: '1.05rem' }}>{t}</div>
      ))}
    </div>
  );
  const translateY = spinning ? -offset : -(selectedIndex ?? 0) * 40;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${translateY}px)`, transition: spinning ? 'none' : 'transform 0.6s ease-out' }}>
        {renderList()}
      </div>
      {/* top and bottom gradient masks */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(180deg, rgba(2,6,23,0.8), rgba(2,6,23,0))' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(0deg, rgba(2,6,23,0.8), rgba(2,6,23,0))' }} />
    </div>
  );
}

function Bottle({ angle, spinning }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 60,
      height: 160,
      transformOrigin: 'center center',
      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      transition: spinning ? 'transform 3.5s cubic-bezier(0.12, 0.78, 0.17, 1)' : 'none',
      zIndex: 10,
      pointerEvents: 'none'
    }}>
      <svg width="100%" height="100%" viewBox="0 0 60 160">
        {/* Bottle Body */}
        <path d="M10,40 Q10,30 20,30 L40,30 Q50,30 50,40 L50,140 Q50,155 30,155 Q10,155 10,140 Z" fill="#2d5a27" stroke="#1b3617" strokeWidth="2" />
        {/* Bottle Neck */}
        <rect x="22" y="8" width="16" height="22" rx="3" fill="#2d5a27" stroke="#1b3617" strokeWidth="2" />
        {/* Bottle Cap */}
        <rect x="20" y="2" width="20" height="8" rx="2" fill="#d1d5db" />
        {/* Label */}
        <rect x="15" y="70" width="30" height="40" rx="4" fill="rgba(255,255,255,0.8)" />
        <text x="30" y="95" fontSize="8" textAnchor="middle" fill="#1b3617" fontWeight="bold" fontFamily="sans-serif">UNI</text>
        {/* Gloss/Reflections */}
        <rect x="16" y="40" width="4" height="90" rx="2" fill="rgba(255,255,255,0.15)" />
        <rect x="42" y="40" width="2" height="90" rx="1" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  );
}

const GameTruthOrDare = ({ socket, partnerId, onGameEnd }) => {
  const myId = socket?.id;
  const [chooserId, setChooserId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [phase, setPhase] = useState('bottle'); // bottle | choose-type | selecting | verify
  const [choiceType, setChoiceType] = useState(null); // 'truth' | 'dare'
  const [result, setResult] = useState(null);
  const [bottleAngle, setBottleAngle] = useState(0);
  const [bottleSpinning, setBottleSpinning] = useState(false);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [toast, setToast] = useState({ visible: false, text: '', type: '' });

  useEffect(() => {
    if (!socket) return;
    const onTarget = ({ chooserId: c, targetId: t }) => {
      setChooserId(c);
      setTargetId(t);
      setPhase('choose-type');
    };
    const onChoice = ({ chooserId: c, targetId: t, choiceType: type }) => {
      setChooserId(c);
      setTargetId(t);
      setChoiceType(type);
      setPhase('selecting');
    };
    const onResult = ({ index, text }) => {
      setResult({ index, text });
      setPhase('verify');
    };
    const onVerify = ({ ok }) => {
      // Determine message based on choiceType
      if (choiceType && messages[choiceType]) {
        const pool = ok ? messages[choiceType].success : messages[choiceType].failure;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        setToast({ visible: true, text: msg, type: ok ? 'success' : 'failure' });
      }

      // Delay the transition back to bottle phase to show the toast
      setTimeout(() => {
        setToast({ visible: false, text: '', type: '' });
        setChooserId(null);
        setTargetId(null);
        setChoiceType(null);
        setResult(null);
        setPhase('bottle');
      }, 3000);
    };
    const onReset = ({ nextChooserId }) => {
      setChooserId(null);
      setTargetId(null);
      setChoiceType(null);
      setResult(null);
      setPhase('bottle');
    };
    socket.on('tod-target', onTarget);
    socket.on('tod-choice', onChoice);
    socket.on('tod-result', onResult);
    socket.on('tod-verify', onVerify);
    socket.on('tod-reset', onReset);
    return () => {
      socket.off('tod-target', onTarget);
      socket.off('tod-choice', onChoice);
      socket.off('tod-result', onResult);
      socket.off('tod-verify', onVerify);
      socket.off('tod-reset', onReset);
    };
  }, [socket, chooserId, myId, partnerId]);

  const isMyTurn = chooserId === myId;

  // Bottle spin: randomly picks you or partner to be chooser/target
  const spinBottle = () => {
    if (bottleSpinning) return;
    setBottleSpinning(true);
    const pickMe = Math.random() < 0.5;
    const target = pickMe ? myId : partnerId;
    const targetAngle = pickMe ? 0 : 180; // 0° points to top (You), 180° to bottom (Partner)
    const finalAngle = 360 * (6 + Math.floor(Math.random()*3)) + targetAngle + (Math.random() * 30 - 15);
    setBottleAngle(prev => prev + finalAngle);
    setTimeout(() => {
      setChooserId(target);
      setTargetId(target);
      setPhase('choose-type');
      setBottleSpinning(false);
      socket.emit('tod-target', { to: partnerId, chooserId: target, targetId: target });
    }, 3500);
  };
  const chooseType = (type) => {
    setChoiceType(type);
    setPhase('selecting');
    socket.emit('tod-choice', { to: partnerId, chooserId, targetId, choiceType: type });
  };

  // Slot-machine style selection (single reel)
  const startSlotSpin = () => {
    if (phase !== 'selecting' || slotSpinning) return;
    const items = choiceType === 'truth' ? truthPrompts : darePrompts;
    const targetIndex = Math.floor(Math.random() * items.length);
    setSlotSpinning(true);
    // Simulate spin time then finalize
    setTimeout(() => {
      setResult({ index: targetIndex, text: items[targetIndex] });
      setSlotSpinning(false);
      setPhase('verify');
      socket.emit('tod-result', { to: partnerId, index: targetIndex, text: items[targetIndex] });
    }, 2500);
  };

  const verify = (ok) => {
    socket.emit('tod-verify', { to: partnerId, ok });
    
    // Local feedback
    if (choiceType && messages[choiceType]) {
        const pool = ok ? messages[choiceType].success : messages[choiceType].failure;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        setToast({ visible: true, text: msg, type: ok ? 'success' : 'failure' });
    }

    // Delay reset logic to show toast
    setTimeout(() => {
        setToast({ visible: false, text: '', type: '' });
        const nextChooser = chooserId === myId ? partnerId : myId;
        setChooserId(nextChooser);
        setTargetId(null);
        setChoiceType(null);
        setResult(null);
        setPhase('choose-target');
        // Actually the onVerify logic handles phase transitions usually, 
        // but here we manually sync for the chooser too if needed.
        // But looking at the existing code, it seems verify(ok) was doing a manual state reset.
        setPhase('bottle'); // Reset to start
    }, 3000);
  };

  return (
    <div style={panel}>
      {/* Exit button top-right */}
      <button
        onClick={() => { onGameEnd && onGameEnd(); }}
        title="Exit"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '0.45rem 0.8rem',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'linear-gradient(180deg, rgba(31,41,55,0.9), rgba(17,24,39,0.9))',
          color: '#e5e7eb',
          cursor: 'pointer',
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          zIndex: 100
        }}
      >
        Exit
      </button>
      {phase === 'bottle' && (
        <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Instruction text positioned below mic/video buttons and above spinner box */}
          <div style={{ 
            fontSize: 'min(1.1rem, 4.2vw)', 
            marginBottom: '1rem', 
            marginTop: '0.5rem',
            letterSpacing: 0.3, 
            width: '100%', 
            fontWeight: 600,
            color: '#1DB954',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Spin the bottle to choose who goes
          </div>

          <div style={{ 
            position: 'relative', 
            width: 'min(380px, 90vw)', 
            height: 'min(380px, 90vw)', 
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '24px',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(29, 185, 84, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* metallic rim */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(148,163,184,0.15) 0%, rgba(31,41,55,0.4) 60%, rgba(2,6,23,0.8) 100%)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.3)' }} />
              
              {/* top half (You) */}
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', background: 'linear-gradient(180deg, rgba(29,185,84,0.25) 0%, rgba(29,185,84,0.1) 100%)' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: 'linear-gradient(0deg, rgba(244,63,94,0.25) 0%, rgba(244,114,182,0.1) 100%)' }} />
              </div>

              <div style={{ position: 'absolute', top: 25, left: '50%', transform: 'translateX(-50%)', color: '#bbf7d0', fontSize: 13, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px' }}>YOU</div>
              <div style={{ position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)', color: '#fecdd3', fontSize: 13, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px' }}>PARTNER</div>
              
              {/* center marker point */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 12, height: 12, borderRadius: '50%', background: '#1DB954', transform: 'translate(-50%, -50%)', zIndex: 15, boxShadow: '0 0 10px rgba(29, 185, 84, 0.5)' }} />

              {/* Realistic Bottle component */}
              <Bottle angle={bottleAngle} spinning={bottleSpinning} />
            </div>
          </div>

          <button 
            onClick={spinBottle} 
            disabled={bottleSpinning} 
            style={{ 
              padding: '0.9rem 2rem', 
              borderRadius: 14, 
              border: '1px solid rgba(29,185,84,0.4)', 
              background: bottleSpinning ? 'rgba(29,185,84,0.1)' : 'linear-gradient(135deg, rgba(29,185,84,0.3), rgba(25,166,76,0.25))', 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: '1rem',
              letterSpacing: '0.5px',
              cursor: bottleSpinning ? 'not-allowed' : 'pointer', 
              boxShadow: '0 10px 25px rgba(29,185,84,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            {bottleSpinning ? 'Spinning...' : 'Spin Bottle'}
          </button>
        </div>
      )}

      {phase === 'choose-type' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{isMyTurn ? 'Choose Truth or Dare' : 'Opponent is choosing Truth or Dare...'}</div>
          {isMyTurn && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => chooseType('truth')} style={{ padding: '0.7rem 1.2rem', borderRadius: 12, border: '1px solid rgba(29,185,84,0.4)', background: 'rgba(29,185,84,0.18)', color: '#dcfce7', fontWeight: 700 }}>Truth</button>
              <button onClick={() => chooseType('dare')} style={{ padding: '0.7rem 1.2rem', borderRadius: 12, border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.2)', color: '#fecaca', fontWeight: 700 }}>Dare</button>
            </div>
          )}
        </div>
      )}

      {phase === 'selecting' && (
        <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: 12, letterSpacing: 0.3, width: '100%' }}>{choiceType === 'truth' ? 'Truths' : 'Dares'}</div>
          {/* Slot machine frame */}
          <div style={{ position: 'relative', width: 'min(620px, 95vw)', height: 180, margin: '0', borderRadius: 16, background: 'linear-gradient(180deg, #1f2937, #0b1220)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
            {/* viewport window */}
            <div style={{ position: 'absolute', left: 20, right: 20, top: 30, bottom: 30, borderRadius: 10, overflow: 'hidden', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <Reel items={choiceType === 'truth' ? truthPrompts : darePrompts} spinning={slotSpinning} selectedIndex={result?.index} />
              {/* center guide */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'linear-gradient(90deg, rgba(29,185,84,0.5), rgba(29,185,84,0.5))', boxShadow: '0 0 8px rgba(29,185,84,0.5)' }} />
            </div>
          </div>
          {isMyTurn ? (
            <button onClick={startSlotSpin} disabled={slotSpinning} style={{ marginTop: 14, padding: '0.85rem 1.6rem', borderRadius: 12, border: '1px solid rgba(234,179,8,0.4)', background: slotSpinning ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.15))' : 'linear-gradient(135deg, rgba(234,179,8,0.35), rgba(202,138,4,0.3))', color: '#fef08a', fontWeight: 800, letterSpacing: 0.4, cursor: slotSpinning ? 'not-allowed' : 'pointer', boxShadow: '0 12px 28px rgba(234,179,8,0.25)' }}>
              {slotSpinning ? 'Selecting...' : 'Pull Lever'}
            </button>
          ) : (
            <div style={{ marginTop: 14, color: '#B3B3B3' }}>Opponent is selecting...</div>
          )}
        </div>
      )}

      {phase === 'verify' && result && (
        <div style={{ textAlign: 'center', maxWidth: 720 }}>
          <div style={{ fontSize: '1.15rem', color: '#B3B3B3', marginBottom: 12, letterSpacing: 0.3 }}>{choiceType === 'truth' ? 'Truth' : 'Dare'} for {targetId === myId ? 'You' : 'Partner'}</div>
          <div style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.8), rgba(3,7,18,0.85))', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 14, padding: '1.1rem 1.2rem', marginBottom: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.04)', fontSize: '1.05rem' }}>
            {result.text}
          </div>
          {targetId !== myId ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => verify(true)} 
                disabled={toast.visible}
                style={{ padding: '0.8rem 1.4rem', borderRadius: 12, border: '1px solid rgba(34,197,94,0.4)', background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.28))', color: '#bbf7d0', fontWeight: 700, boxShadow: '0 10px 24px rgba(16,185,129,0.25)', cursor: toast.visible ? 'not-allowed' : 'pointer', opacity: toast.visible ? 0.6 : 1 }}>Verified ✅</button>
              <button 
                onClick={() => verify(false)} 
                disabled={toast.visible}
                style={{ padding: '0.8rem 1.4rem', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)', background: 'linear-gradient(135deg, rgba(239,68,68,0.28), rgba(185,28,28,0.26))', color: '#fecaca', fontWeight: 700, boxShadow: '0 10px 24px rgba(239,68,68,0.25)', cursor: toast.visible ? 'not-allowed' : 'pointer', opacity: toast.visible ? 0.6 : 1 }}>Not done ❌</button>
            </div>
          ) : (
            <div style={{ color: '#a5b4fc', fontSize: '1.05rem', fontWeight: 500 }}>
              {toast.visible ? toast.text : 'Waiting for partner to verify...'}
            </div>
          )}

          {/* Toast Notification for both users */}
          {toast.visible && targetId !== myId && (
            <div style={{
              marginTop: 20,
              padding: '10px 20px',
              borderRadius: '12px',
              background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: toast.type === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: toast.type === 'success' ? '#bbf7d0' : '#fecaca',
              fontWeight: 600,
              fontSize: '1rem',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {toast.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameTruthOrDare;


