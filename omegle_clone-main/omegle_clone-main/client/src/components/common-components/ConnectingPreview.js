import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  display: ${p => (p.$visible ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  pointer-events: auto;
`;

const Frame = styled.div`
  position: relative;
  width: 240px;
  aspect-ratio: 16 / 9;
  background: #0b0f17;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 32px rgba(29,185,84,0.12);
`;

const Vid = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(10px) brightness(0.9) saturate(1.1);
`;

const Placeholder = styled.div`
  position: absolute; inset: 0;
  background: radial-gradient(70% 50% at 50% 40%, rgba(29,185,84,0.12), rgba(0,0,0,0.7));
`;

const Badge = styled.div`
  position: absolute; left: 8px; top: 8px;
  background: rgba(29,185,84,0.18);
  border: 1px solid rgba(29,185,84,0.45);
  color: #a7f3d0; font-weight: 800; font-size: 0.7rem; padding: 3px 8px; border-radius: 999px;
`;

const Skip = styled.button`
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  color: #0b0f12;
  border: none; border-radius: 999px;
  padding: 8px 14px; font-weight: 800; cursor: pointer;
`;

const ProgressSvg = styled.svg`
  position: absolute; inset: 0; pointer-events: none;
`;

const AnimatedRect = styled.rect`
  transition: stroke-dashoffset ${p => p.$duration}ms linear;
`;

export default function ConnectingPreview({ visible, stream, onSkip, onTimeout, durationMs = 4000, autoPlay = true }) {
  const vRef = useRef(null);
  const pathRef = useRef(null);
  const [len, setLen] = useState(600);
  const [offset, setOffset] = useState(600);

  useEffect(() => {
    if (!visible) return;
    const v = vRef.current;
    if (v && stream) {
      try { v.srcObject = stream; } catch (_) {}
      if (autoPlay) v.play?.().catch(() => {});
    }
  }, [visible, stream, autoPlay]);

  useEffect(() => {
    if (!visible) return;
    const p = pathRef.current;
    let rafId;
    if (p && p.getTotalLength) {
      try {
        const L = p.getTotalLength();
        setLen(L);
        setOffset(L);
        // kick the transition on next frame
        rafId = requestAnimationFrame(() => setOffset(0));
      } catch (_) {}
    } else {
      setOffset(0);
    }
    const t = setTimeout(() => { onTimeout?.(); }, durationMs);
    return () => { clearTimeout(t); if (rafId) cancelAnimationFrame(rafId); };
  }, [visible, durationMs, onTimeout]);

  return (
    <Wrap $visible={visible}>
      <Frame>
        {stream ? <Vid ref={vRef} muted playsInline /> : <Placeholder />}
        <Badge>Incoming preview</Badge>
        <ProgressSvg viewBox="0 0 240 135" preserveAspectRatio="none">
          <AnimatedRect
            ref={pathRef}
            x="1.5" y="1.5" width="237" height="132" rx="10"
            fill="transparent"
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray={len}
            strokeDashoffset={offset}
            $duration={durationMs}
          />
        </ProgressSvg>
      </Frame>
      <Skip onClick={onSkip}>Skip</Skip>
    </Wrap>
  );
}
