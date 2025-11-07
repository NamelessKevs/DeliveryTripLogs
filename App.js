import React, {useEffect, useState} from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {initDatabase, seedTestUser} from './src/database/db';
import {startAutoSync} from './src/services/syncService';
import TripListScreen from './src/screens/TripListScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import DeliveryFormScreen from './src/screens/DeliveryFormScreen';
import MonitoringScreen from './src/screens/MonitoringScreen';
import TruckFuelFormScreen from './src/screens/TruckFuelFormScreen';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        // await seedTestUser();
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required', 
            'Location access is needed to log delivery locations accurately.'
          );
        }
        
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
    <>
    <StatusBar barStyle="dark-content" backgroundColor="#1FCFFF" />
      <NavigationContainer theme={DefaultTheme}>
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
            name="DeliveryForm" 
            component={DeliveryFormScreen}
            options={({ route }) => ({ 
              title: route.params?.deliveryToEdit ? 'Edit Delivery' : 'Log Delivery (New)' 
            })} 
          />
          <Stack.Screen
            name="Monitoring"
            component={MonitoringScreen}
            options={{ title: 'Truck Fuel Monitoring' }}
          />
          <Stack.Screen
            name="TruckFuelForm"
            component={TruckFuelFormScreen}
            options={({ route }) => ({ 
              title: route.params?.recordToEdit ? 'Edit Fuel Record' : 'Log Fuel (New)' 
            })}
          />
          <Stack.Screen name="Accounts" component={UserManagementScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
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
