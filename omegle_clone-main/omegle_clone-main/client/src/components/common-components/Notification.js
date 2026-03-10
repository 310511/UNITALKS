import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const NotificationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
`;

const NotificationCard = styled.div`
  background: #121212;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
`;

const NotificationIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const NotificationTitle = styled.h3`
  color: #fff;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
`;

const NotificationMessage = styled.p`
  color: #B3B3B3;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  font-size: 1rem;
`;

const NotificationButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #1DB954 0%, #19a64c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
  }
`;

// Toast-style (non-blocking) notification for autoClose=true
const ToastWrapper = styled.div`
  position: fixed;
  top: 84px; /* slightly below fixed header */
  right: 20px;
  z-index: 10000;
  animation: fadeIn 0.25s ease;

  @media (max-width: 768px) {
    top: 70px; /* smaller offset for shorter mobile header */
  }
`;

const ToastCard = styled.div`
  background: #121212;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  min-width: 260px;
  max-width: 360px;
  color: #e5e7eb;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
`;

const ToastIcon = styled.div`
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToastText = styled.div`
  display: flex;
  flex-direction: column;
`;

const ToastTitle = styled.div`
  font-weight: 700;
  font-size: 0.98rem;
  color: #fff;
`;

const ToastMessage = styled.div`
  font-size: 0.9rem;
  color: #b3b3b3;
  margin-top: 2px;
`;

const Notification = ({ 
  isVisible, 
  onClose, 
  title, 
  message, 
  icon = "ℹ️",
  buttonText = "OK",
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Use a standard function declaration for better hoisting behavior inside the component scope
  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        // Defensive check: only call if handleClose exists (should always, but for safety)
        if (typeof handleClose === 'function') {
          handleClose();
        }
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, autoClose, autoCloseDelay]);

  if (!isVisible) return null;

  // Render as a non-blocking toast when autoClose is enabled
  if (autoClose) {
    return (
      <ToastWrapper style={{ animation: isClosing ? 'fadeOut 0.25s ease' : 'fadeIn 0.25s ease' }}>
        <ToastCard>
          <ToastIcon>{icon}</ToastIcon>
          <ToastText>
            <ToastTitle>{title}</ToastTitle>
            <ToastMessage>{message}</ToastMessage>
          </ToastText>
        </ToastCard>
      </ToastWrapper>
    );
  }

  return (
    <NotificationOverlay 
      style={{ animation: isClosing ? 'fadeOut 0.3s ease' : 'fadeIn 0.3s ease' }}
      onClick={handleClose}
    >
      <NotificationCard 
        style={{ animation: isClosing ? 'slideDown 0.3s ease' : 'slideUp 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <NotificationIcon>{icon}</NotificationIcon>
        <NotificationTitle>{title}</NotificationTitle>
        <NotificationMessage>{message}</NotificationMessage>
        <NotificationButton onClick={handleClose}>
          {buttonText}
        </NotificationButton>
      </NotificationCard>
    </NotificationOverlay>
  );
};

export default Notification; 