import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './src/navigation/AppNavigator';

import HomeScreen from './src/screens/HomeScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import FavoriteScreen from './src/screens/FavoriteScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppNavigator>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Favorite" component={FavoriteScreen} />
        <Stack.Screen name="PlaylistScreen" component={PlaylistScreen} />
      </Stack.Navigator>
    </AppNavigator>
  );
}
