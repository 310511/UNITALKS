import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

/**
 * MusicTogether: synchronized mini music player with search and lyrics
 * - Uses iTunes Search API for free 30s previews
 * - Uses lyrics.ovh for lyrics fetch
 * - Syncs play/pause/seek and chosen track between paired users via Socket.IO
 */

const containerStyle = {
  background: 'linear-gradient(180deg, #0f1115 0%, #12161f 100%)',
  borderRadius: 18,
  padding: '1rem',
  minWidth: 280,
  width: '100%',
  height: '100%',
  margin: '0 auto',
  boxShadow: '0 8px 32px #000a',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem'
};

const headerStyle = { fontSize: '1.6rem', fontWeight: 700, letterSpacing: 0.5 };

const rowStyle = { display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' };

const inputStyle = {
  flex: 1,
  background: '#2b3444',
  color: '#fff',
  border: '1px solid #3b4456',
  borderRadius: 10,
  padding: '0.55rem 0.75rem',
  outline: 'none'
};

const buttonStyle = {
  background: 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.55rem 0.9rem',
  cursor: 'pointer',
  fontWeight: 600
};

const subtleButton = {
  background: 'none',
  color: '#bbb',
  border: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
  textDecoration: 'underline',
  opacity: 0.8
};

const listStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '0.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const progressRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.25rem 0.35rem 0.6rem',
  borderTop: '1px solid #202632'
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function MusicTogether({ socket, partnerId, onExit }) {
  const [query, setQuery] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [currentTrack, setCurrentTrack] = useState(null); // { title, artist, artwork, url, duration }
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isRemoteActionRef = useRef(false);
  const audioRef = useRef(null);
  const pendingPlayRef = useRef({ shouldPlay: false, time: 0 });
  const [autoplayUnlocked, setAutoplayUnlocked] = useState(false);
  const playAckPendingRef = useRef(false);
  const playRetryTimerRef = useRef(null);
  const playRetryCountRef = useRef(0);

  // When track changes, update audio source
  const audioSrc = useMemo(() => currentTrack?.url || '', [currentTrack]);

  // Helper to robustly start playback with retries until policy/network allow
  const ensurePlayback = useCallback((targetTime) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (typeof targetTime === 'number') {
      try { audio.currentTime = targetTime; } catch (_) {}
    }
    let attempts = 0;
    const tryPlay = () => {
      if (!pendingPlayRef.current.shouldPlay) return;
      audio.play().then(() => {
        setIsPlaying(true);
        pendingPlayRef.current.shouldPlay = false;
        playAckPendingRef.current = false;
        if (playRetryTimerRef.current) { clearTimeout(playRetryTimerRef.current); playRetryTimerRef.current = null; }
      }).catch(() => {
        attempts += 1;
        if (attempts < 10) setTimeout(tryPlay, 300);
      });
    };
    if (audio.readyState < 2) {
      const onReady = () => { audio.removeEventListener('canplay', onReady); tryPlay(); };
      audio.addEventListener('canplay', onReady);
    } else {
      tryPlay();
    }
  }, [setIsPlaying]);

  const schedulePlayRetryHandshake = () => {
    if (playRetryTimerRef.current) clearTimeout(playRetryTimerRef.current);
    playRetryCountRef.current = 0;
    playAckPendingRef.current = true;
    const tick = () => {
      if (!playAckPendingRef.current) return; // acked
      if (playRetryCountRef.current >= 3) return; // give up silently
      playRetryCountRef.current += 1;
      const audio = audioRef.current;
      const now = audio?.currentTime || 0;
      socket?.emit('musicEvent', { to: partnerId, type: 'play', time: now });
      playRetryTimerRef.current = setTimeout(tick, 900);
    };
    playRetryTimerRef.current = setTimeout(tick, 900);
  };

  // Keep audio element configured
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioSrc]);

  // Attach timeupdate/loadedmetadata listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);



  // Search iTunes API for previews
  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      // Use iTunes API via jsonp/CORS proxy or directly as it usually supports CORS
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&media=music&entity=song&limit=25`);
      const data = await res.json();
      
      const items = (data.results || []).filter(t => t.previewUrl).map(t => ({
        id: `itunes:${t.trackId}`,
        title: t.trackName,
        artist: t.artistName,
        artwork: (t.artworkUrl100 || t.artworkUrl60 || '').replace('100x100bb', '500x500bb'),
        url: t.previewUrl,
        duration: 30, // iTunes previews are exactly 30 seconds
        provider: 'iTunes'
      }));

      setResults(items);
      if (items.length > 0) {
        selectTrack(items[0], true);
        
        // Fetch recommendations from same artist
        const artist = items[0].artist;
        const recRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&media=music&entity=song&limit=15`);
        const recData = await recRes.json();
        
        let recs = (recData.results || []).filter(t => t.previewUrl).map(t => ({
          id: `itunes:${t.trackId}`,
          title: t.trackName,
          artist: t.artistName,
          artwork: (t.artworkUrl100 || t.artworkUrl60 || '').replace('100x100bb', '500x500bb'),
          url: t.previewUrl,
          duration: 30,
          provider: 'iTunes'
        }));
        
        // Filter out the exact songs returned in results
        const seenR = new Set(items.map(i => (i.title + '|' + i.artist).toLowerCase()));
        recs = recs.filter(r => {
          const key = (r.title + '|' + r.artist).toLowerCase();
          if (seenR.has(key)) return false;
          seenR.add(key);
          return true;
        });
        
        setRecommendations(recs);
      } else {
        setRecommendations([]);
      }
    } catch (_) {
      // ignore or handle error gracefully
    }
  };

  const selectTrack = (track, broadcast = false) => {
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(track?.duration || 30);
    if (broadcast) {
      socket?.emit('musicEvent', { to: partnerId, type: 'choose', track });
    }
  };

  // Control handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      socket?.emit('musicEvent', { to: partnerId, type: 'pause', time: audio.currentTime });
    } else {
      // Always emit play so partner syncs immediately; start locally when ready
      setIsPlaying(true);
      pendingPlayRef.current = { shouldPlay: true, time: audio.currentTime || 0 };
      ensurePlayback(pendingPlayRef.current.time);
      socket?.emit('musicEvent', { to: partnerId, type: 'play', time: audio.currentTime || 0 });
      schedulePlayRetryHandshake();
    }
  };

  // Ensure local playback starts once metadata becomes available after a pending play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && audio.paused && Number.isFinite(duration) && duration > 0 && pendingPlayRef.current.shouldPlay) {
      if (typeof pendingPlayRef.current.time === 'number') {
        audio.currentTime = pendingPlayRef.current.time;
      }
      ensurePlayback(pendingPlayRef.current.time);
    }
  }, [isPlaying, duration]);

  // Attempt to unlock autoplay policy with a one-time user interaction
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const originalMuted = audio.muted;
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = originalMuted;
        setAutoplayUnlocked(true);
        cleanup();
      }).catch(() => {
        audio.muted = originalMuted;
        setAutoplayUnlocked(true);
        cleanup();
      });
    };
    const cleanup = () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return cleanup;
  }, []);

  // If autoplay gets unlocked and there is a pending play, try to start
  useEffect(() => {
    if (autoplayUnlocked && pendingPlayRef.current.shouldPlay) {
      ensurePlayback(pendingPlayRef.current.time);
    }
  }, [autoplayUnlocked]);

  const onSeek = (e) => {
    const value = Number(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
    socket?.emit('musicEvent', { to: partnerId, type: 'seek', time: value });
  };

  // Listen for partner events
  useEffect(() => {
    if (!socket) return;
    const onEvent = (data) => {
      if (data.from !== partnerId) return;
      if (data.type === 'choose') {
        setCurrentTrack(data.track);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(data.track?.duration || 30);
        // Allow react to render and then load
        setTimeout(() => {
          if (!audioRef.current) return;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }, 50);
      } else if (data.type === 'play') {
        if (typeof data.time === 'number' && audioRef.current) {
          const drift = Math.abs((audioRef.current.currentTime || 0) - data.time);
          if (drift > 0.7) {
            isRemoteActionRef.current = true;
            audioRef.current.currentTime = data.time;
            setCurrentTime(data.time);
            setTimeout(() => { isRemoteActionRef.current = false; }, 250);
          }
          // Defer play until we can play (metadata/canplay), with retries
          pendingPlayRef.current = { shouldPlay: true, time: data.time };
          ensurePlayback(data.time);
          // Send ack back so sender stops retrying
          socket?.emit('musicEvent', { to: partnerId, type: 'ack', what: 'play' });
        }
      } else if (data.type === 'pause') {
        if (typeof data.time === 'number' && audioRef.current) {
          const drift = Math.abs((audioRef.current.currentTime || 0) - data.time);
          if (drift > 0.7) {
            isRemoteActionRef.current = true;
            audioRef.current.currentTime = data.time;
            setCurrentTime(data.time);
            setTimeout(() => { isRemoteActionRef.current = false; }, 250);
          }
          audioRef.current.pause();
          setIsPlaying(false);
          // Cancel play retry if any
          playAckPendingRef.current = false;
          if (playRetryTimerRef.current) { clearTimeout(playRetryTimerRef.current); playRetryTimerRef.current = null; }
        }
      } else if (data.type === 'seek') {
        if (typeof data.time === 'number' && audioRef.current) {
          isRemoteActionRef.current = true;
          audioRef.current.currentTime = data.time;
          setCurrentTime(data.time);
          setTimeout(() => { isRemoteActionRef.current = false; }, 250);
        }
      } else if (data.type === 'ack' && data.what === 'play') {
        // Partner confirmed starting playback; stop retries
        playAckPendingRef.current = false;
        if (playRetryTimerRef.current) { clearTimeout(playRetryTimerRef.current); playRetryTimerRef.current = null; }
      }
    };
    socket.on('musicEvent', onEvent);
    return () => {
      socket.off('musicEvent', onEvent);
    };
  }, [socket, partnerId]);


  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Songs</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          placeholder="Search any song or artist"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
        <button style={{
          ...buttonStyle,
          background: 'linear-gradient(90deg, #1DB954 0%, #19a64c 100%)',
          boxShadow: '0 6px 16px rgba(29,185,84,0.25)'
        }} onClick={handleSearch}>Search</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Volume">
          <span style={{ fontSize: 12, opacity: 0.7 }}>🔊</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => {
              const newVol = Number(e.target.value) / 100;
              setVolume(newVol);
              if (audioRef.current) {
                audioRef.current.volume = newVol;
              }
            }}
            style={{ width: 120, accentColor: '#1DB954' }}
          />
        </div>
      </div>

      {currentTrack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.5rem 0.6rem', background: '#0f131a', borderRadius: 14, border: '1px solid #1f2937' }}>
          {currentTrack.artwork && (
            <img src={currentTrack.artwork} alt="artwork" style={{ width: 56, height: 56, borderRadius: 8, boxShadow: '0 8px 18px rgba(0,0,0,0.35)' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>{currentTrack.title}</div>
            <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>{currentTrack.artist}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{currentTrack.provider || 'Music'}</div>
          </div>
          <button
            onClick={togglePlay}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: '#1DB954', color: '#0b0e12', fontWeight: 800,
              boxShadow: '0 10px 24px rgba(29,185,84,0.35)'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      )}

      {/* Results and recommendations list */}
      <div style={listStyle}>
        {results.length > 0 && (
          <div style={{ opacity: 0.9, fontWeight: 600, margin: '0.25rem 0' }}>Results</div>
        )}
        {results.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTrack(t, true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left', background: 'transparent', color: '#e5e7eb',
              border: '1px solid #334155', borderRadius: 12, padding: '0.45rem 0.5rem', cursor: 'pointer'
            }}
          >
            <img src={t.artwork} alt="art" style={{ width: 42, height: 42, borderRadius: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>{t.title}</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.artist}</span>
            </div>
          </button>
        ))}

        {recommendations.length > 0 && (
          <div style={{ opacity: 0.9, fontWeight: 600, margin: '0.4rem 0 0.2rem' }}>Similar</div>
        )}
        {recommendations.map((t) => (
          <button
            key={`rec-${t.id}`}
            onClick={() => selectTrack(t, true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left', background: 'transparent', color: '#e5e7eb',
              border: '1px solid #334155', borderRadius: 12, padding: '0.45rem 0.5rem', cursor: 'pointer'
            }}
          >
            <img src={t.artwork} alt="art" style={{ width: 42, height: 42, borderRadius: 8 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>{t.title}</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.artist}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Player */}
      <div style={progressRow}>
        <span style={{ minWidth: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#9ca3af' }}>
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.01}
          value={Math.min(currentTime, Math.max(1, duration))}
          onChange={onSeek}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 6,
            appearance: 'none',
            background: `linear-gradient(to right, #1DB954 ${duration ? (currentTime / duration) * 100 : 0}%, #2b323f ${duration ? (currentTime / duration) * 100 : 0}%)`
          }}
        />
        <span style={{ minWidth: 42, textAlign: 'left', fontVariantNumeric: 'tabular-nums', color: '#9ca3af' }}>
          {formatTime(duration)}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onExit} style={{
          ...subtleButton,
          color: '#fff',
          background: '#ef4444',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          textDecoration: 'none'
        }}>Exit</button>
      </div>

      <audio ref={audioRef} src={audioSrc} preload="auto" crossOrigin="anonymous" />
    </div>
  );
}

export default MusicTogether;


