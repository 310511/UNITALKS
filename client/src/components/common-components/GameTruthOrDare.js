import React, { useEffect, useMemo, useRef, useState } from 'react';

const panel = {
  background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(18,18,18,0.92) 100%)',
  borderRadius: 18,
  padding: 12,
  boxShadow: '0 14px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  width: '100%',
  boxSizing: 'border-box',
  overflowY: 'auto',
  overflowX: 'hidden',
  maxHeight: 'calc(100vh - 200px)'
};

const vegTruths = [
  "What's your most embarrassing childhood memory?",
  "What's a secret talent you have?",
  "What's the weirdest dream you've had?",
  "What's your biggest fear?",
  "If you could be any fictional character, who would you be?",
  "What's the funniest thing that has ever happened to you at school or college?",
  "What's a weird food combo you secretly love?",
  "What's a silly thing you believed as a kid?",
  "What's the most random fact you know?",
  "What's a hobby you enjoy that people might not expect?",
  "What's the nicest thing someone has done for you recently?",
  "What's a song you play on repeat way too often?",
  "If you could instantly master any skill, what would it be?",
  "What's the strangest thing you've ever eaten and actually liked?",
  "What's the most wholesome message you've received recently?"
];

const vegDares = [
  "Do your best impression of a celebrity",
  "Sing the first line of your favorite song",
  "Tell a joke right now",
  "Do 10 push-ups (or your best attempt!)",
  "Say the alphabet backwards as fast as you can",
  "Act like a robot for the next 20 seconds",
  "Speak in an exaggerated movie trailer voice for 30 seconds",
  "Balance a book (or something safe) on your head and walk a few steps",
  "Mime brushing your teeth dramatically for 20 seconds",
  "Pretend to be a news anchor reporting breaking (fake) news",
  "Make a dramatic slow-motion reaction to something invisible",
  "Try to lick your elbow on camera",
  "Do your best dance move for 10 seconds",
  "Talk using only questions for the next 20 seconds",
  "Show a random object nearby and create a jingle about it"
];

const nonVegTruths = [
  "What's the most attractive thing about the person you last dated?",
  "What's something you've done that you'd never tell your parents?",
  "Have you ever had a crush on a friend's partner?",
  "What's your most embarrassing romantic moment?",
  "What's the boldest thing you've ever done?",
  "Have you ever sent a message you immediately regretted?",
  "What's your funniest awkward flirting story?",
  "Have you ever pretended to like someone just to be polite?",
  "What's a secret turn-on you don't talk about?",
  "Have you ever stalked someone's profile a little too deeply?",
  "What's the most dramatic thing you've done for someone's attention?",
  "Have you ever lied to get out of a date?",
  "What's the most chaotic thing you've done at a party?",
  "Have you ever fallen for someone you really shouldn't have?",
  "What's a romantic or flirty moment you still think about?"
];

const nonVegDares = [
  "Send a flirty text to the last person in your contacts (or pretend to!)",
  "Describe your ideal date in detail",
  "Do your best flirty look at the camera for 5 seconds",
  "Tell your most awkward date story",
  "Compliment the other person in the most dramatic way possible",
  "Say the cheesiest pickup line you can think of",
  "Describe your dream romantic getaway",
  "Act out a super dramatic movie confession scene",
  "Read any random message from your chat history in a dramatic voice (keep it safe!)",
  "Pretend you're on a dating show and introduce yourself",
  "Say something nice about yourself like you're hyping yourself up",
  "Describe your perfect first kiss scenario (keep it classy)",
  "Pretend to write a flirty poem on the spot",
  "Do a playful wink and finger guns at the camera",
  "Say the word 'wow' in as many different tones as you can"
];

const getPromptPool = (category, type) => {
  const cat = category === 'nonveg' ? 'nonveg' : 'veg';
  if (cat === 'veg') {
    return type === 'truth' ? vegTruths : vegDares;
  }
  return type === 'truth' ? nonVegTruths : nonVegDares;
};

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

const GameTruthOrDare = ({ socket, partnerId, onGameEnd, updateScore, gameName = 'Truth or Dare', isFirstPlayer }) => {
  const isInviter = !!isFirstPlayer;

  const [gamePhase, setGamePhase] = useState('category'); // category → bottle → choice → prompt → result
  const [finalCategory, setFinalCategory] = useState(null);

  const [bottlePointsTo, setBottlePointsTo] = useState(null); // inviter perspective: 'you' | 'partner'
  const [choiceType, setChoiceType] = useState(null); // 'truth'|'dare'
  const [currentPrompt, setCurrentPrompt] = useState(null);

  const [bottleAngle, setBottleAngle] = useState(0);
  const [bottleSpinning, setBottleSpinning] = useState(false);
  const [toast, setToast] = useState({ visible: false, text: '', type: '' });
  const scoreUpdatedRef = useRef(false);

  const targetIsYou = useMemo(() => {
    if (!bottlePointsTo) return false;
    return isInviter ? bottlePointsTo === 'you' : bottlePointsTo === 'partner';
  }, [bottlePointsTo, isInviter]);

  const isMyTurn = useMemo(() => {
    if (!bottlePointsTo) return false;
    return (isInviter && bottlePointsTo === 'you') || (!isInviter && bottlePointsTo === 'partner');
  }, [bottlePointsTo, isInviter]);

  const titleText = useMemo(() => {
    if (!choiceType) return 'Truth or Dare';
    return `${choiceType === 'truth' ? 'Truth' : 'Dare'} for ${targetIsYou ? 'You' : 'Partner'}`;
  }, [choiceType, targetIsYou]);

  const categoryLabel = finalCategory === 'nonveg' ? '🌶️ Non-Veg Mode' : '🥦 Veg Mode';
  const categoryColor = finalCategory === 'nonveg'
    ? 'linear-gradient(90deg, rgba(248,113,113,0.2), rgba(249,115,22,0.35))'
    : 'linear-gradient(90deg, rgba(34,197,94,0.25), rgba(22,163,74,0.45))';

  const handleCategorySelect = (cat) => {
    if (isInviter) return;
    setFinalCategory(cat);
    setGamePhase('bottle');
    socket?.emit('todCategory', { to: partnerId, category: cat });
  };

  const handleChangeCategory = () => {
    if (isInviter) return;
    setGamePhase('category');
    setFinalCategory(null);
    setBottlePointsTo(null);
    setChoiceType(null);
    setCurrentPrompt(null);
    setToast({ visible: false, text: '', type: '' });
    socket?.emit('todCategoryReset', { to: partnerId });
  };

  const spinBottle = () => {
    if (bottleSpinning) return;
    setBottleSpinning(true);
    const pickMe = Math.random() < 0.5;
    const targetAngle = pickMe ? 0 : 180;
    const finalAngle = 360 * (6 + Math.floor(Math.random() * 3)) + targetAngle + (Math.random() * 30 - 15);
    setBottleAngle(prev => prev + finalAngle);

    setTimeout(() => {
      setBottleSpinning(false);
      const pointsTo = pickMe ? 'you' : 'partner'; // inviter perspective
      setBottlePointsTo(pointsTo);
      setGamePhase('choice');
      socket?.emit('bottleResult', { to: partnerId, pointsTo });
    }, 3500);
  };

  const chooseType = (type) => {
    setChoiceType(type);
    socket?.emit('todChoice', { to: partnerId, choice: type });

    const items = getPromptPool(finalCategory || 'veg', type);
    const idx = Math.floor(Math.random() * items.length);
    const prompt = items[idx];
    setCurrentPrompt(prompt);
    setGamePhase('prompt');
    scoreUpdatedRef.current = false;
    socket?.emit('todPrompt', { to: partnerId, prompt, choiceType: type, pointsTo: bottlePointsTo });
  };

  const applyVerifyResult = (verified) => {
    if (choiceType && messages[choiceType]) {
      const pool = verified ? messages[choiceType].success : messages[choiceType].failure;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      setToast({ visible: true, text: msg, type: verified ? 'success' : 'failure' });
    }

    if (verified && typeof updateScore === 'function' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      updateScore(targetIsYou ? 'you' : 'partner', gameName || 'Truth or Dare');
    }

    setGamePhase('result');
    setTimeout(() => {
      setToast({ visible: false, text: '', type: '' });
      setBottlePointsTo(null);
      setChoiceType(null);
      setCurrentPrompt(null);
      setGamePhase('bottle');
    }, 2500);
  };

  const verify = (verified) => {
    applyVerifyResult(verified);
    socket?.emit('todVerify', { to: partnerId, verified });
  };

  useEffect(() => {
    if (!socket) return;

    const onCategory = ({ category, from }) => {
      if (from !== partnerId) return;
      setFinalCategory(category);
      setGamePhase('bottle');
    };

    const onBottleResult = ({ pointsTo, from }) => {
      if (from !== partnerId) return;
      setBottlePointsTo(pointsTo);
      setGamePhase('choice');
      setBottleSpinning(false);
    };

    const onChoice = ({ choice, from }) => {
      if (from !== partnerId) return;
      setChoiceType(choice);
    };

    const onPrompt = ({ prompt, choiceType: ct, pointsTo, from }) => {
      if (from !== partnerId) return;
      setBottlePointsTo(pointsTo);
      setChoiceType(ct);
      setCurrentPrompt(prompt);
      setGamePhase('prompt');
    };

    const onVerify = ({ verified, from }) => {
      if (from !== partnerId) return;
      applyVerifyResult(verified);
    };

    const onCategoryReset = ({ from }) => {
      if (from !== partnerId) return;
      setFinalCategory(null);
      setGamePhase('category');
      setBottlePointsTo(null);
      setChoiceType(null);
      setCurrentPrompt(null);
      setToast({ visible: false, text: '', type: '' });
    };

    socket.on('todCategory', onCategory);
    socket.on('todCategoryReset', onCategoryReset);
    socket.on('bottleResult', onBottleResult);
    socket.on('todChoice', onChoice);
    socket.on('todPrompt', onPrompt);
    socket.on('todVerify', onVerify);

    return () => {
      socket.off('todCategory', onCategory);
      socket.off('todCategoryReset', onCategoryReset);
      socket.off('bottleResult', onBottleResult);
      socket.off('todChoice', onChoice);
      socket.off('todPrompt', onPrompt);
      socket.off('todVerify', onVerify);
    };
  }, [socket, partnerId, choiceType, bottlePointsTo, finalCategory, gameName, targetIsYou]);

  return (
    <div style={panel} className="todCompact">
      <style>{`
        @media (max-width: 480px) {
          .todCompact { font-size: 13px; padding: 8px; gap: 8px; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
        <div style={{ flex: 1, fontSize: 'clamp(14px, 3vw, 18px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 800 }}>
          {titleText}
        </div>
        <button
          onClick={() => { onGameEnd && onGameEnd(); }}
          type="button"
          style={{
            flexShrink: 0,
            padding: '0.45rem 0.8rem',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'linear-gradient(180deg, rgba(31,41,55,0.9), rgba(17,24,39,0.9))',
            color: '#e5e7eb',
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(0,0,0,0.35)'
          }}
        >
          Exit
        </button>
      </div>

      {finalCategory && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%' }}>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: categoryColor, border: '1px solid rgba(15,23,42,0.85)', fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: '#f9fafb' }}>
            {categoryLabel}
          </div>
          {!isInviter && (
            <button
              onClick={handleChangeCategory}
              type="button"
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(15,23,42,0.6)',
                color: '#e5e7eb',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Change
            </button>
          )}
        </div>
      )}

      {gamePhase === 'category' && (
        <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {!isInviter ? (
            <>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Choose Veg / Non-Veg</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                <button onClick={() => handleCategorySelect('veg')} type="button" style={{ flex: 1, minWidth: 140, padding: 12, borderRadius: 12, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.18)', color: '#dcfce7', fontWeight: 800, cursor: 'pointer' }}>
                  🥦 Veg
                </button>
                <button onClick={() => handleCategorySelect('nonveg')} type="button" style={{ flex: 1, minWidth: 140, padding: 12, borderRadius: 12, border: '1px solid rgba(249,115,22,0.45)', background: 'rgba(249,115,22,0.18)', color: '#fff7ed', fontWeight: 800, cursor: 'pointer' }}>
                  🌶️ Non-Veg
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>⏳ Waiting for partner to choose category...</div>
          )}
        </div>
      )}

      {gamePhase === 'bottle' && (
        <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#22c55e', fontWeight: 800, marginTop: 6, marginBottom: 10 }}>Bottle spin</div>
          <div style={{ position: 'relative', width: 'min(360px, 90vw)', height: 'min(360px, 90vw)', padding: 16, background: 'rgba(15, 23, 42, 0.35)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(148,163,184,0.15) 0%, rgba(31,41,55,0.35) 60%, rgba(2,6,23,0.8) 100%)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', background: 'linear-gradient(180deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.08) 100%)' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', background: 'linear-gradient(0deg, rgba(244,63,94,0.18) 0%, rgba(244,114,182,0.07) 100%)' }} />
              </div>
              <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', color: '#bbf7d0', fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>YOU</div>
              <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', color: '#fecdd3', fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>PARTNER</div>
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', transform: 'translate(-50%, -50%)', zIndex: 15, boxShadow: '0 0 10px rgba(34,197,94,0.5)' }} />
              <Bottle angle={bottleAngle} spinning={bottleSpinning} />
            </div>
          </div>

          {isInviter ? (
            <button onClick={spinBottle} disabled={bottleSpinning} type="button" style={{ background: '#22c55e', color: 'white', fontSize: 18, fontWeight: 'bold', padding: '14px 32px', borderRadius: 12, border: 'none', cursor: bottleSpinning ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(34,197,94,0.4)', marginTop: 24, width: '80%', opacity: bottleSpinning ? 0.7 : 1 }}>
              {bottleSpinning ? 'Spinning...' : '🍾 SPIN THE BOTTLE'}
            </button>
          ) : (
            <div style={{ marginTop: 24, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>⏳ Waiting for partner to spin...</div>
          )}
        </div>
      )}

      {gamePhase === 'choice' && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          {isMyTurn ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Choose Truth or Dare</div>
              <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                <button onClick={() => chooseType('truth')} type="button" style={{ flex: 1, minWidth: 120, padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.18)', color: '#dcfce7', fontWeight: 800, cursor: 'pointer' }}>Truth</button>
                <button onClick={() => chooseType('dare')} type="button" style={{ flex: 1, minWidth: 120, padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.18)', color: '#fecaca', fontWeight: 800, cursor: 'pointer' }}>Dare</button>
              </div>
            </>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>⏳ Waiting for partner to choose...</div>
          )}
        </div>
      )}

      {gamePhase === 'prompt' && currentPrompt && (
        <>
          <div style={{ width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 'clamp(13px, 2.5vw, 16px)', lineHeight: 1.5, wordWrap: 'break-word', overflowWrap: 'break-word', background: 'linear-gradient(180deg, rgba(15,23,42,0.8), rgba(3,7,18,0.85))', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 14 }}>
            {currentPrompt}
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
            <button onClick={() => verify(true)} disabled={toast.visible} type="button" style={{ flex: 1, minWidth: 120, padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.22)', color: '#bbf7d0', fontWeight: 800, cursor: 'pointer' }}>Verified ✓</button>
            <button onClick={() => verify(false)} disabled={toast.visible} type="button" style={{ flex: 1, minWidth: 120, padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.18)', color: '#fecaca', fontWeight: 800, cursor: 'pointer' }}>Not Done ✗</button>
          </div>
        </>
      )}

      {toast.visible && (
        <div style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 12, background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: toast.type === 'success' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)', color: toast.type === 'success' ? '#bbf7d0' : '#fecaca', fontWeight: 800 }}>
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default GameTruthOrDare;


