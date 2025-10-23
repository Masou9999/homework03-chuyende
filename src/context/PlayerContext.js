// import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
// import { Audio } from 'expo-av';

// export const PlayerContext = createContext(null);

// export function PlayerProvider({ children }) {
//   const [playlist, setPlaylist] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [currentTrack, setCurrentTrack] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [repeatMode, setRepeatMode] = useState('off'); // off | one | all

//   const soundRef = useRef(null);
//   const isLoadingRef = useRef(false);
//   const mountedRef = useRef(true);

//   // helper: pick random index not equal to exclude (if possible)
//   const randomIndex = useCallback((exclude) => {
//     if (!playlist || playlist.length <= 1) return exclude ?? 0;
//     let idx;
//     do { idx = Math.floor(Math.random() * playlist.length); } while (idx === exclude);
//     return idx;
//   }, [playlist]);

//   // Setup audio mode on mount
//   useEffect(() => {
//     mountedRef.current = true;
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     }).catch(() => {});
//     return () => { mountedRef.current = false; };
//   }, []);

//   // Safely unload current sound
//   const unloadCurrent = useCallback(async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     try {
//       s.setOnPlaybackStatusUpdate(null);
//       await s.stopAsync().catch(() => {});
//       await s.unloadAsync().catch(() => {});
//     } catch (e) {}
//     soundRef.current = null;
//   }, []);

//   // Playback status handler
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     // NOTE: keep this callback synchronous — async functions can cause missed events
//     if (!status || !mountedRef.current) return;
//     if (!status.isLoaded) return;

//     setPosition(status.positionMillis ?? 0);
//     setDuration(status.durationMillis ?? 1);
//     setIsPlaying(!!status.isPlaying);

//     if (status.didJustFinish) {
//       // handle repeat one by restarting the current sound
//       if (repeatMode === 'one') {
//         try {
//           if (soundRef.current) {
//             // schedule without awaiting
//             soundRef.current.setPositionAsync(0).catch(() => {});
//             soundRef.current.playAsync().catch(() => {});
//           }
//         } catch (e) {}
//         return;
//       }

//       // compute next index
//       const current = currentIndex;
//       const nextIdx = isShuffle ? randomIndex(current) : (current + 1 >= playlist.length ? (repeatMode === 'all' ? 0 : -1) : current + 1);

//       if (nextIdx === -1) {
//         // repeat off and at end -> stop
//         try { if (soundRef.current) soundRef.current.stopAsync().catch(() => {}); } catch (e) {}
//         setIsPlaying(false);
//         setPosition(status.durationMillis ?? (status.positionMillis ?? 0));
//         return;
//       }

//       // schedule loading of the next track to avoid reentrancy in the playback callback
//       setTimeout(() => { loadIndex(nextIdx); }, 50);
//     }
//   }, [currentIndex, isShuffle, repeatMode, playlist, randomIndex, loadIndex]);

//   // Core: load track by index and optionally play
//   const loadIndex = useCallback(async (index, { play = true } = {}) => {
//     if (!playlist || playlist.length === 0) return;
//     if (index < 0 || index >= playlist.length) return;
//     if (isLoadingRef.current) return;
//     isLoadingRef.current = true;
//     try {
//       const track = playlist[index];
//       if (!track) return;

//       // unload existing sound first
//       await unloadCurrent();

//       // create sound and attach handler
//       const { sound, status } = await Audio.Sound.createAsync(track.uri, { shouldPlay: !!play });
//       soundRef.current = sound;
//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

//       setCurrentIndex(index);
//       setCurrentTrack(track);
//       setDuration(status?.durationMillis ?? 1);
//       setPosition(status?.positionMillis ?? 0);
//       setIsPlaying(!!status?.isPlaying);
//     } catch (e) {
//       console.warn('PlayerContext.loadIndex error', e);
//     } finally {
//       isLoadingRef.current = false;
//     }
//   }, [playlist, unloadCurrent, onPlaybackStatusUpdate]);

//   // Public controls
//   const play = useCallback(async () => {
//     try {
//       if (soundRef.current) {
//         await soundRef.current.playAsync();
//         setIsPlaying(true);
//       }
//     } catch (e) { console.warn('play error', e); }
//   }, []);

//   const pause = useCallback(async () => {
//     try {
//       if (soundRef.current) {
//         await soundRef.current.pauseAsync();
//         setIsPlaying(false);
//       }
//     } catch (e) { console.warn('pause error', e); }
//   }, []);

//   const seek = useCallback(async (ms) => {
//     if (!soundRef.current) return;
//     try {
//       await soundRef.current.setPositionAsync(ms);
//       setPosition(ms);
//     } catch (e) { console.warn('seek error', e); }
//   }, []);

//   const next = useCallback(async () => {
//     if (!playlist || playlist.length === 0) return;
//     const nextIdx = isShuffle ? randomIndex(currentIndex) : ((currentIndex + 1) % playlist.length);
//     await loadIndex(nextIdx, { play: true });
//   }, [playlist, isShuffle, currentIndex, randomIndex, loadIndex]);

//   const previous = useCallback(async () => {
//     if (!playlist || playlist.length === 0) return;
//     const prevIdx = isShuffle ? randomIndex(currentIndex) : (currentIndex === 0 ? playlist.length - 1 : currentIndex - 1);
//     await loadIndex(prevIdx, { play: true });
//   }, [playlist, isShuffle, currentIndex, randomIndex, loadIndex]);

//   const toggleShuffle = useCallback(() => setIsShuffle(s => !s), []);
//   const toggleRepeat = useCallback(() => setRepeatMode(r => (r === 'off' ? 'one' : r === 'one' ? 'all' : 'off')), []);

//   // When playlist changed externally, ensure currentIndex still valid and update currentTrack
//   useEffect(() => {
//     if (!playlist || playlist.length === 0) {
//       // stop playback
//       (async () => { await unloadCurrent(); setCurrentTrack(null); setIsPlaying(false); setPosition(0); setDuration(1); })();
//       return;
//     }
//     if (currentIndex < 0 || currentIndex >= playlist.length) {
//       setCurrentIndex(0);
//       loadIndex(0, { play: false });
//       return;
//     }
//     // if playlist changed but track id differs, reload current index to refresh uri refs
//     const track = playlist[currentIndex];
//     if (track && (!currentTrack || currentTrack.id !== track.id)) {
//       // do not autoplay when playlist updated externally unless isPlaying was true previously
//       loadIndex(currentIndex, { play: isPlaying });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [playlist]);

//   const value = {
//     // state
//     playlist,
//     setPlaylist,
//     currentIndex,
//     setCurrentIndex: (i) => { if (typeof i === 'number') loadIndex(i, { play: true }); },
//     currentTrack,
//     isPlaying,
//     position,
//     duration,
//     isShuffle,
//     repeatMode,
//     // refs / sound
//     soundRef,
//     // controls
//     loadIndex,
//     play,
//     pause,
//     seek,
//     next,
//     previous,
//     toggleShuffle,
//     toggleRepeat,
//   };

//   return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
// }

// export default PlayerProvider;


import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { saveListeningHistory } from '../services/storageService'; // ✅ import

export const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off | one | all

  const soundRef = useRef(null);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Helper: pick random index not equal to exclude
  const randomIndex = useCallback((exclude) => {
    if (!playlist || playlist.length <= 1) return exclude ?? 0;
    let idx;
    do {
      idx = Math.floor(Math.random() * playlist.length);
    } while (idx === exclude);
    return idx;
  }, [playlist]);

  // Setup audio mode on mount
  useEffect(() => {
    mountedRef.current = true;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }).catch(() => {});
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safely unload current sound
  const unloadCurrent = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      s.setOnPlaybackStatusUpdate(null);
      await s.stopAsync().catch(() => {});
      await s.unloadAsync().catch(() => {});
    } catch (e) {
      console.warn('unload error', e);
    }
    soundRef.current = null;
  }, []);

  // Core: load track by index and optionally play
  const loadIndex = useCallback(
    async (index, { play = true } = {}) => {
      if (!playlist || playlist.length === 0) return;
      if (index < 0 || index >= playlist.length) return;
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      try {
        const track = playlist[index];
        if (!track) return;

        // unload previous track
        await unloadCurrent();

        // create new sound
        const { sound, status } = await Audio.Sound.createAsync(track.uri, {
          shouldPlay: !!play,
        });

        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

        setCurrentIndex(index);
        setCurrentTrack(track);
        await saveListeningHistory(track);
        setDuration(status?.durationMillis ?? 1);
        setPosition(status?.positionMillis ?? 0);
        setIsPlaying(!!status?.isPlaying);

        // ✅ Lưu lịch sử nghe nhạc
        await saveListeningHistory(track.id);
        console.log('🎧 Saved to history:', track.title);
      } catch (e) {
        console.warn('loadIndex error', e);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [playlist, unloadCurrent]
  );

  // Playback status handler
  const onPlaybackStatusUpdate = useCallback(
    (status) => {
      if (!status || !mountedRef.current) return;
      if (!status.isLoaded) return;

      setPosition(status.positionMillis ?? 0);
      setDuration(status.durationMillis ?? 1);
      setIsPlaying(!!status.isPlaying);

      if (status.didJustFinish) {
        // 🔁 Repeat one
        if (repeatMode === 'one') {
          soundRef.current?.setPositionAsync(0).then(() => {
            soundRef.current?.playAsync().catch(() => {});
          });
          return;
        }

        // 🎲 Shuffle or next
        const current = currentIndex;
        const nextIdx = isShuffle
          ? randomIndex(current)
          : current + 1 >= playlist.length
          ? repeatMode === 'all'
            ? 0
            : -1
          : current + 1;

        if (nextIdx === -1) {
          soundRef.current?.stopAsync().catch(() => {});
          setIsPlaying(false);
          return;
        }

        // load next track (async)
        setTimeout(() => loadIndex(nextIdx), 100);
      }
    },
    [currentIndex, isShuffle, repeatMode, playlist, randomIndex, loadIndex]
  );

  // Playback controls
  const play = useCallback(async () => {
    try {
      await soundRef.current?.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.warn('play error', e);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } catch (e) {
      console.warn('pause error', e);
    }
  }, []);

  const seek = useCallback(async (ms) => {
    try {
      await soundRef.current?.setPositionAsync(ms);
      setPosition(ms);
    } catch (e) {
      console.warn('seek error', e);
    }
  }, []);

  const next = useCallback(async () => {
    if (!playlist || playlist.length === 0) return;
    const nextIdx = isShuffle
      ? randomIndex(currentIndex)
      : (currentIndex + 1) % playlist.length;
    await loadIndex(nextIdx, { play: true });
  }, [playlist, isShuffle, currentIndex, randomIndex, loadIndex]);

  const previous = useCallback(async () => {
    if (!playlist || playlist.length === 0) return;
    const prevIdx = isShuffle
      ? randomIndex(currentIndex)
      : currentIndex === 0
      ? playlist.length - 1
      : currentIndex - 1;
    await loadIndex(prevIdx, { play: true });
  }, [playlist, isShuffle, currentIndex, randomIndex, loadIndex]);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);
  const toggleRepeat = useCallback(
    () =>
      setRepeatMode((r) =>
        r === 'off' ? 'one' : r === 'one' ? 'all' : 'off'
      ),
    []
  );

  // Handle playlist updates
  useEffect(() => {
    if (!playlist || playlist.length === 0) {
      (async () => {
        await unloadCurrent();
        setCurrentTrack(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(1);
      })();
      return;
    }

    if (currentIndex < 0 || currentIndex >= playlist.length) {
      setCurrentIndex(0);
      loadIndex(0, { play: false });
      return;
    }

    const track = playlist[currentIndex];
    if (track && (!currentTrack || currentTrack.id !== track.id)) {
      loadIndex(currentIndex, { play: isPlaying });
    }
  }, [playlist]);

  const value = {
    playlist,
    setPlaylist,
    currentIndex,
    setCurrentIndex: (i) => {
      if (typeof i === 'number') loadIndex(i, { play: true });
    },
    currentTrack,
    isPlaying,
    position,
    duration,
    isShuffle,
    repeatMode,
    soundRef,
    play,
    pause,
    seek,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export default PlayerProvider;
