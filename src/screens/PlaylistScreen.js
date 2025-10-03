import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';

export default function PlaylistScreen({ route, navigation }) {
  const { playlists, setPlaylists } = route.params;
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

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
            setPlaylists(prev =>
              prev.map(pl => pl.id === playlistId
                ? { ...pl, songs: pl.songs.filter(id => id !== songId) }
                : pl
              )
            );
          }
        }
      ]
    );
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => setSelectedPlaylist(item)}
    >
      <Text style={{ color: '#fff', fontSize: 16 }}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }) => {
    const song = songs.find(s => s.id === item);
    if (!song) return null;

    return (
      <View style={styles.songItem}>
        <Text style={{ color: '#fff', flex: 1 }}>{song.title}</Text>
        <TouchableOpacity onPress={() => handleDeleteSong(selectedPlaylist.id, song.id)}>
          <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Chỉ 1 nút quay lại, xử lý 2 tình huống */}
      <TouchableOpacity
        onPress={() => {
          if (selectedPlaylist) {
            setSelectedPlaylist(null); // quay lại danh sách playlist
          } else {
            navigation.goBack(); // quay lại màn hình trước (Home)
          }
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#20a758ff" />
        <Text style={{ color: '#fff', marginLeft: 5 }}></Text>
      </TouchableOpacity>

      {selectedPlaylist ? (
        <>
          <Text style={styles.headerTitle}>{selectedPlaylist.name}</Text>
          <FlatList
            data={selectedPlaylist.songs}
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
          data={playlists}
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
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 35, fontWeight: 'bold', color: '#0dc974ff', marginBottom: 10, textAlign: 'center',  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10
  },
});
