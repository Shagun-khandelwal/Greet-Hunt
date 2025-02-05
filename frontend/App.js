import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import UploadScreen from './screens/UploadScreen';
import { Ionicons } from '@expo/vector-icons';
const Tab = createBottomTabNavigator();
export default function App() {
  return (
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName='Home'
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name == 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              }
              else if (route.name == 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              }
              else if (route.name == 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              else if (route.name == 'Upload') {
                iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'purple',
            tabBarInactiveTintColor: 'gray'
          })}
        >
          <Tab.Screen name='Home' component={HomeScreen} options={{ headerShown: false }} />
          <Tab.Screen name='Search' component={SearchScreen} options={{ headerShown: false }} />
          <Tab.Screen name='Upload' component={UploadScreen} options={{ headerShown: false }} />
          <Tab.Screen name='Profile' component={ProfileScreen} options={{ headerShown: false }} />
        </Tab.Navigator>
      </NavigationContainer>
  );
}


