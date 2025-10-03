// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveItem(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadItem(key, defaultValue = null) {
  const json = await AsyncStorage.getItem(key);
  return json ? JSON.parse(json) : defaultValue;
}