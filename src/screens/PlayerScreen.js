// src/screens/PlayerScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { getFavorites, saveFavorites } from '../services/storageService';
import { songs } from '../data/songs';

export default function PlayerScreen({ route, navigation }) {
  // ✅ lấy đúng tham số truyền vào
  const { song: initialSong, songList: incomingList = [] } = route.params || {};

  // ✅ danh sách thực tế (favorite / playlist / mặc định)
  const songList = incomingList.length > 0 ? incomingList : songs;
  const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [repeatMode, setRepeatMode] = useState('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const soundRef = useRef(null);
  const cacheRef = useRef({});
  const positionRef = useRef(null);

  // ✅ load danh sách yêu thích
  useEffect(() => {
    (async () => {
      const favs = await getFavorites();
      setFavorites(favs || []);
    })();
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadSong(currentIndex);
    preloadAdjacent(currentIndex);
    return () => clearPositionInterval();
  }, [currentIndex]);

  useEffect(() => () => unloadCurrentSound(), []);

  const clearPositionInterval = () => {
    if (positionRef.current) {
      clearInterval(positionRef.current);
      positionRef.current = null;
    }
  };

  const unloadCurrentSound = async () => {
    clearPositionInterval();
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {}
      soundRef.current.setOnPlaybackStatusUpdate(null);
      soundRef.current = null;
    }
  };

  const preloadAdjacent = async (index) => {
    const toPreload = [index - 1, index + 1].filter(i => i >= 0 && i < songList.length);
    await Promise.allSettled(
      toPreload.map(async i => {
        if (!cacheRef.current[i]) {
          try {
            const { sound } = await Audio.Sound.createAsync(songList[i].uri, { shouldPlay: false });
            cacheRef.current[i] = sound;
          } catch {}
        }
      })
    );
  };

  async function loadSong(index) {
    try {
      clearPositionInterval();
      await unloadCurrentSound();

      const track = songList[index];
      if (!track) return;

      let newSound = cacheRef.current[index];
      let shouldPlay = true;

      if (newSound) {
        const status = await newSound.getStatusAsync();
        if (!status.isLoaded) {
          const { sound } = await Audio.Sound.createAsync(track.uri, { shouldPlay });
          newSound = sound;
          cacheRef.current[index] = sound;
        } else {
          await newSound.setPositionAsync(0);
          await newSound.playAsync();
        }
      } else {
        const { sound } = await Audio.Sound.createAsync(track.uri, { shouldPlay });
        newSound = sound;
        cacheRef.current[index] = sound;
      }

      soundRef.current = newSound;
      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

      const status = await newSound.getStatusAsync();
      setDuration(status.durationMillis ?? 1);
      setPosition(status.positionMillis ?? 0);
      setIsPlaying(true);

      positionRef.current = setInterval(async () => {
        try {
          const st = await newSound.getStatusAsync();
          if (st.isLoaded) setPosition(st.positionMillis);
        } catch {}
      }, 250);
    } catch (e) {
      console.warn('loadSong error', e);
    }
  }

  async function onPlaybackStatusUpdate(status) {
    if (!status?.isLoaded) return;
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 1);

    if (status.didJustFinish) {
      if (repeatMode === 'one') {
        await soundRef.current.replayAsync();
      } else {
        setCurrentIndex(prev => {
          if (isShuffle) return randomIndex(prev);
          const next = prev + 1;
          return next >= songList.length ? (repeatMode === 'all' ? 0 : prev) : next;
        });
      }
    }
  }

  const playPause = async () => {
    const s = soundRef.current;
    if (!s) return;
    setIsPlaying(prev => !prev);
    try {
      const st = await s.getStatusAsync();
      if (!st.isLoaded) return;
      if (st.isPlaying) await s.pauseAsync();
      else await s.playAsync();
    } catch (e) {
      console.warn('playPause error', e);
    }
  };

  const randomIndex = (exclude) => {
    let idx;
    do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
    return idx;
  };

  const nextSong = () => {
    setCurrentIndex(prev =>
      isShuffle ? randomIndex(prev) : (prev + 1) % songList.length
    );
  };

  const prevSong = () => {
    setCurrentIndex(prev =>
      isShuffle ? randomIndex(prev) : prev === 0 ? songList.length - 1 : prev - 1
    );
  };

  const seek = async (value) => {
    if (!soundRef.current) return;
    const seekPos = Math.max(0, Math.min(1, value)) * duration;
    await soundRef.current.setPositionAsync(seekPos);
    setPosition(seekPos);
  };

  const toggleRepeat = () =>
    setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
  const toggleShuffle = () => setIsShuffle(p => !p);

  // ❤️ Toggle favorite
  const toggleFavorite = async () => {
    const currentSong = songList[currentIndex];
    let updatedFavorites = [...favorites];
    if (favorites.some(f => f.id === currentSong.id)) {
      updatedFavorites = updatedFavorites.filter(f => f.id !== currentSong.id);
    } else {
      updatedFavorites.push(currentSong);
    }
    setFavorites(updatedFavorites);
    await saveFavorites(updatedFavorites);
  };

  const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
  const formatTime = (ms) => {
    const sec = Math.floor((ms || 0) / 1000);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const currentSong = songList[currentIndex] || {};

  return (
    <View style={styles.container}>
      {/* Nút back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
      </TouchableOpacity>

      {/* Tên bài hát */}
      <Text style={styles.title}>{currentSong.title}</Text>
      <Text style={styles.artist}>{currentSong.artist}</Text>

      {/* ❤️ Nút yêu thích */}
      <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={28}
          color={isFavorite ? '#ff4d4d' : '#aaa'}
        />
      </TouchableOpacity>

      {/* Thanh tiến trình */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={duration ? position / duration : 0}
          onSlidingComplete={seek}
          minimumTrackTintColor="#00D4AA"
          maximumTrackTintColor="#404040"
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Bộ điều khiển */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={toggleShuffle}>
          <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
          <Ionicons name="play-skip-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={playPause}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
          <Ionicons name="play-skip-forward" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleRepeat}>
          <Ionicons name="repeat" size={24} color={repeatMode === 'off' ? '#aaa' : '#0dc974'} />
          {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
  favoriteButton: { position: 'absolute', top: 70, right: 20, zIndex: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
  slider: { flex: 1, marginHorizontal: 10 },
  timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
  controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
  repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
});
