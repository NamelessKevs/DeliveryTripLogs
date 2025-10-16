import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {initDatabase} from './src/database/db';
import {startAutoSync} from './src/services/syncService';
import TripFormScreen from './src/screens/TripFormScreen';
import TripListScreen from './src/screens/TripListScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        console.log('App initialized');
        setIsReady(true);
        
        const cleanup = startAutoSync();
        return cleanup;
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
      }
    };

    const cleanup = initialize();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(fn => fn && fn());
      }
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1FCFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" // <- start with Login screen
        screenOptions={{
          headerStyle: { backgroundColor: '#1FCFFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Register Account' }}
        />
        <Stack.Screen
          name="TripList"
          component={TripListScreen}
          options={{ title: 'Betafoam Logistics' }}
        />
        <Stack.Screen
          name="TripForm"
          component={TripFormScreen}
          options={{ title: 'Log Trip' }}
        />
        <Stack.Screen name="Accounts" component={UserManagementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
