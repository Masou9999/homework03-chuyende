// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import PlaylistScreen from '../screens/PlaylistScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}
