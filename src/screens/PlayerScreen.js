// src/screens/PlayerScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerScreen({ route, navigation }) {
  const { song: initialSong } = route.params || {};
  const [sound, setSound] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(
    songs.findIndex(s => s.id === initialSong.id)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const positionRef = useRef(null);

  // ---------- AUDIO SETUP ----------
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true
    });
    loadSong(currentIndex);

    return () => {
      if (sound) sound.unloadAsync();
      if (positionRef.current) clearInterval(positionRef.current);
    };
  }, [currentIndex]);

  async function loadSong(index) {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    const { sound: newSound, status } = await Audio.Sound.createAsync(
      songs[index].uri,
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(newSound);
    setIsPlaying(true);
    setDuration(status.durationMillis || 1);

    positionRef.current = setInterval(async () => {
      const st = await newSound.getStatusAsync();
      if (st.isLoaded) setPosition(st.positionMillis);
    }, 500);
  }

  function onPlaybackStatusUpdate(status) {
    if (status.didJustFinish) nextSong();
  }

  const playPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const nextSong = () => setCurrentIndex((currentIndex + 1) % songs.length);
  const prevSong = () =>
    setCurrentIndex(currentIndex === 0 ? songs.length - 1 : currentIndex - 1);

  const seek = async (value) => {
    if (!sound) return;
    const seekPos = value * duration;
    await sound.setPositionAsync(seekPos);
    setPosition(seekPos);
  };

  const formatTime = ms => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentSong = songs[currentIndex];

  return (
    <View style={styles.container}>
      {/* Nút quay lại */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
      </TouchableOpacity>

      <Text style={styles.title}>{currentSong.title}</Text>
      <Text style={styles.artist}>{currentSong.artist}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={position / duration}
            onSlidingComplete={seek}
            minimumTrackTintColor="#00D4AA"
            maximumTrackTintColor="#404040"
            thumbStyle={styles.thumb}
            trackStyle={styles.track}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
          <View style={styles.prevIcon}>
            <View style={styles.prevBar} />
            <View style={styles.prevTriangle} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={playPause}>
          {isPlaying ? (
            <View style={styles.pauseIcon}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <View style={styles.playIcon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
          <View style={styles.nextIcon}>
            <View style={styles.nextTriangle} />
            <View style={styles.nextBar} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4,
    color: '#ffffff',
    textAlign: 'center'
  },
  artist: { 
    fontSize: 18, 
    marginBottom: 40, 
    color: '#aaaaaa',
    textAlign: 'center'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 10
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 15,
    height: 40,
    justifyContent: 'center'
  },
  slider: {
    width: '100%',
    height: 40
  },
  timeText: {
    fontSize: 12,
    color: '#aaaaaa',
    fontFamily: 'monospace',
    minWidth: 35
  },
  thumb: {
    backgroundColor: '#00D4AA',
    width: 12,
    height: 12
  },
  track: {
    height: 4,
    borderRadius: 2
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%'
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 25
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#ffffff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3
  },
  pauseIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 20
  },
  pauseBar: {
    width: 6,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 1
  },
  prevIcon: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  prevBar: {
    width: 2,
    height: 16,
    backgroundColor: '#ffffff',
    marginRight: 2
  },
  prevTriangle: {
    width: 0,
    height: 0,
    borderRightWidth: 10,
    borderLeftWidth: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightColor: '#ffffff',
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  nextIcon: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  nextTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#ffffff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginRight: 2
  },
  nextBar: {
    width: 2,
    height: 16,
    backgroundColor: '#ffffff'
  }
});
