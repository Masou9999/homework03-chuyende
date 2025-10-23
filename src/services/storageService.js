// import AsyncStorage from '@react-native-async-storage/async-storage';

// // 🔹 Key riêng biệt trong bộ nhớ
// const FAVORITES_KEY = '@favorites_list';
// const PLAYLISTS_KEY = '@playlists_list';
// const HISTORY_KEY = '@listening_history';

// // 🔸 Bộ nhớ đệm cục bộ giúp phản hồi nhanh hơn
// let cache = {
//   favorites: null,
//   playlists: null,
//   history: null,
// };

// /* ============================================================
//    🔸 FAVORITES (DANH SÁCH YÊU THÍCH)
//    ============================================================ */

// // Lưu favorites (tối ưu phản hồi nhanh)
// export const saveFavorites = async (favorites) => {
//   try {
//     cache.favorites = favorites;
//     await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
//     console.log('✅ Favorites saved:', favorites);
//   } catch (error) {
//     console.error('❌ Error saving favorites:', error);
//   }
// };

// // Tải favorites từ cache hoặc AsyncStorage
// export const loadFavorites = async () => {
//   try {
//     if (cache.favorites !== null) return cache.favorites;
//     const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
//     cache.favorites = jsonValue != null ? JSON.parse(jsonValue) : [];
//     return cache.favorites;
//   } catch (error) {
//     console.error('❌ Error loading favorites:', error);
//     return [];
//   }
// };

// // Xóa favorites
// export const clearFavorites = async () => {
//   try {
//     cache.favorites = [];
//     await AsyncStorage.removeItem(FAVORITES_KEY);
//     console.log('🗑 Favorites cleared');
//   } catch (error) {
//     console.error('❌ Error clearing favorites:', error);
//   }
// };

// /* ============================================================
//    🔸 LISTENING HISTORY
//    ============================================================ */

// // Lưu lịch sử nghe nhạc
// export const saveListeningHistory = async (songId) => {
//   try {
//     let history = await loadListeningHistory();
//     // Thêm timestamp để theo dõi thời gian nghe
//     history.unshift({ songId, timestamp: Date.now() });
//     // Giới hạn lịch sử 50 bài gần nhất
//     history = history.slice(0, 50);
//     cache.history = history;
//     await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
//     console.log('✅ History saved:', history);
//   } catch (error) {
//     console.error('❌ Error saving history:', error);
//   }
// };

// // Tải lịch sử nghe nhạc
// export const loadListeningHistory = async () => {
//   try {
//     if (cache.history !== null) return cache.history;
//     const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
//     cache.history = jsonValue != null ? JSON.parse(jsonValue) : [];
//     return cache.history;
//   } catch (error) {
//     console.error('❌ Error loading history:', error);
//     return [];
//   }
// };

// /* ============================================================
//    🔸 PLAYLISTS (DANH SÁCH PHÁT)
//    ============================================================ */

// // Lưu tất cả playlists
// export const savePlaylists = async (playlists) => {
//   try {
//     cache.playlists = playlists;
//     await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
//     console.log('✅ Playlists saved:', playlists);
//   } catch (error) {
//     console.error('❌ Error saving playlists:', error);
//   }
// };

// // Tải tất cả playlists
// export const loadPlaylists = async () => {
//   try {
//     if (cache.playlists !== null) return cache.playlists;
//     const jsonValue = await AsyncStorage.getItem(PLAYLISTS_KEY);
//     cache.playlists = jsonValue != null ? JSON.parse(jsonValue) : [];
//     return cache.playlists;
//   } catch (error) {
//     console.error('❌ Error loading playlists:', error);
//     return [];
//   }
// };

// // Thêm 1 bài hát vào playlist cụ thể
// export const addSongToPlaylist = async (playlistId, song) => {
//   try {
//     const playlists = await loadPlaylists();
//     const updated = playlists.map(p => {
//       if (p.id === playlistId) {
//         // Nếu bài hát chưa có thì thêm vào
//         const exists = p.songs.some(s => s.id === song.id);
//         if (!exists) p.songs.push(song);
//       }
//       return p;
//     });
//     await savePlaylists(updated);
//     console.log(`🎵 Added "${song.title}" to playlist ID: ${playlistId}`);
//   } catch (error) {
//     console.error('❌ Error adding song to playlist:', error);
//   }
// };

// // Xóa bài hát khỏi playlist
// export const removeSongFromPlaylist = async (playlistId, songId) => {
//   try {
//     const playlists = await loadPlaylists();
//     const updated = playlists.map(p => {
//       if (p.id === playlistId) {
//         p.songs = p.songs.filter(s => s.id !== songId);
//       }
//       return p;
//     });
//     await savePlaylists(updated);
//     console.log(`🗑 Removed song ID ${songId} from playlist ${playlistId}`);
//   } catch (error) {
//     console.error('❌ Error removing song from playlist:', error);
//   }
// };

// // Xóa toàn bộ playlists
// export const clearPlaylists = async () => {
//   try {
//     cache.playlists = [];
//     await AsyncStorage.removeItem(PLAYLISTS_KEY);
//     console.log('🗑 Playlists cleared');
//   } catch (error) {
//     console.error('❌ Error clearing playlists:', error);
//   }
// };





import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔹 Key riêng biệt trong bộ nhớ
const FAVORITES_KEY = '@favorites_list';
const PLAYLISTS_KEY = '@playlists_list';
const HISTORY_KEY = '@listening_history';

// 🔸 Bộ nhớ đệm cục bộ giúp phản hồi nhanh hơn
let cache = {
  favorites: null,
  playlists: null,
  history: null,
};

/* ============================================================
   🔸 FAVORITES (DANH SÁCH YÊU THÍCH)
   ============================================================ */
export const saveFavorites = async (favorites) => {
  try {
    cache.favorites = favorites;
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log('✅ Favorites saved:', favorites);
  } catch (error) {
    console.error('❌ Error saving favorites:', error);
  }
};

export const loadFavorites = async () => {
  try {
    if (cache.favorites !== null) return cache.favorites;
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    cache.favorites = jsonValue ? JSON.parse(jsonValue) : [];
    return cache.favorites;
  } catch (error) {
    console.error('❌ Error loading favorites:', error);
    return [];
  }
};

export const clearFavorites = async () => {
  try {
    cache.favorites = [];
    await AsyncStorage.removeItem(FAVORITES_KEY);
    console.log('🗑 Favorites cleared');
  } catch (error) {
    console.error('❌ Error clearing favorites:', error);
  }
};

/* ============================================================
   🔸 LISTENING HISTORY (LỊCH SỬ NGHE NHẠC)
   ============================================================ */

// ✅ Lưu bài hát nghe gần nhất, có loại bỏ trùng và giới hạn 50 bài
export const saveListeningHistory = async (song) => {
  try {
    let history = await loadListeningHistory();

    // Xóa bản ghi cũ nếu bài hát đã tồn tại
    history = history.filter(entry => entry.songId !== song.id);

    // Thêm bản ghi mới vào đầu danh sách
    history.unshift({
      songId: song.id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      timestamp: Date.now(),
    });

    // Giới hạn tối đa 50 bài
    history = history.slice(0, 50);

    cache.history = history;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log(`🎧 Saved to history: ${song.title}`);
  } catch (error) {
    console.error('❌ Error saving listening history:', error);
  }
};

// Tải lịch sử nghe nhạc
export const loadListeningHistory = async () => {
  try {
    if (cache.history !== null) return cache.history;
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    cache.history = jsonValue ? JSON.parse(jsonValue) : [];
    return cache.history;
  } catch (error) {
    console.error('❌ Error loading listening history:', error);
    return [];
  }
};

// Xóa toàn bộ lịch sử nghe nhạc
export const clearListeningHistory = async () => {
  try {
    cache.history = [];
    await AsyncStorage.removeItem(HISTORY_KEY);
    console.log('🗑 Listening history cleared');
  } catch (error) {
    console.error('❌ Error clearing listening history:', error);
  }
};

/* ============================================================
   🔸 PLAYLISTS (DANH SÁCH PHÁT)
   ============================================================ */
export const savePlaylists = async (playlists) => {
  try {
    cache.playlists = playlists;
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    console.log('✅ Playlists saved:', playlists);
  } catch (error) {
    console.error('❌ Error saving playlists:', error);
  }
};

export const loadPlaylists = async () => {
  try {
    if (cache.playlists !== null) return cache.playlists;
    const jsonValue = await AsyncStorage.getItem(PLAYLISTS_KEY);
    cache.playlists = jsonValue ? JSON.parse(jsonValue) : [];
    return cache.playlists;
  } catch (error) {
    console.error('❌ Error loading playlists:', error);
    return [];
  }
};

export const addSongToPlaylist = async (playlistId, song) => {
  try {
    const playlists = await loadPlaylists();
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        const exists = p.songs.some(s => s.id === song.id);
        if (!exists) p.songs.push(song);
      }
      return p;
    });
    await savePlaylists(updated);
    console.log(`🎵 Added "${song.title}" to playlist ID: ${playlistId}`);
  } catch (error) {
    console.error('❌ Error adding song to playlist:', error);
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    const playlists = await loadPlaylists();
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        p.songs = p.songs.filter(s => s.id !== songId);
      }
      return p;
    });
    await savePlaylists(updated);
    console.log(`🗑 Removed song ID ${songId} from playlist ${playlistId}`);
  } catch (error) {
    console.error('❌ Error removing song from playlist:', error);
  }
};

export const clearPlaylists = async () => {
  try {
    cache.playlists = [];
    await AsyncStorage.removeItem(PLAYLISTS_KEY);
    console.log('🗑 Playlists cleared');
  } catch (error) {
    console.error('❌ Error clearing playlists:', error);
  }
};
