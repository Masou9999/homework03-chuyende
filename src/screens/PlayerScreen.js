// // // src/screens/PlayerScreen.js
// // import React, { useEffect, useState, useRef } from 'react';
// // import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// // import { Audio } from 'expo-av';
// // import Slider from '@react-native-community/slider';
// // import { Ionicons } from '@expo/vector-icons';
// // import { getFavorites, saveFavorites } from '../services/storageService';
// // import { songs } from '../data/songs';

// // export default function PlayerScreen({ route, navigation }) {
// //   // ✅ lấy đúng tham số truyền vào
// //   const { song: initialSong, songList: incomingList = [] } = route.params || {};

// //   // ✅ danh sách thực tế (favorite / playlist / mặc định)
// //   const songList = incomingList.length > 0 ? incomingList : songs;
// //   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

// //   const [currentIndex, setCurrentIndex] = useState(initialIndex);
// //   const [isPlaying, setIsPlaying] = useState(false);
// //   const [position, setPosition] = useState(0);
// //   const [duration, setDuration] = useState(1);
// //   const [repeatMode, setRepeatMode] = useState('off');
// //   const [isShuffle, setIsShuffle] = useState(false);
// //   const [favorites, setFavorites] = useState([]);

// //   const soundRef = useRef(null);
// //   const cacheRef = useRef({});
// //   const positionRef = useRef(null);

// //   // ✅ load danh sách yêu thích
// //   useEffect(() => {
// //     (async () => {
// //       const favs = await getFavorites();
// //       setFavorites(favs || []);
// //     })();
// //     Audio.setAudioModeAsync({
// //       allowsRecordingIOS: false,
// //       staysActiveInBackground: true,
// //       playsInSilentModeIOS: true,
// //     });
// //   }, []);

// //   useEffect(() => {
// //     loadSong(currentIndex);
// //     preloadAdjacent(currentIndex);
// //     return () => clearPositionInterval();
// //   }, [currentIndex]);

// //   useEffect(() => () => unloadCurrentSound(), []);

// //   const clearPositionInterval = () => {
// //     if (positionRef.current) {
// //       clearInterval(positionRef.current);
// //       positionRef.current = null;
// //     }
// //   };

// //   const unloadCurrentSound = async () => {
// //     clearPositionInterval();
// //     if (soundRef.current) {
// //       try {
// //         await soundRef.current.stopAsync();
// //       } catch {}
// //       soundRef.current.setOnPlaybackStatusUpdate(null);
// //       soundRef.current = null;
// //     }
// //   };

// //   const preloadAdjacent = async (index) => {
// //     const toPreload = [index - 1, index + 1].filter(i => i >= 0 && i < songList.length);
// //     await Promise.allSettled(
// //       toPreload.map(async i => {
// //         if (!cacheRef.current[i]) {
// //           try {
// //             const { sound } = await Audio.Sound.createAsync(songList[i].uri, { shouldPlay: false });
// //             cacheRef.current[i] = sound;
// //           } catch {}
// //         }
// //       })
// //     );
// //   };

// //   async function loadSong(index) {
// //     try {
// //     clearPositionInterval();
// //     await unloadCurrentSound();

// //     const track = songList[index];
// //     if (!track) {
// //       console.warn('⚠️ Không tìm thấy bài hát ở index:', index);
// //       return;
// //     }

// //     console.log('🎵 Đang load bài:', track.title, track.uri);

// //     let newSound = cacheRef.current[index];
// //     const shouldPlay = true;

// //     // 🔹 Nếu đã có sound trong cache
// //     if (newSound) {
// //       const status = await newSound.getStatusAsync().catch(() => null);
// //       if (!status?.isLoaded) {
// //         const result = await Audio.Sound.createAsync(track.uri, { shouldPlay }).catch(() => null);
// //         newSound = result?.sound ?? null;
// //         cacheRef.current[index] = newSound;
// //       } else {
// //         await newSound.setPositionAsync(0);
// //         await newSound.playAsync();
// //       }
// //     } 
// //     // 🔹 Nếu chưa có trong cache, tạo mới
// //     else {
// //       const result = await Audio.Sound.createAsync(track.uri, { shouldPlay }).catch(() => null);
// //       newSound = result?.sound ?? null;
// //       cacheRef.current[index] = newSound;
// //     }

// //     // 🔹 Kiểm tra newSound có tồn tại không
// //     if (!newSound) {
// //       console.warn('⚠️ Không thể tạo sound cho bài:', track.title);
// //       return;
// //     }

// //     // Gán soundRef và setup update callback
// //     soundRef.current = newSound;
// //     newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

// //     const status = await newSound.getStatusAsync().catch(() => null);
// //     if (!status?.isLoaded) {
// //       console.warn('⚠️ Sound chưa load được:', track.title);
// //       return;
// //     }

// //     setDuration(status.durationMillis ?? 1);
// //     setPosition(status.positionMillis ?? 0);
// //     setIsPlaying(true);

// //     // Cập nhật vị trí phát định kỳ
// //     positionRef.current = setInterval(async () => {
// //       try {
// //         const st = await newSound.getStatusAsync();
// //         if (st.isLoaded) setPosition(st.positionMillis);
// //       } catch {}
// //     }, 250);
// //   } catch (e) {
// //     console.warn('loadSong error', e);
// //   }
// //   }
// // async function onPlaybackStatusUpdate(status) {
// //   if (!status?.isLoaded) return;
// //   setPosition(status.positionMillis ?? 0);
// //   setDuration(status.durationMillis ?? 1);

// //   if (status.didJustFinish) {
// //     if (repeatMode === 'one') {
// //       if (soundRef.current && status.isLoaded) {
// //         await soundRef.current.setPositionAsync(0);
// //         await soundRef.current.playAsync();
// //       }
// //     } else {
// //       // Dừng sound hiện tại để tránh conflict
// //       if (soundRef.current) {
// //         try {
// //           await soundRef.current.stopAsync();
// //         } catch {}
// //       }

// //       // Tính index bài kế
// //       setCurrentIndex(prev => {
// //         if (isShuffle) {
// //           return randomIndex(prev); // 🔥 random khi shuffle bật
// //         }
// //         const next = prev + 1;
// //         if (next >= songList.length) {
// //           return repeatMode === 'all' ? 0 : prev;
// //         }
// //         return next;
// //       });
// //     }
// //   }
// // }


// //   const playPause = async () => {
// //     const s = soundRef.current;
// //     if (!s) return;

// //     try {
// //       const st = await s.getStatusAsync();
// //       if (!st.isLoaded) return;

// //       if (st.isPlaying) {
// //         await s.pauseAsync();
// //         setIsPlaying(false);
// //       } else {
// //         await s.playAsync();
// //         setIsPlaying(true);
// //       }
// //     } catch (e) {
// //       console.warn('playPause error', e);
// //     }
// //   };


// //   const randomIndex = (exclude) => {
// //     let idx;
// //     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
// //     return idx;
// //   };

// //   const nextSong = () => {
// //     setCurrentIndex(prev =>
// //       isShuffle ? randomIndex(prev) : (prev + 1) % songList.length
// //     );
// //   };

// //   const prevSong = () => {
// //     setCurrentIndex(prev =>
// //       isShuffle ? randomIndex(prev) : prev === 0 ? songList.length - 1 : prev - 1
// //     );
// //   };

// //   const seek = async (value) => {
// //     if (!soundRef.current) return;
// //     const seekPos = Math.max(0, Math.min(1, value)) * duration;
// //     await soundRef.current.setPositionAsync(seekPos);
// //     setPosition(seekPos);
// //   };

// //   const toggleRepeat = () =>
// //     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
// //   const toggleShuffle = () => setIsShuffle(p => !p);

// //   // ❤️ Toggle favorite
// //   const toggleFavorite = async () => {
// //     const currentSong = songList[currentIndex];
// //     let updatedFavorites = [...favorites];
// //     if (favorites.some(f => f.id === currentSong.id)) {
// //       updatedFavorites = updatedFavorites.filter(f => f.id !== currentSong.id);
// //     } else {
// //       updatedFavorites.push(currentSong);
// //     }
// //     setFavorites(updatedFavorites);
// //     await saveFavorites(updatedFavorites);
// //   };

// //   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
// //   const formatTime = (ms) => {
// //     const sec = Math.floor((ms || 0) / 1000);
// //     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
// //   };

// //   const currentSong = songList[currentIndex] || {};

// //   return (
// //     <View style={styles.container}>
// //       {/* Nút back */}
// //       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
// //         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
// //       </TouchableOpacity>

// //       {/* Tên bài hát */}
// //       <Text style={styles.title}>{currentSong.title}</Text>
// //       <Text style={styles.artist}>{currentSong.artist}</Text>

      

// //       {/* Thanh tiến trình */}
// //       <View style={styles.progressContainer}>
// //         <Text style={styles.timeText}>{formatTime(position)}</Text>
// //         <Slider
// //           style={styles.slider}
// //           minimumValue={0}
// //           maximumValue={1}
// //           value={duration ? position / duration : 0}
// //           onSlidingComplete={seek}
// //           minimumTrackTintColor="#00D4AA"
// //           maximumTrackTintColor="#404040"
// //         />
// //         <Text style={styles.timeText}>{formatTime(duration)}</Text>
// //       </View>

// //       {/* Bộ điều khiển */}
// //       <View style={styles.controlsContainer}>
// //         <TouchableOpacity onPress={toggleShuffle}>
// //           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
// //           <Ionicons name="play-skip-back" size={28} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.playButton} onPress={playPause}>
// //           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
// //           <Ionicons name="play-skip-forward" size={28} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity onPress={toggleRepeat}>
// //           <Ionicons name="repeat" size={24} color={repeatMode === 'off' ? '#aaa' : '#0dc974'} />
// //           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
// //   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
// //   favoriteButton: { position: 'absolute', top: 70, right: 20, zIndex: 10 },
// //   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
// //   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
// //   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
// //   slider: { flex: 1, marginHorizontal: 10 },
// //   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
// //   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
// //   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
// //   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
// //   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// // });



// // src/screens/PlayerScreen.js
// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off -> one -> all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);

//   // For smooth seeking UX
//   const [isSeeking, setIsSeeking] = useState(false);
//   const [tempPosition, setTempPosition] = useState(0);

//   const soundRef = useRef(null);
//   const isLoadingRef = useRef(false);

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();

//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     }).catch(() => {});
//   }, []);

//   // load initial song on mount or when loadSong is explicitly requested
//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => {
//       // cleanup on unmount
//       if (soundRef.current) {
//         try {
//           soundRef.current.setOnPlaybackStatusUpdate(null);
//           soundRef.current.unloadAsync().catch(() => {});
//         } catch {}
//         soundRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // note: we call loadSong manually when we want to change songs

//   // ---------- helper: safely unload current sound ----------
//   const unloadCurrent = async () => {
//     if (soundRef.current) {
//       try {
//         soundRef.current.setOnPlaybackStatusUpdate(null);
//         await soundRef.current.stopAsync().catch(() => {});
//         await soundRef.current.unloadAsync().catch(() => {});
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   // ---------- main loader (can be called directly) ----------
//   const loadSong = async (index) => {
//     if (index < 0 || index >= songList.length) return;
//     // avoid concurrent loads
//     if (isLoadingRef.current) return;
//     isLoadingRef.current = true;
//     try {
//       const track = songList[index];
//       if (!track) return;

//       // Unload previous
//       await unloadCurrent();

//       // Create and play
//       const result = await Audio.Sound.createAsync(track.uri, { shouldPlay: true }).catch(e => {
//         console.warn('createAsync error', e);
//         return null;
//       });

//       const sound = result?.sound ?? null;
//       if (!sound) {
//         console.warn('Không tạo được sound cho', track?.title);
//         isLoadingRef.current = false;
//         return;
//       }

//       soundRef.current = sound;
//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

//       const st = await sound.getStatusAsync().catch(() => null);
//       setDuration(st?.durationMillis ?? 1);
//       setPosition(st?.positionMillis ?? 0);
//       setIsPlaying(!!st?.isPlaying);
//       setCurrentIndex(index); // keep index in sync
//     } catch (e) {
//       console.warn('loadSong error', e);
//     } finally {
//       isLoadingRef.current = false;
//     }
//   };

//   // ---------- playback status handler ----------
//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status) return;
//     if (!status.isLoaded) return;

//     // don't overwrite UI while user is seeking (but keep duration)
//     setDuration(status.durationMillis ?? 1);
//     if (!isSeeking) {
//       setPosition(status.positionMillis ?? 0);
//     }

//     setIsPlaying(!!status.isPlaying);

//     if (status.didJustFinish) {
//       // finished playing
//       if (repeatMode === 'one') {
//         // replay same track without unloading
//         try {
//           if (soundRef.current) {
//             await soundRef.current.setPositionAsync(0);
//             await soundRef.current.playAsync();
//           }
//         } catch (e) { console.warn('replay error', e); }
//         return;
//       }

//       // compute next index depending on shuffle / repeat all / off
//       const nextIndex = (() => {
//         if (isShuffle) {
//           // if only 1 song, return same
//           if (songList.length <= 1) return currentIndex;
//           // pick random != currentIndex
//           let idx;
//           do { idx = Math.floor(Math.random() * songList.length); } while (idx === currentIndex);
//           return idx;
//         } else {
//           const n = currentIndex + 1;
//           if (n >= songList.length) {
//             return repeatMode === 'all' ? 0 : -1; // -1 means stop
//           }
//           return n;
//         }
//       })();

//       if (nextIndex === -1) {
//         // repeat off and at end -> stop & keep position at duration
//         try {
//           if (soundRef.current) {
//             await soundRef.current.stopAsync().catch(() => {});
//           }
//         } catch {}
//         setIsPlaying(false);
//         setPosition(duration);
//         return;
//       }

//       // load next song immediately (avoid race by calling loadSong directly)
//       loadSong(nextIndex);
//     }
//   };

//   // ---------- play/pause ----------
//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const st = await s.getStatusAsync().catch(() => null);
//     if (!st || !st.isLoaded) return;
//     try {
//       if (st.isPlaying) {
//         await s.pauseAsync();
//         setIsPlaying(false);
//       } else {
//         await s.playAsync();
//         setIsPlaying(true);
//       }
//     } catch (e) {
//       console.warn('playPause error', e);
//     }
//   };

//   // ---------- seek UX: immediate visual + commit on release ----------
//   const onSeekValueChange = (value) => {
//     setIsSeeking(true);
//     const pos = Math.max(0, Math.min(1, value)) * (duration || 1);
//     setTempPosition(pos);
//     setPosition(pos); // show immediate feedback
//   };

//   const onSeekComplete = async (value) => {
//     setIsSeeking(false);
//     if (!soundRef.current) return;
//     const pos = Math.max(0, Math.min(1, value)) * (duration || 1);
//     try {
//       await soundRef.current.setPositionAsync(pos);
//       setPosition(pos);
//     } catch (e) {
//       console.warn('seek error', e);
//     }
//   };

//   // ---------- next / prev ----------
//   const randomIndex = (exclude) => {
//     if (songList.length <= 1) return exclude;
//     let idx;
//     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     if (isShuffle) {
//       loadSong(randomIndex(currentIndex));
//     } else {
//       const n = (currentIndex + 1) % songList.length;
//       loadSong(n);
//     }
//   };

//   const prevSong = () => {
//     if (isShuffle) {
//       loadSong(randomIndex(currentIndex));
//     } else {
//       const p = currentIndex === 0 ? songList.length - 1 : currentIndex - 1;
//       loadSong(p);
//     }
//   };

//   // ---------- controls ----------
//   const toggleRepeat = () =>
//     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle(p => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some(f => f.id === currentSong.id)) {
//       updated = updated.filter(f => f.id !== currentSong.id);
//     } else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated).catch(() => {});
//   };

//   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

//   const currentSong = songList[currentIndex] || {};

//   return (
//     <View style={styles.container}>
//       <Image source={currentSong.cover} style={styles.cover} />
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? (position / duration) : 0}
//           onValueChange={onSeekValueChange}
//           onSlidingComplete={onSeekComplete}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons name="repeat" size={24} color={repeatMode === 'off' ? '#aaa' : '#0dc974'} />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// });



// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off → one → all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);
//   const [volume, setVolume] = useState(1.0);

//   const soundRef = useRef(null);
//   const rotateAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     });
//   }, []);

//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => unloadSound();
//   }, [currentIndex]);

//   useEffect(() => {
//     if (isPlaying) {
//       startRotation();
//     } else {
//       stopRotation();
//     }
//   }, [isPlaying]);

//   const handleVolumeChange = async (value) => {
//     setVolume(value);
//     if (sound) {
//       await sound.setVolumeAsync(value);
//     }
//   };

//   const startRotation = () => {
//     Animated.loop(
//       Animated.timing(rotateAnim, {
//         toValue: 1,
//         duration: 8000,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const stopRotation = () => {
//     rotateAnim.stopAnimation();
//   };

//   const unloadSound = async () => {
//     if (soundRef.current) {
//       try {
//         await soundRef.current.stopAsync();
//         await soundRef.current.unloadAsync();
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   const loadSong = async (index) => {
//     try {
//       await unloadSound();
//       const track = songList[index];
//       if (!track) return;

//       const { sound } = await Audio.Sound.createAsync(track.uri, { shouldPlay: true });
//       soundRef.current = sound;
//       setIsPlaying(true);

//       const status = await sound.getStatusAsync();
//       setDuration(status.durationMillis || 1);
//       setPosition(status.positionMillis || 0);

//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
//     } catch (e) {
//       console.warn('loadSong error:', e);
//     }
//   };

//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status?.isLoaded) return;

//     setPosition(status.positionMillis ?? 0);
//     setDuration(status.durationMillis ?? 1);
//     setIsPlaying(status.isPlaying);

//     if (status.didJustFinish) {
//       if (repeatMode === 'one') {
//         await soundRef.current.setPositionAsync(0);
//         await soundRef.current.playAsync();
//       } else {
//         if (repeatMode === 'off' && currentIndex === songList.length - 1) {
//           setIsPlaying(false);
//           return;
//         }
//         const nextIndex = isShuffle
//           ? randomIndex(currentIndex)
//           : (currentIndex + 1) % songList.length;
//         setCurrentIndex(nextIndex);
//       }
//     }
//   };

//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const status = await s.getStatusAsync();
//     if (status.isPlaying) {
//       await s.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       await s.playAsync();
//       setIsPlaying(true);
//     }
//   };

//   const seek = async (value) => {
//     if (!soundRef.current) return;
//     const pos = value * duration;
//     await soundRef.current.setPositionAsync(pos);
//     setPosition(pos);
//   };

//   const randomIndex = (exclude) => {
//     let idx;
//     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     const next = isShuffle ? randomIndex(currentIndex) : (currentIndex + 1) % songList.length;
//     setCurrentIndex(next);
//   };

//   const prevSong = () => {
//     const prev = isShuffle
//       ? randomIndex(currentIndex)
//       : currentIndex === 0
//       ? songList.length - 1
//       : currentIndex - 1;
//     setCurrentIndex(prev);
//   };

//   const loadAudio = async () => {
//     if (sound) {
//       await sound.unloadAsync();
//     }

//     const { sound: newSound, status } = await Audio.Sound.createAsync(
//       { uri: song.url },
//       { shouldPlay: true, volume: volume }, // ⚙️ Áp dụng âm lượng hiện tại
//       updateStatus
//     );

//     setSound(newSound);
//     setIsPlaying(true);
//   };

  

//   const toggleRepeat = () =>
//     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle(p => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some(f => f.id === currentSong.id))
//       updated = updated.filter(f => f.id !== currentSong.id);
//     else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated);
//   };

//   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

  

//   const currentSong = songList[currentIndex] || {};
//   const rotateInterpolate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       {/* 🎵 Cover Art */}
//       <Animated.Image
//         source={currentSong.cover}
//         style={[
//           styles.coverImage,
//           { transform: [{ rotate: rotateInterpolate }] },
//         ]}
//       />

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? position / duration : 0}
//           onSlidingComplete={seek}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//        <View style={styles.volumeContainer}>
//         <Ionicons name="volume-low" size={20} color="#fff" />
//         <Slider
//           style={styles.volumeSlider}
//           minimumValue={0}
//           maximumValue={1}
//           value={volume}
//           onValueChange={handleVolumeChange}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Ionicons name="volume-high" size={20} color="#fff" />
//       </View>

//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons
//             name="repeat"
//             size={24}
//             color={repeatMode === 'off' ? '#aaa' : '#0dc974'}
//           />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>

      
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   coverImage: {
//     width: 250,
//     height: 250,
//     borderRadius: 125,
//     marginTop: 100,
//     marginBottom: 30,
//     borderWidth: 3,
//     borderColor: '#00D4AA',
//   },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
//   favoriteBtn: { marginTop: 30 },
//   shuffleButton: { position: 'absolute', bottom: 40 },
//   volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '70%', marginTop: 10 },
//   volumeSlider: { flex: 1, height: 40, marginHorizontal: 10 },
// });







// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off → one → all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);
//   const [volume, setVolume] = useState(1.0);

//   const soundRef = useRef(null);
//   const rotateAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();

//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     });
//   }, []);

//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => unloadSound();
//   }, [currentIndex]);

//   useEffect(() => {
//     if (isPlaying) startRotation();
//     else stopRotation();
//   }, [isPlaying]);

//   const startRotation = () => {
//     Animated.loop(
//       Animated.timing(rotateAnim, {
//         toValue: 1,
//         duration: 8000,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const stopRotation = () => {
//     rotateAnim.stopAnimation();
//   };

//   const unloadSound = async () => {
//     if (soundRef.current) {
//       try {
//         await soundRef.current.stopAsync();
//         await soundRef.current.unloadAsync();
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   const loadSong = async (index) => {
//     try {
//       await unloadSound();
//       const track = songList[index];
//       if (!track) return;

//       const { sound } = await Audio.Sound.createAsync(
//         track.uri,
//         { shouldPlay: true, volume } // ✅ Dùng volume hiện tại
//       );
//       soundRef.current = sound;
//       setIsPlaying(true);

//       const status = await sound.getStatusAsync();
//       setDuration(status.durationMillis || 1);
//       setPosition(status.positionMillis || 0);

//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
//     } catch (e) {
//       console.warn('loadSong error:', e);
//     }
//   };

//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status?.isLoaded) return;

//     setPosition(status.positionMillis ?? 0);
//     setDuration(status.durationMillis ?? 1);
//     setIsPlaying(status.isPlaying);

//     if (status.didJustFinish) {
//       if (repeatMode === 'one') {
//         await soundRef.current.setPositionAsync(0);
//         await soundRef.current.playAsync();
//       } else {
//         if (repeatMode === 'off' && currentIndex === songList.length - 1) {
//           setIsPlaying(false);
//           return;
//         }
//         const nextIndex = isShuffle
//           ? randomIndex(currentIndex)
//           : (currentIndex + 1) % songList.length;
//         setCurrentIndex(nextIndex);
//       }
//     }
//   };

//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const status = await s.getStatusAsync();
//     if (status.isPlaying) {
//       await s.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       await s.playAsync();
//       setIsPlaying(true);
//     }
//   };

//   const seek = async (value) => {
//     if (!soundRef.current) return;
//     const pos = value * duration;
//     await soundRef.current.setPositionAsync(pos);
//     setPosition(pos);
//   };

//   const handleVolumeChange = async (value) => {
//     setVolume(value);
//     if (soundRef.current) {
//       await soundRef.current.setVolumeAsync(value);
//     }
//   };

//   const randomIndex = (exclude) => {
//     let idx;
//     do {
//       idx = Math.floor(Math.random() * songList.length);
//     } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     const next = isShuffle
//       ? randomIndex(currentIndex)
//       : (currentIndex + 1) % songList.length;
//     setCurrentIndex(next);
//   };

//   const prevSong = () => {
//     const prev = isShuffle
//       ? randomIndex(currentIndex)
//       : currentIndex === 0
//       ? songList.length - 1
//       : currentIndex - 1;
//     setCurrentIndex(prev);
//   };

//   const toggleRepeat = () =>
//     setRepeatMode((p) => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle((p) => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some((f) => f.id === currentSong.id))
//       updated = updated.filter((f) => f.id !== currentSong.id);
//     else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated);
//   };

//   const isFavorite = favorites.some((f) => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

//   const currentSong = songList[currentIndex] || {};
//   const rotateInterpolate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       {/* 🎵 Cover Art */}
//       <Animated.Image
//         source={currentSong.cover}
//         style={[
//           styles.coverImage,
//           { transform: [{ rotate: rotateInterpolate }] },
//         ]}
//       />

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       {/* Progress bar */}
//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? position / duration : 0}
//           onSlidingComplete={seek}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//       {/* 🔊 Volume bar */}
//       <View style={styles.volumeContainer}>
//         <Ionicons name="volume-low" size={20} color="#fff" />
//         <Slider
//           style={styles.volumeSlider}
//           minimumValue={0}
//           maximumValue={1}
//           value={volume}
//           onValueChange={handleVolumeChange}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Ionicons name="volume-high" size={20} color="#fff" />
//       </View>

//       {/* Controls */}
//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons
//             name="repeat"
//             size={24}
//             color={repeatMode === 'off' ? '#aaa' : '#0dc974'}
//           />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   coverImage: {
//     width: 250,
//     height: 250,
//     borderRadius: 125,
//     marginTop: 100,
//     marginBottom: 30,
//     borderWidth: 3,
//     borderColor: '#00D4AA',
//   },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '70%', marginBottom: 25 },
//   volumeSlider: { flex: 1, height: 40, marginHorizontal: 10 },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// });








// src/screens/PlayerScreen.js

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { 
  getFavorites, 
  saveFavorites, 
  saveListeningHistory 
} from '../services/storageService';
import { songs } from '../data/songs';
import useAudioPlayer from '../hooks/useAudioPlayer';

export default function PlayerScreen({ route, navigation }) {
  const { song: initialSong, songList: incomingList = [] } = route.params || {};
  const songList = incomingList.length > 0 ? incomingList : songs;
  const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentIndexRef = useRef(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [repeatMode, setRepeatMode] = useState('off'); // off -> one -> all
  const [isShuffle, setIsShuffle] = useState(false);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleRef = useRef(isShuffle);
  const [favorites, setFavorites] = useState([]);
  const [volume, setVolume] = useState(1.0);

  const soundRef = useRef(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isLoadingRef = useRef(false);


  useEffect(() => {
    (async () => {
      const favs = await getFavorites();
      setFavorites(favs || []);
    })();

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }).catch(() => {});
  }, []);

  

  useEffect(() => {
    loadSong(currentIndex);
    return () => unloadSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (isPlaying) startRotation();
    else stopRotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const startRotation = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotateAnim.stopAnimation();
  };

  const unloadSound = async () => {
  if (soundRef.current) {
    try {
      // Dừng phát trước khi hủy
      await soundRef.current.stopAsync().catch(() => {});
      // Hủy listener cập nhật
      await soundRef.current.setOnPlaybackStatusUpdate(null);
      // Giải phóng tài nguyên
      await soundRef.current.unloadAsync().catch(() => {});
    } catch (e) {
      console.warn('unloadSound error:', e);
    }
    soundRef.current = null;
  }
};


const loadSong = async (index) => {
  if (isLoadingRef.current) return; // 🔒 tránh đè bài khi đang load
  isLoadingRef.current = true;

  try {
    // Dừng và giải phóng bài cũ trước
    await unloadSound();

    const track = songList[index];
    if (!track) {
      isLoadingRef.current = false;
      return;
    }

    // Tạo mới sound
    const { sound } = await Audio.Sound.createAsync(
      track.uri,
      { shouldPlay: true, volume }
    );

    if (!sound) {
      console.warn('Không tạo được sound cho', track?.title);
      isLoadingRef.current = false;
      return;
    }

    soundRef.current = sound;
    setIsPlaying(true);

    // Cập nhật thông tin
    const status = await sound.getStatusAsync();
    setDuration(status?.durationMillis || 1);
    setPosition(status?.positionMillis || 0);

    // Gán callback theo dõi phát nhạc
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    // Lưu lại index hiện tại
    setCurrentIndex(index);
    currentIndexRef.current = index;
  } catch (e) {
    console.warn('loadSong error:', e);
  } finally {
    // 🔓 mở khóa sau khi hoàn tất
    isLoadingRef.current = false;
  }
};

// const loadSong = async (index) => {
//   if (isLoadingRef.current) return;
//   isLoadingRef.current = true;

//   try {
//     await unloadSound();
//     const track = songList[index];
//     if (!track) {
//       isLoadingRef.current = false;
//       return;
//     }

//     const { sound } = await Audio.Sound.createAsync(track.uri, { shouldPlay: true, volume });

//     if (!sound) {
//       console.warn('Không tạo được sound cho', track?.title);
//       isLoadingRef.current = false;
//       return;
//     }

//     soundRef.current = sound;
//     setIsPlaying(true);

//     const status = await sound.getStatusAsync();
//     setDuration(status?.durationMillis || 1);
//     setPosition(status?.positionMillis || 0);
//     sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

//     // ✅ Lưu lịch sử nghe
//     await saveListeningHistory(track.id);

//     // ✅ Gửi event thông báo HomeScreen cập nhật
//     navigation.emit({ type: 'historyUpdate', data: { song: track } });

//     setCurrentIndex(index);
//     currentIndexRef.current = index;
//   } catch (e) {
//     console.warn('loadSong error:', e);
//   } finally {
//     isLoadingRef.current = false;
//   }
// };


  const onPlaybackStatusUpdate = async (status) => {
  if (!status?.isLoaded) return;

  // Cập nhật thanh tiến trình
  setPosition(status.positionMillis ?? 0);
  setDuration(status.durationMillis ?? 1);
  setIsPlaying(status.isPlaying);

  // ✅ Thêm phần này vào ngay sau khi cập nhật tiến trình
  if (
    status.isPlaying &&status.positionMillis >= (status.durationMillis - 500)
    
  ) {
    await handleSongEnd(); // Gọi hàm xử lý hết bài
  }

  // ✅ Giữ lại để đề phòng trường hợp didJustFinish hoạt động
  if (status.didJustFinish) {
    await handleSongEnd();
  }
};
const handleSongEnd = async () => {
  const sound = soundRef.current;
  if (!sound) return;

  const repeat = repeatModeRef.current;
  const shuffle = isShuffleRef.current;
  const total = songList.length;
  let nextIndex = currentIndexRef.current;

  // 🔁 repeat one → phát lại ngay
  if (repeat === 'one') {
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
      return;
    } catch (e) {
      console.warn('repeat one error', e);
      return;
    }
  }

  // 🔀 shuffle → chọn ngẫu nhiên bài khác
  if (shuffle) {
    nextIndex = randomIndex(currentIndexRef.current);
  } else {
    nextIndex = currentIndexRef.current + 1;
  }

  // 🧭 vượt quá danh sách
  if (nextIndex >= total) {
    if (repeat === 'all') {
      nextIndex = 0;
    } else {
      // repeat off → dừng hẳn
      try {
        setIsPlaying(false);
        await sound.stopAsync();
      } catch (e) {}
      return;
    }
  }

  // 🧹 Dọn bài cũ và load bài mới
  await unloadSound();
  await loadSong(nextIndex);
};


  const playPause = async () => {
    const s = soundRef.current;
    if (!s) return;
    const status = await s.getStatusAsync().catch(() => null);
    if (!status?.isLoaded) return;

    try {
      if (status.isPlaying) {
        await s.pauseAsync();
        setIsPlaying(false);
      } else {
        await s.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('playPause error', e);
    }
  };

  // wire headset / bluetooth remote gestures (AirPods taps) via useAudioPlayer
  useAudioPlayer({
    onPlay: async () => {
      // ensure sound exists
      if (!soundRef.current) return;
      try { await soundRef.current.playAsync(); setIsPlaying(true); } catch (e) {}
    },
    onPause: async () => {
      if (!soundRef.current) return;
      try { await soundRef.current.pauseAsync(); setIsPlaying(false); } catch (e) {}
    },
    onPlayPause: async () => {
      // toggle
      const s = soundRef.current;
      if (!s) return;
      try {
        const st = await s.getStatusAsync().catch(() => null);
        if (!st?.isLoaded) return;
        if (st.isPlaying) { await s.pauseAsync(); setIsPlaying(false); }
        else { await s.playAsync(); setIsPlaying(true); }
      } catch (e) {}
    },
    onNext: () => nextSong(),
    onPrevious: () => prevSong(),
  });

  const seek = async (value) => {
    if (!soundRef.current) return;
    const pos = value * duration;
    try {
      await soundRef.current.setPositionAsync(pos);
      setPosition(pos);
    } catch (e) { console.warn('seek error', e); }
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(value);
      } catch (e) { console.warn('setVolume error', e); }
    }
  };

  const randomIndex = (exclude) => {
    if (songList.length <= 1) return exclude;
    let idx;
    do {
      idx = Math.floor(Math.random() * songList.length);
    } while (idx === exclude);
    return idx;
  };

  const nextSong = async () => {
  if (isLoadingRef.current) return; // ngăn spam
  const idx = currentIndexRef.current;
  if (isShuffle) await loadSong(randomIndex(idx));
  else await loadSong((idx + 1) % songList.length);
};

const prevSong = async () => {
  if (isLoadingRef.current) return; // ngăn spam
  const idx = currentIndexRef.current;
  if (isShuffle) await loadSong(randomIndex(idx));
  else await loadSong(idx === 0 ? songList.length - 1 : idx - 1);
};


  const toggleRepeat = () =>
    setRepeatMode((p) => {
      var next = "";
      if (p == "off"&& isShuffle == false){
        next = "one";
      }else if (p == "one" ){
        next = "all";
      }else{
        next="off";
      }
      //const next = p === 'off' ? 'one' : p === 'one' ? 'all' : 'off';
      repeatModeRef.current = next;
      return next;
    });
  const toggleShuffle = () => setIsShuffle((p) => {
    if (repeatMode == "one") return p;
    const next = !p;
    isShuffleRef.current = next;
    return next;
  });

  const toggleFavorite = async () => {
    const currentSong = songList[currentIndex];
    let updated = [...favorites];
    if (favorites.some((f) => f.id === currentSong.id))
      updated = updated.filter((f) => f.id !== currentSong.id);
    else updated.push(currentSong);
    setFavorites(updated);
    await saveFavorites(updated).catch(() => {});
  };

  const isFavorite = favorites.some((f) => f.id === songList[currentIndex]?.id);
  const formatTime = (ms) => {
    const sec = Math.floor((ms || 0) / 1000);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const currentSong = songList[currentIndex] || {};
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ⬇️ Thêm dưới useRef
const positionTimer = useRef(null);

// ⬇️ Thêm sau useEffect khởi tạo đầu tiên
useEffect(() => {
  // clear interval khi unmount
  return () => {
    if (positionTimer.current) clearInterval(positionTimer.current);
  };
}, []);

// ⬇️ Thêm 1 useEffect khác để cập nhật liên tục mỗi khi sound thay đổi hoặc phát
useEffect(() => {
  if (!soundRef.current) return;
  if (positionTimer.current) clearInterval(positionTimer.current);

  // cập nhật mỗi 500ms
  positionTimer.current = setInterval(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status?.isLoaded) {
        setPosition(status.positionMillis ?? 0);
        setDuration(status.durationMillis ?? 1);
      }
    } catch (e) {}
  }, 500);

  return () => {
    if (positionTimer.current) clearInterval(positionTimer.current);
  };
}, [soundRef.current]);
// Đồng bộ ref mỗi khi thay đổi repeatMode
useEffect(() => {
  repeatModeRef.current = repeatMode;
}, [repeatMode]);

// Đồng bộ ref mỗi khi thay đổi shuffle
useEffect(() => {
  isShuffleRef.current = isShuffle;
  
}, [isShuffle]
);


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
      </TouchableOpacity>

      {/* cover */}
      <Animated.Image
        source={currentSong.cover}
        style={[styles.coverImage, { transform: [{ rotate: rotateInterpolate }] }]}
      />

      <Text style={styles.title}>{currentSong.title}</Text>
      <Text style={styles.artist}>{currentSong.artist}</Text>

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

      <View style={styles.volumeContainer}>
        <Ionicons name="volume-low" size={20} color="#fff" />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#00D4AA"
          maximumTrackTintColor="#404040"
        />
        <Ionicons name="volume-high" size={20} color="#fff" />
      </View>

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
  container: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
  coverImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginTop: 100,
    marginBottom: 30,
    borderWidth: 3,
    borderColor: '#00D4AA',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
  slider: { flex: 1, marginHorizontal: 10 },
  timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
  volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '70%', marginBottom: 25 },
  volumeSlider: { flex: 1, height: 40, marginHorizontal: 10 },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
  controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
  repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
});
