import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';
import { savePlaylists, loadPlaylists } from '../services/storageService';

export default function PlaylistScreen({ route, navigation }) {
  const { playlists: initialPlaylists = [], setPlaylists } = route.params || {};

  const [localPlaylists, setLocalPlaylists] = useState(initialPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // ✅ Load playlists từ AsyncStorage khi mở màn
  useEffect(() => {
    const fetchPlaylists = async () => {
      const stored = await loadPlaylists();
      if (stored && stored.length > 0) {
        setLocalPlaylists(stored);
        if (typeof setPlaylists === 'function') setPlaylists(stored);
      }
    };
    fetchPlaylists();
  }, []);

  // ✅ Đồng bộ khi playlists thay đổi từ cha
  useEffect(() => {
    setLocalPlaylists(initialPlaylists);
    if (selectedPlaylist) {
      const updated = initialPlaylists.find(pl => pl.id === selectedPlaylist.id);
      setSelectedPlaylist(updated || null);
    }
  }, [initialPlaylists]);

  // ✅ Lưu playlists mỗi khi localPlaylists thay đổi
  useEffect(() => {
    if (localPlaylists) savePlaylists(localPlaylists);
  }, [localPlaylists]);

  // 🗑 Xóa bài hát trong playlist
  const handleDeleteSong = (playlistId, songId) => {
    Alert.alert(
      'Xóa bài hát',
      'Bạn có chắc muốn xóa bài hát này khỏi playlist?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setLocalPlaylists(prevLocal => {
              const updated = prevLocal.map(pl =>
                pl.id === playlistId
                  ? { ...pl, songs: pl.songs.filter(id => id !== songId) }
                  : pl
              );
              const newSelected = updated.find(pl => pl.id === playlistId) || null;
              setSelectedPlaylist(newSelected);
              if (typeof setPlaylists === 'function') setPlaylists(updated);
              return updated;
            });
          },
        },
      ]
    );
  };

  // 🗑 Xóa cả playlist
  const handleDeletePlaylist = (playlistId) => {
    Alert.alert(
      'Xóa playlist',
      'Bạn có chắc muốn xóa playlist này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setLocalPlaylists(prevLocal => {
              const updated = prevLocal.filter(pl => pl.id !== playlistId);
              if (selectedPlaylist?.id === playlistId) {
                setSelectedPlaylist(null);
              }
              if (typeof setPlaylists === 'function') setPlaylists(updated);
              return updated;
            });
          },
        },
      ]
    );
  };

  // 🎵 Khi chọn bài hát trong playlist — chỉ phát danh sách của playlist đó
  const handlePlaySongInPlaylist = (song) => {
    if (!selectedPlaylist || !selectedPlaylist.songs) return;

    const playlistSongs = selectedPlaylist.songs
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    navigation.navigate('Player', {
      song,
      songList: playlistSongs, // 👈 chỉ danh sách bài hát trong playlist
      source: 'playlist',
      playlistName: selectedPlaylist.name,
    });
  };

  // 📂 Giao diện từng playlist
  const renderPlaylistItem = ({ item }) => (
    <View style={styles.playlistItem}>
      <TouchableOpacity
        style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
        onPress={() => {
          const latest = localPlaylists.find(pl => pl.id === item.id) || item;
          setSelectedPlaylist(latest);
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, flex: 1 }}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleDeletePlaylist(item.id)} style={{ marginLeft: 12 }}>
        <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
      </TouchableOpacity>
    </View>
  );

  // 🎵 Giao diện từng bài trong playlist
  const renderSongItem = ({ item }) => {
    const song = songs.find(s => s.id === item);
    if (!song) return null;

    return (
      <TouchableOpacity
        style={styles.songItem}
        onPress={() => handlePlaySongInPlaylist(song)}
      >
        <Image source={song.cover} style={styles.songImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{song.title}</Text>
          <Text style={{ color: '#aaa', fontSize: 14 }}>{song.artist}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteSong(selectedPlaylist.id, song.id)}>
          <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Nút Back */}
      <TouchableOpacity
        onPress={() => {
          if (selectedPlaylist) setSelectedPlaylist(null);
          else navigation.goBack();
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={30} color="#0dc974" />
      </TouchableOpacity>

      {/* 📜 Giao diện hiển thị */}
      {selectedPlaylist ? (
        <>
          <Text style={styles.headerTitle}>{selectedPlaylist.name}</Text>
          <FlatList
            data={selectedPlaylist?.songs || []}
            keyExtractor={item => item.toString()}
            renderItem={renderSongItem}
            contentContainerStyle={{ paddingTop: 10 }}
            ListEmptyComponent={
              <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                Chưa có bài hát nào
              </Text>
            }
          />
        </>
      ) : (
        <FlatList
          data={localPlaylists}
          keyExtractor={item => item.id}
          renderItem={renderPlaylistItem}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
              Chưa có playlist nào
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 70 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0dc974ff',
    marginBottom: 15,
    textAlign: 'center',
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
});
