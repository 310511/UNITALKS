import { useEffect, useRef, useState } from 'react';

function generateRandomInteger(min, max) {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

export default function useRandomOnlineCount(options = {}) {
  const { min = 534, max = 657, intervalMs = 10000 } = options;

  // FIX: the lazy initializer already sets a random value on mount, so calling
  // setCount(generateRandomInteger(...)) again inside useEffect caused a
  // redundant extra state update (and re-render) immediately on mount.
  const [count, setCount] = useState(() => generateRandomInteger(min, max));
  const intervalRef = useRef(null);

  useEffect(() => {
    // No immediate setCount — the lazy initializer already set the first value.
    intervalRef.current = setInterval(() => {
      setCount(generateRandomInteger(min, max));
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [min, max, intervalMs]);

  return count;
}
