// src/screens/FavoriteScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { songs } from '../data/songs';

export default function FavoriteScreen({ route, navigation }) {
  const { favorites } = route.params;

  const favoriteSongs = songs.filter(s => favorites.includes(s.id));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Player', { song: item })}
    >
      <Image source={item.cover} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.artist}>{item.artist}</Text>
      </View>
      <Ionicons name="play-circle" size={28} color="#0dc974" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0dc974', marginBottom: 20, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 10, padding: 10, marginBottom: 10 },
  cover: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
  artist: { fontSize: 14, color: '#aaa' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 50, fontSize: 16 }
});
