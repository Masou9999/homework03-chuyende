import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerContext } from '../context/PlayerContext';
import Slider from '@react-native-community/slider';

export default function MiniPlayer({ currentRouteName: propRouteName }) {
  const { currentTrack, isPlaying, play, pause, position, duration, soundRef, next, previous, playlist, currentIndex } = useContext(PlayerContext);
  const [seeking, setSeeking] = useState(false);
  const [tempPos, setTempPos] = useState(0);
  const nav = useNavigation();
  const routeName = propRouteName ?? nav.getState()?.routes?.[nav.getState().index]?.name;

  // hide on Player screen
  if (routeName === 'Player') return null;
  if (!currentTrack) return null;

  const onPress = () => {
    nav.navigate('Player', { song: currentTrack, songList: playlist, index: currentIndex });
  };

  const onSeekComplete = async (v) => {
    setSeeking(false);
    const pos = Math.max(0, Math.min(1, v)) * (duration || 1);
    try {
      if (soundRef?.current) await soundRef.current.setPositionAsync(pos);
    } catch (e) {}
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.info} pointerEvents="box-none">
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        <Slider
          style={{ width: '100%', height: 24 }}
          minimumValue={0}
          maximumValue={1}
          value={seeking ? (tempPos / (duration || 1)) : (duration ? (position / duration) : 0)}
          onValueChange={(v) => { setSeeking(true); setTempPos(v * (duration || 1)); }}
          onSlidingComplete={async (v) => { setSeeking(false); await onSeekComplete(v); }}
          minimumTrackTintColor="#00D4AA"
          maximumTrackTintColor="#404040"
        />
      </View>

      <View style={styles.controlsRow} pointerEvents="box-none">
        <TouchableOpacity onPress={previous} style={styles.iconBtn}>
          <Ionicons name={'play-skip-back'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.iconBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.iconBtn}>
          <Ionicons name={'play-skip-forward'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // raise the mini player slightly above bottom to avoid system gesture area on iOS/Android
  container: { position: 'absolute', left: 8, right: 8, bottom: Platform.OS === 'ios' ? 14 : 8, height: 68, backgroundColor: '#111', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#222' },
  info: { flex: 1, paddingRight: 8 },
  title: { color: '#fff', fontWeight: '600' },
  artist: { color: '#aaa', fontSize: 12 },
  controlsRow: { width: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 8 },
});
