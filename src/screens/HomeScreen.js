import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';

import {
  loadFavorites,
  saveFavorites,
  loadPlaylists,
  savePlaylists,
  loadListeningHistory,
  saveListeningHistory ,
  clearListeningHistory,
} from '../services/storageService';
import { PlayerContext } from '../context/PlayerContext';
export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Playlist cá nhân
  const [playlists, setPlaylists] = useState([]); // [{ id, name, songs: [] }]
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [currentSongId, setCurrentSongId] = useState(null);
  
  const { currentTrack } = useContext(PlayerContext);
  /* =========================================================
     🔹 TẢI DỮ LIỆU TỪ ASYNCSTORAGE
  ========================================================= */
  useEffect(() => {
  const interval = setInterval(async () => {
    const history = await loadListeningHistory();
    setListeningHistory(history);
  }, 2000); // cập nhật mỗi 2 giây

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    (async () => {
      const storedFavs = await loadFavorites();
      const storedPlaylists = await loadPlaylists();
      const history = await loadListeningHistory();
      if (storedFavs) setFavorites(storedFavs);
      if (storedPlaylists) setPlaylists(storedPlaylists);
      if (history) setListeningHistory(history);
      //await clearListeningHistory();

      // Tạo gợi ý dựa trên lịch sử nghe
      if (history && history.length > 0) {
        // Lấy các thể loại và nghệ sĩ phổ biến từ lịch sử
        const recentSongs = history.slice(0, 10).map(h => songs.find(s => s.id === h.songId));
        const artists = [...new Set(recentSongs.map(song => song?.artist))].filter(Boolean);
        
        // Tìm các bài hát tương tự dựa trên nghệ sĩ
        const recommendedSongs = songs.filter(song =>
          artists.includes(song.artist) && // Cùng nghệ sĩ
          !history.some(h => h.songId === song.id) && // Chưa nghe gần đây
          !recentSongs.some(s => s?.id === song.id) // Không trùng với bài gần đây
        );
        
        // Lấy ngẫu nhiên 5 bài từ danh sách gợi ý
        const shuffled = recommendedSongs.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 5));
      }

      // Tạo danh sách trending dựa trên số lượt nghe
      const songPlayCounts = history?.reduce((counts, record) => {
        counts[record.songId] = (counts[record.songId] || 0) + 1;
        return counts;
      }, {}) || {};

      const trending = songs
        .map(song => ({
          ...song,
          playCount: songPlayCounts[song.id] || 0
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 5);

      setTrendingSongs(trending);
    })();
  }, []);
   useEffect(() => {
    if (currentTrack) {
      (async () => {
        await saveListeningHistory(currentTrack);
        const updated = await loadListeningHistory();
        setListeningHistory(updated);
      })();
    }
  }, [currentTrack]);
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

  const renderSongItem = (item, type = 'list') => {
    const isFavorite = favorites.includes(item.id);
    const containerStyle = type === 'horizontal' ? styles.horizontalItem : styles.item;
    const coverStyle = type === 'horizontal' ? styles.horizontalCover : styles.cover;

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => navigation.navigate('Player', { song: item })}
        activeOpacity={0.7}
      >
        <Image source={item.cover} style={coverStyle} />
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
          {type === 'trending' && (
            <Text style={styles.playCount}>{item.playCount || 0} lượt nghe</Text>
          )}
        </View>

        {type === 'list' && (
          <>
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
          </>
        )}

        {/* Play button */}
        <View style={[styles.playButton, type === 'horizontal' && styles.smallPlayButton]}>
          <Ionicons name="play" size={type === 'horizontal' ? 16 : 20} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => renderSongItem(item);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Masou Music</Text>

        {/* Nút Playlist */}
        <TouchableOpacity
          style={styles.playlistButton}
          onPress={() => navigation.navigate('PlaylistScreen', { playlists, setPlaylists })}
        >
          <Ionicons name="musical-notes" size={28} color="#0dc974ff" />
        </TouchableOpacity>

        {/* Nút Favorites */}
        <TouchableOpacity
          style={styles.favoriteHeaderButton}
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

      {/* Section Container */}
      <View style={styles.sectionsContainer}>
        {/* Trending Section */}
        {trendingSongs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Xu hướng</Text>
              <Ionicons name="trending-up" size={24} color="#0dc974" />
            </View>
            <FlatList
              data={trendingSongs}
              keyExtractor={item => `trend-${item.id}`}
              renderItem={({ item }) => renderSongItem(item, 'trending')}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
            />
          </View>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
              <Ionicons name="star" size={24} color="#0dc974" />
            </View>
            <FlatList
              data={recommendations}
              keyExtractor={item => `rec-${item.id}`}
              renderItem={({ item }) => renderSongItem(item, 'horizontal')}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
            />
          </View>
        )}

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
          <Text style={styles.historyButtonText}>Lịch sử nghe nhạc</Text>
        </TouchableOpacity>

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
      </View>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.historyModalContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Lịch sử nghe nhạc</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
  data={listeningHistory}
  keyExtractor={(item, index) => `history-${item.songId}-${index}`}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setShowHistory(false);
        navigation.navigate('Player', { song: item });
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={item.cover} style={styles.cover} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.artist}>{item.artist}</Text>
        </View>
      </View>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  )}
  contentContainerStyle={styles.historyList}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={<Text style={styles.emptyText}>Chưa có lịch sử nghe nhạc</Text>}
/>

          </View>
        </View>
      </Modal>

      {/* Modal playlist */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Thêm vào Playlist</Text>

            {/* Danh sách playlist */}
            {playlists.length === 0 && (
              <Text style={styles.noPlaylistText}>Chưa có playlist nào</Text>
            )}
            {playlists.map(pl => (
              <TouchableOpacity
                key={pl.id}
                style={styles.playlistItem}
                onPress={() => addToPlaylist(pl.id, currentSongId)}
              >
                <Text style={styles.playlistItemText}>{pl.name}</Text>
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
            <TouchableOpacity onPress={addPlaylist} style={styles.createPlaylistButton}>
              <Text style={styles.createPlaylistText}>Tạo playlist</Text>
            </TouchableOpacity>

            {/* Đóng modal */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================
   🔸 STYLES - UI ĐẸP HIỆN ĐẠI
========================================================= */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a' 
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    alignItems: 'center'
  },
  headerTitle: { 
    paddingTop: 30, 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#0dc974',
    letterSpacing: 1
  },
  playlistButton: {
    position: 'absolute',
    right: 20,
    top: 75,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(13, 201, 116, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteHeaderButton: {
    position: 'absolute',
    left: 20,
    top: 75,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 90, 95, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0a0a0a'
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 15,
    caretColor: '#0dc974'
  },
  sectionsContainer: {
    flex: 1
  },
  section: {
    marginTop: 25,
    marginBottom: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff'
  },
  horizontalList: {
    paddingLeft: 20
  },
  horizontalItem: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  horizontalCover: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    marginBottom: 10
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  flatList: { 
    flex: 1 
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 100 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#666', 
    marginTop: 20, 
    fontSize: 16 
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  cover: { 
    width: 60, 
    height: 60, 
    borderRadius: 10, 
    marginRight: 15 
  },
  songInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff', 
    marginBottom: 4 
  },
  artist: { 
    fontSize: 14, 
    color: '#888' 
  },
  playCount: {
    fontSize: 12,
    color: '#0dc974',
    marginTop: 4
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0dc974',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0dc974',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5
  },
  smallPlayButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5
  },
  favoriteButton: { 
    marginRight: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: 40,
    height: 40
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: { 
    width: '85%', 
    backgroundColor: '#1a1a1a', 
    borderRadius: 20, 
    padding: 25,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0dc974',
    textAlign: 'center'
  },
  noPlaylistText: {
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    backgroundColor: '#0a0a0a',
    marginTop: 15,
    fontSize: 15
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 8
  },
  playlistItemText: {
    color: '#fff',
    flex: 1,
    fontSize: 15
  },
  createPlaylistButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#0dc974',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  createPlaylistText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#2a2a2a',
    borderRadius: 10
  },
  closeButtonText: {
    color: '#dfdfdfff',
    fontSize: 15
  },
  historyModalContainer: {
    width: '100%',
    height: '85%',
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0dc974'
  },
  historyList: {
    paddingHorizontal: 20,
    paddingTop: 15
  },
  historyItem: {
    marginBottom: 10
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginLeft: 15
  }
});
























































// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
// import { songs } from '../data/songs';
// import { Ionicons } from '@expo/vector-icons';
// import {
//   loadFavorites,
//   saveFavorites,
//   loadPlaylists,
//   savePlaylists,
//   loadListeningHistory
// } from '../services/storageService';

// export default function HomeScreen({ navigation }) {
//   const [query, setQuery] = useState('');
//   const [favorites, setFavorites] = useState([]);
//   const [recommendations, setRecommendations] = useState([]);
//   const [trendingSongs, setTrendingSongs] = useState([]);
//   const [listeningHistory, setListeningHistory] = useState([]);
//   const [showHistory, setShowHistory] = useState(false);

//   // Playlist cá nhân
//   const [playlists, setPlaylists] = useState([]); // [{ id, name, songs: [] }]
//   const [modalVisible, setModalVisible] = useState(false);
//   const [newPlaylistName, setNewPlaylistName] = useState('');
//   const [currentSongId, setCurrentSongId] = useState(null);

//   useEffect(() => {
//     (async () => {
//       const storedFavs = await loadFavorites();
//       const storedPlaylists = await loadPlaylists();
//       const history = await loadListeningHistory();
//       if (storedFavs) setFavorites(storedFavs);
//       if (storedPlaylists) setPlaylists(storedPlaylists);
//       if (history) setListeningHistory(history);
      
//       // Tạo gợi ý dựa trên lịch sử nghe
//       if (history && history.length > 0) {
//         // Lấy các thể loại và nghệ sĩ phổ biến từ lịch sử
//         const recentSongs = history.slice(0, 10).map(h => songs.find(s => s.id === h.songId));
//         const artists = [...new Set(recentSongs.map(song => song?.artist))].filter(Boolean);
        
//         // Tìm các bài hát tương tự dựa trên nghệ sĩ
//         const recommendedSongs = songs.filter(song =>
//           artists.includes(song.artist) && // Cùng nghệ sĩ
//           !history.some(h => h.songId === song.id) && // Chưa nghe gần đây
//           !recentSongs.some(s => s?.id === song.id) // Không trùng với bài gần đây
//         );
        
//         // Lấy ngẫu nhiên 5 bài từ danh sách gợi ý
//         const shuffled = recommendedSongs.sort(() => 0.5 - Math.random());
//         setRecommendations(shuffled.slice(0, 5));
//       }

//       // Tạo danh sách trending dựa trên số lượt nghe
//       const songPlayCounts = history?.reduce((counts, record) => {
//         counts[record.songId] = (counts[record.songId] || 0) + 1;
//         return counts;
//       }, {}) || {};

//       const trending = songs
//         .map(song => ({
//           ...song,
//           playCount: songPlayCounts[song.id] || 0
//         }))
//         .sort((a, b) => b.playCount - a.playCount)
//         .slice(0, 5);

//       setTrendingSongs(trending);
//     })();
//   }, []);

//   const toggleFavorite = async (id) => {
//     const updated = favorites.includes(id)
//       ? favorites.filter(favId => favId !== id)
//       : [...favorites, id];
//     setFavorites(updated);
//     await saveFavorites(updated);
//   };

//   const addPlaylist = async () => {
//     if (newPlaylistName.trim() === '') return;
//     const updated = [
//       ...playlists,
//       { id: Date.now().toString(), name: newPlaylistName, songs: [] }
//     ];
//     setPlaylists(updated);
//     await savePlaylists(updated);
//     setNewPlaylistName('');
//   };

//   const addToPlaylist = async (playlistId, songId) => {
//     const updated = playlists.map(pl => {
//       if (pl.id === playlistId) {
//         return {
//           ...pl,
//           songs: pl.songs.includes(songId)
//             ? pl.songs.filter(id => id !== songId)
//             : [...pl.songs, songId]
//         };
//       }
//       return pl;
//     });
//     setPlaylists(updated);
//     await savePlaylists(updated);
//   };

//   const filtered = songs.filter(item =>
//     item.title.toLowerCase().includes(query.toLowerCase()) ||
//     item.artist.toLowerCase().includes(query.toLowerCase())
//   );

//   const renderSongItem = (item, type = 'list') => {
//     const isFavorite = favorites.includes(item.id);
//     const containerStyle = type === 'horizontal' ? styles.horizontalItem : styles.item;
//     const coverStyle = type === 'horizontal' ? styles.horizontalCover : styles.cover;

//     return (
//       <TouchableOpacity
//         style={containerStyle}
//         onPress={() => navigation.navigate('Player', { song: item })}
//         activeOpacity={0.7}
//       >
//         <Image source={item.cover} style={coverStyle} />
//         <View style={styles.songInfo}>
//           <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
//           <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
//           {type === 'trending' && (
//             <Text style={styles.playCount}>{item.playCount || 0} lượt nghe</Text>
//           )}
//         </View>

//         {type === 'list' && (
//           <>
//             {/* Heart icon */}
//             <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteButton}>
//               <Ionicons
//                 name={isFavorite ? "heart" : "heart-outline"}
//                 size={24}
//                 color={isFavorite ? "#FF5A5F" : "#fff"}
//               />
//             </TouchableOpacity>

//             {/* Playlist icon */}
//             <TouchableOpacity
//               onPress={() => { setCurrentSongId(item.id); setModalVisible(true); }}
//               style={styles.favoriteButton}
//             >
//               <Ionicons name="musical-notes-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           </>
//         )}

//         {/* Play button */}
//         <View style={[styles.playButton, type === 'horizontal' && styles.smallPlayButton]}>
//           <Ionicons name="play" size={type === 'horizontal' ? 16 : 20} color="#fff" />
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderItem = ({ item }) => renderSongItem(item);

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Masou Music</Text>

//         {/* Nút Playlist */}
//         <TouchableOpacity
//           style={{ position: 'absolute', right: 20, top: 75 }}
//           onPress={() => navigation.navigate('PlaylistScreen', { playlists, setPlaylists })}
//         >
//           <Ionicons name="musical-notes" size={28} color="#0dc974ff" />
//         </TouchableOpacity>

//         {/* Nút Favorites */}
//         <TouchableOpacity
//           style={{ position: 'absolute', left: 20, top: 75 }}
//           onPress={() => navigation.navigate('Favorite', { favorites, songs, setFavorites })}
//         >
//           <Ionicons name="heart" size={28} color="#FF5A5F" />
//         </TouchableOpacity>
//       </View>

//       {/* Search bar */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Tìm bài hát hoặc ca sĩ..."
//           placeholderTextColor="#888"
//           value={query}
//           onChangeText={setQuery}
//           autoCapitalize="none"
//         />
//       </View>

//       {/* Section Container */}
//       <View style={styles.sectionsContainer}>
//         {/* Trending Section */}
//         {trendingSongs.length > 0 && (
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Xu hướng</Text>
//               <Ionicons name="trending-up" size={24} color="#0dc974" />
//             </View>
//             <FlatList
//               data={trendingSongs}
//               keyExtractor={item => `trend-${item.id}`}
//               renderItem={({ item }) => renderSongItem(item, 'trending')}
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.horizontalList}
//             />
//           </View>
//         )}

//         {/* Recommendations Section */}
//         {recommendations.length > 0 && (
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
//               <Ionicons name="star" size={24} color="#0dc974" />
//             </View>
//             <FlatList
//               data={recommendations}
//               keyExtractor={item => `rec-${item.id}`}
//               renderItem={({ item }) => renderSongItem(item, 'horizontal')}
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.horizontalList}
//             />
//           </View>
//         )}

//         {/* History Button */}
//         <TouchableOpacity
//           style={styles.historyButton}
//           onPress={() => setShowHistory(true)}
//         >
//           <Ionicons name="time-outline" size={24} color="#fff" />
//           <Text style={styles.historyButtonText}>Lịch sử nghe nhạc</Text>
//         </TouchableOpacity>

//         {/* Danh sách nhạc */}
//         <FlatList
//           data={filtered}
//           keyExtractor={item => item.id.toString()}
//           renderItem={renderItem}
//           style={styles.flatList}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           initialNumToRender={10}
//           ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy bài hát</Text>}
//         />
//       </View>

//       {/* History Modal */}
//       <Modal
//         visible={showHistory}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowHistory(false)}
//       >
//         <View style={styles.modalBackground}>
//           <View style={styles.historyModalContainer}>
//             <View style={styles.historyHeader}>
//               <Text style={styles.historyTitle}>Lịch sử nghe nhạc</Text>
//               <TouchableOpacity onPress={() => setShowHistory(false)}>
//                 <Ionicons name="close" size={24} color="#fff" />
//               </TouchableOpacity>
//             </View>
//             <FlatList
//               data={listeningHistory.map(h => ({
//                 ...songs.find(s => s.id === h.songId),
//                 timestamp: h.timestamp
//               }))}
//               keyExtractor={(item, index) => `history-${item.id}-${index}`}
//               renderItem={({ item }) => (
//                 <View style={styles.historyItem}>
//                   {renderSongItem(item)}
//                   <Text style={styles.timestamp}>
//                     {new Date(item.timestamp).toLocaleDateString()}
//                   </Text>
//                 </View>
//               )}
//               contentContainerStyle={styles.historyList}
//               showsVerticalScrollIndicator={false}
//               ListEmptyComponent={
//                 <Text style={styles.emptyText}>Chưa có lịch sử nghe nhạc</Text>
//               }
//             />
//           </View>
//         </View>
//       </Modal>

//       {/* Modal playlist */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalBackground}>
//           <View style={styles.modalContainer}>
//             <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#0dc974' }}>
//               Thêm vào Playlist
//             </Text>

//             {/* Danh sách playlist */}
//             {playlists.length === 0 && (
//               <Text style={{ color: '#888', marginBottom: 10 }}>
//                 Chưa có playlist nào. Tạo mới?
//               </Text>
//             )}

//             <FlatList
//               data={playlists}
//               keyExtractor={item => item.id}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.playlistItem}
//                   onPress={() => {
//                     addToPlaylist(item.id, currentSongId);
//                     setModalVisible(false);
//                   }}
//                 >
//                   <Text style={{ color: '#fff', flex: 1 }}>{item.name}</Text>
//                   {item.songs.includes(currentSongId) && (
//                     <Ionicons name="checkmark" size={24} color="#0dc974" />
//                   )}
//                 </TouchableOpacity>
//               )}
//             />

//             {/* Tạo playlist mới */}
//             <TextInput
//               style={styles.modalInput}
//               placeholder="Tên playlist mới..."
//               placeholderTextColor="#888"
//               value={newPlaylistName}
//               onChangeText={setNewPlaylistName}
//             />

//             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
//               <TouchableOpacity
//                 style={{ marginRight: 20 }}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={{ color: '#888' }}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity onPress={addPlaylist}>
//                 <Text style={{ color: '#0dc974' }}>Tạo mới</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#121212' 
//   },
//   header: {
//     backgroundColor: '#1a1a1a',
//     paddingTop: 50,
//     paddingBottom: 20,
//     alignItems: 'center'
//   },
//   headerTitle: { 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     color: '#0dc974ff' 
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#2a2a2a',
//     margin: 20,
//     paddingHorizontal: 15,
//     borderRadius: 10
//   },
//   searchIcon: { marginRight: 10 },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     color: '#fff',
//     fontSize: 16
//   },
//   sectionsContainer: {
//     flex: 1,
//   },
//   section: {
//     marginBottom: 20,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   horizontalList: {
//     height: 180,
//     paddingLeft: 20,
//   },
//   horizontalItem: {
//     width: 150,
//     marginRight: 15,
//     backgroundColor: '#2a2a2a',
//     borderRadius: 10,
//     padding: 10,
//   },
//   horizontalCover: {
//     width: 130,
//     height: 130,
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   flatList: { 
//     flex: 1 
//   },
//   listContainer: { 
//     paddingHorizontal: 20 
//   },
//   emptyText: { 
//     color: '#888', 
//     textAlign: 'center', 
//     marginTop: 20 
//   },
//   item: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     backgroundColor: '#2a2a2a',
//     marginBottom: 10,
//     borderRadius: 10
//   },
//   cover: { 
//     width: 60, 
//     height: 60, 
//     borderRadius: 8, 
//     marginRight: 15 
//   },
//   songInfo: { 
//     flex: 1, 
//     justifyContent: 'center' 
//   },
//   title: { 
//     fontSize: 16, 
//     fontWeight: '600', 
//     color: '#fff', 
//     marginBottom: 4 
//   },
//   artist: { 
//     fontSize: 14, 
//     color: '#aaa' 
//   },
//   playButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#00D4AA',
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   favoriteButton: { 
//     marginRight: 10, 
//     justifyContent: 'center', 
//     alignItems: 'center' 
//   },
//   modalBackground: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   modalContainer: { 
//     width: '80%', 
//     backgroundColor: '#1a1a1a', 
//     borderRadius: 10, 
//     padding: 20 
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: '#555',
//     borderRadius: 8,
//     padding: 10,
//     color: '#fff',
//     backgroundColor: '#2a2a2a',
//     marginTop: 10
//   },
//   playlistItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333'
//   },
//   historyButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#2a2a2a',
//     margin: 20,
//     padding: 15,
//     borderRadius: 10,
//     justifyContent: 'center',
//   },
//   historyButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 10,
//   },
//   historyModalContainer: {
//     flex: 1,
//     backgroundColor: '#121212',
//     marginTop: 50,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     width: '100%',
//   },
//   historyHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#2a2a2a',
//   },
//   historyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   historyList: {
//     padding: 20,
//   },
//   historyItem: {
//     marginBottom: 15,
//   },
//   timestamp: {
//     color: '#888',
//     fontSize: 12,
//     marginTop: 5,
//     marginLeft: 15,
//   },
//   playCount: {
//     color: '#0dc974',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   smallPlayButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//   },
// });
