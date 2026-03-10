import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * FIX: onMatch and onPartnerDisconnected were previously in the useEffect
 * dependency array. Since callers pass inline arrow functions, those are
 * recreated on every parent render, causing the socket to be torn down and
 * rebuilt on every render — an infinite reconnect loop.
 *
 * Solution: store the latest callback in a ref so the effect never needs to
 * re-run when the callback identity changes, while still always calling the
 * current version.
 */
export const useChatQueue = (socketUrl, mode, onMatch, onPartnerDisconnected) => {
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Keep mutable refs so event handlers always call the latest callbacks
  // without needing them in the effect dependency array.
  const onMatchRef = useRef(onMatch);
  const onPartnerDisconnectedRef = useRef(onPartnerDisconnected);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    onPartnerDisconnectedRef.current = onPartnerDisconnected;
  }, [onPartnerDisconnected]);

  useEffect(() => {
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    const handleConnect = () => setIsConnected(true);

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsSearching(false);
    };

    const handleUserCount = (count) => setOnlineUsers(count);

    const handleMatch = (data) => {
      setIsSearching(false);
      onMatchRef.current?.(data);
    };

    const handlePartnerDisconnected = () => {
      setIsSearching(false);
      onPartnerDisconnectedRef.current?.();
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('userCount', handleUserCount);
    newSocket.on('match', handleMatch);
    newSocket.on('partnerDisconnected', handlePartnerDisconnected);

    return () => {
      // FIX: remove each listener by its named reference, not with .off() which
      // would strip all listeners on those events from the entire socket.
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('userCount', handleUserCount);
      newSocket.off('match', handleMatch);
      newSocket.off('partnerDisconnected', handlePartnerDisconnected);
      newSocket.close();
    };
    // FIX: only socketUrl in deps — adding callback functions would cause the
    // socket to be recreated on every render (the original infinite-loop bug).
  }, [socketUrl]);

  const joinQueue = useCallback((partnerId = null) => {
    if (!socket || !isConnected) return;
    setIsSearching(true);
    const data = partnerId ? { mode, partnerId } : mode;
    socket.emit('joinQueue', data);
  }, [socket, isConnected, mode]);

  const leaveQueue = useCallback(() => {
    if (!socket) return;
    setIsSearching(false);
    socket.emit('leaveChat');
  }, [socket]);

  const skipPartner = useCallback((partnerId) => {
    if (!socket) return;
    socket.emit('partnerSkipped', { to: partnerId });
  }, [socket]);

  return {
    socket,
    isSearching,
    isConnected,
    onlineUsers,
    joinQueue,
    leaveQueue,
    skipPartner
  };
};
