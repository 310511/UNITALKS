import React from 'react';
import styled, { keyframes } from 'styled-components';

const radarRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeSlide = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
  position: relative;
  pointer-events: none;
  width: min(420px, 92%);
  margin: 8px auto 14px auto;
  border-radius: 14px;
  border: 1px solid rgba(29,185,84,0.35);
  background: radial-gradient(60% 80% at 50% 30%, rgba(29,185,84,0.12), rgba(0,0,0,0));
  overflow: visible;
  box-shadow: 0 10px 40px rgba(29,185,84,0.12);
  opacity: ${p => (p.$visible ? 1 : 0)};
  transform: translateY(${p => (p.$visible ? '0' : '6px')});
  transition: opacity .2s ease, transform .2s ease;
  animation: ${p => (p.$visible ? fadeSlide : 'none')} .2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const RadarContainer = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(0,80,0,0.15);
  margin: 10px auto 0 auto;
`;

const RadarSweep = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(34, 197, 94, 0.0) 300deg,
    rgba(34, 197, 94, 0.6) 355deg,
    rgba(34, 197, 94, 0.8) 360deg
  );
  animation: ${radarRotate} 2s linear infinite;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.4;
  }
`;

const RadarRing = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  width: ${p => p.$size}%;
  height: ${p => p.$size}%;
`;

const CrosshairH = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(34, 197, 94, 0.2);
  transform: translateY(-50%);
`;

const CrosshairV = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(34, 197, 94, 0.2);
  transform: translateX(-50%);
`;

const CenterDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 3;
`;

const Sub = styled.div`
  text-align: center;
  color: #86efac;
  font-size: .82rem;
  opacity: .9;
  margin-top: 12px;
`;

const Label = styled.div`
  text-align: center;
  color: #a7f3d0;
  font-weight: 800;
  letter-spacing: .4px;
  text-transform: uppercase;
  font-size: .78rem;
  margin-top: 4px;
  margin-bottom: 8px;
`;

export default function SearchOverlay({ visible, mode = 'video', status = 'finding' }) {
  if (!visible) return null;
  const pretty = status === 'establishing' ? 'Establishing connection' : 'Searching for a partner';
  const modeLabel = mode === 'voice' ? 'Voice' : mode === 'text' ? 'Text' : 'Video';
  return (
    <Wrap $visible={visible} aria-hidden={!visible}>
      <RadarContainer>
        <RadarSweep />
        <RadarRing $size={33} />
        <RadarRing $size={66} />
        <RadarRing $size={100} />
        <CrosshairH />
        <CrosshairV />
        <CenterDot>📡</CenterDot>
      </RadarContainer>
      <Sub>{modeLabel} mode</Sub>
      <Label>{pretty}…</Label>
    </Wrap>
  );
}
