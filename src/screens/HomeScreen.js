import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';
import {
  loadFavorites,
  saveFavorites,
  loadPlaylists,
  savePlaylists
} from '../services/storageService';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Playlist cá nhân
  const [playlists, setPlaylists] = useState([]); // [{ id, name, songs: [] }]
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [currentSongId, setCurrentSongId] = useState(null);

  /* =========================================================
     🔹 TẢI DỮ LIỆU TỪ ASYNCSTORAGE
  ========================================================= */
  useEffect(() => {
    (async () => {
      const storedFavs = await loadFavorites();
      const storedPlaylists = await loadPlaylists();
      if (storedFavs) setFavorites(storedFavs);
      if (storedPlaylists) setPlaylists(storedPlaylists);
    })();
  }, []);

  /* =========================================================
     🔹 CẬP NHẬT FAVORITE
  ========================================================= */
  const toggleFavorite = async (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    await saveFavorites(updated);
  };

  /* =========================================================
     🔹 CẬP NHẬT PLAYLIST
  ========================================================= */
  const addPlaylist = async () => {
    if (newPlaylistName.trim() === '') return;
    const updated = [
      ...playlists,
      { id: Date.now().toString(), name: newPlaylistName, songs: [] }
    ];
    setPlaylists(updated);
    await savePlaylists(updated);
    setNewPlaylistName('');
  };

  const addToPlaylist = async (playlistId, songId) => {
    const updated = playlists.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          songs: pl.songs.includes(songId)
            ? pl.songs.filter(id => id !== songId)
            : [...pl.songs, songId]
        };
      }
      return pl;
    });
    setPlaylists(updated);
    await savePlaylists(updated);
  };

  /* =========================================================
     🔹 LỌC DANH SÁCH
  ========================================================= */
  const filtered = songs.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.artist.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isFavorite = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('Player', { song: item })}
        activeOpacity={0.7}
      >
        <Image source={item.cover} style={styles.cover} />
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
        </View>

        {/* Heart icon */}
        <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#FF5A5F" : "#fff"}
          />
        </TouchableOpacity>

        {/* Playlist icon */}
        <TouchableOpacity
          onPress={() => { setCurrentSongId(item.id); setModalVisible(true); }}
          style={styles.favoriteButton}
        >
          <Ionicons name="musical-notes-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Play button */}
        <View style={styles.playButton}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Masou Music</Text>

        {/* Nút Playlist */}
        <TouchableOpacity
          style={{ position: 'absolute', right: 20, top: 75 }}
          onPress={() => navigation.navigate('PlaylistScreen', { playlists, setPlaylists })}
        >
          <Ionicons name="musical-notes" size={28} color="#0dc974ff" />
        </TouchableOpacity>

        {/* Nút Favorites */}
        <TouchableOpacity
          style={{ position: 'absolute', left: 20, top: 75 }}
          onPress={() => navigation.navigate('Favorite', { favorites, songs, setFavorites })}
        >
          <Ionicons name="heart" size={28} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm bài hát hoặc ca sĩ..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Danh sách nhạc */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={styles.flatList}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy bài hát</Text>}
      />

      {/* Modal playlist */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#0dc974' }}>
              Thêm vào Playlist
            </Text>

            {/* Danh sách playlist */}
            {playlists.length === 0 && (
              <Text style={{ color: '#aaa', marginBottom: 10 }}>Chưa có playlist nào</Text>
            )}
            {playlists.map(pl => (
              <TouchableOpacity
                key={pl.id}
                style={styles.playlistItem}
                onPress={() => addToPlaylist(pl.id, currentSongId)}
              >
                <Text style={{ color: '#fff', flex: 1 }}>{pl.name}</Text>
                {pl.songs.includes(currentSongId) && (
                  <Ionicons name="checkmark" size={20} color="#0dc974ff" />
                )}
              </TouchableOpacity>
            ))}

            {/* Tạo playlist mới */}
            <TextInput
              style={styles.modalInput}
              placeholder="Tên playlist mới..."
              placeholderTextColor="#888"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity onPress={addPlaylist} style={{ alignSelf: 'flex-end', marginTop: 5 }}>
              <Text style={{ color: '#0dc974ff', fontWeight: 'bold' }}>Tạo playlist</Text>
            </TouchableOpacity>

            {/* Đóng modal */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 15, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: '#aaa' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================
   🔸 STYLE GIỮ NGUYÊN
========================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center'
  },
  headerTitle: { paddingTop: 50, fontSize: 28, fontWeight: 'bold', color: '#0dc974ff' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a'
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    backgroundColor: '#1f1f1f',
    color: '#fff',
    paddingHorizontal: 15,
    caretColor: '#fff'
  },
  flatList: { flex: 1 },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: 16 },
  item: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
    borderRadius: 10
  },
  cover: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  songInfo: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  artist: { fontSize: 14, color: '#aaa' },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteButton: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: { width: '80%', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    marginTop: 10
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  }
});
