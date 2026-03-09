import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const ring = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.25); opacity: 0.9; }
  70% { opacity: 0.25; }
  100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
`;

const fadeSlide = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
  position: relative;
  pointer-events: none;
  width: min(420px, 92%);
  height: 120px;
  margin: 8px auto 14px auto;
  border-radius: 14px;
  border: 1px solid rgba(29,185,84,0.35);
  background: radial-gradient(60% 80% at 50% 30%, rgba(29,185,84,0.12), rgba(0,0,0,0));
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(29,185,84,0.12);
  opacity: ${p => (p.$visible ? 1 : 0)};
  transform: translateY(${p => (p.$visible ? '0' : '6px')});
  transition: opacity .2s ease, transform .2s ease;
  animation: ${p => (p.$visible ? fadeSlide : 'none')} .2s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Sweep = styled.div`
  position: absolute;
  inset: -10%;
  background: conic-gradient(from 0deg, rgba(29,185,84,0.35), rgba(29,185,84,0.0) 42%);
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: ${spin} 2.8s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: .25;
  }
`;

const Ring = styled.div`
  position: absolute;
  left: 50%; top: 50%;
  width: 16px; height: 16px;
  border: 2px solid rgba(167, 243, 208, 0.9);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.25);
  animation: ${ring} 2s linear infinite;
  animation-delay: ${p => p.$delay || 0}s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: .35;
  }
`;

const Label = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 10px;
  text-align: center;
  color: #a7f3d0; /* mint */
  font-weight: 800;
  letter-spacing: .4px;
  text-transform: uppercase;
  font-size: .78rem;
`;

const Sub = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 28px;
  text-align: center;
  color: #86efac;
  font-size: .82rem;
  opacity: .9;
`;

export default function SearchOverlay({ visible, mode = 'video', status = 'finding' }) {
  if (!visible) return null; // do not animate in background
  const pretty = status === 'establishing' ? 'Establishing connection' : 'Searching for a partner';
  const modeLabel = mode === 'voice' ? 'Voice' : mode === 'text' ? 'Text' : 'Video';
  return (
    <Wrap $visible={visible} aria-hidden={!visible}>
      <Sweep />
      <Ring $delay={0} />
      <Ring $delay={0.5} />
      <Ring $delay={1.0} />
      <Sub>{modeLabel} mode</Sub>
      <Label>{pretty}…</Label>
    </Wrap>
  );
}
