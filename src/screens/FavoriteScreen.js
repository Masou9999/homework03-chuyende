import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { songs } from '../data/songs';
import { saveFavorites, loadFavorites } from '../services/storageService'; // ✅ dùng storageService

export default function FavoriteScreen({ route, navigation }) {
  const { favorites, setFavorites } = route.params;

  // ✅ tạo state local để đảm bảo UI cập nhật ngay
  const [localFavorites, setLocalFavorites] = useState(favorites);

  // ✅ Tải danh sách yêu thích từ bộ nhớ cục bộ khi vào màn hình
  useEffect(() => {
    const fetchFavorites = async () => {
      const storedFavorites = await loadFavorites();
      if (storedFavorites && storedFavorites.length > 0) {
        setFavorites(storedFavorites);
        setLocalFavorites(storedFavorites);
      }
    };
    fetchFavorites();
  }, []);

  // ✅ đồng bộ khi favorites từ cha thay đổi
  useEffect(() => {
    setLocalFavorites(favorites);
    saveFavorites(favorites); // Lưu lại khi danh sách thay đổi
  }, [favorites]);

  const favoriteSongs = songs.filter(s => localFavorites.includes(s.id));

  // Hàm xóa bài hát khỏi yêu thích
  const handleRemoveFavorite = (songId) => {
    Alert.alert(
      "Xóa khỏi Yêu thích",
      "Bạn có chắc muốn xóa bài hát này khỏi danh sách Yêu thích?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const updated = localFavorites.filter(id => id !== songId);
            setFavorites(updated);
            setLocalFavorites(updated); // ✅ cập nhật ngay UI
            await saveFavorites(updated); // ✅ lưu thay đổi vào AsyncStorage
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <TouchableOpacity
        style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
        onPress={() => navigation.navigate('Player', { song: item, songList: favoriteSongs })}
      >
        <Image source={item.cover} style={styles.cover} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.artist}>{item.artist}</Text>
        </View>
        <Ionicons name="play-circle" size={28} color="#0dc974" />
      </TouchableOpacity>

      {/* Nút xóa */}
      <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)} style={{ marginLeft: 12 }}>
        <Ionicons name="trash-outline" size={26} color="#FF5A5F" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#0dc974" />
      </TouchableOpacity>

      <Text style={styles.header}>Bài hát yêu thích</Text>
      {favoriteSongs.length === 0 ? (
        <Text style={styles.empty}>Chưa có bài hát nào trong Yêu thích</Text>
      ) : (
        <FlatList
          data={favoriteSongs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 50 },
  backButton: { marginBottom: 10 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0dc974', marginBottom: 20, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  cover: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
  artist: { fontSize: 14, color: '#aaa' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 50, fontSize: 16 }
});
