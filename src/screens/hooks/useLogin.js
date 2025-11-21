import { useState } from 'react';
import { Alert } from 'react-native';
import { loginUser, setCurrentUser } from '../../database/db';

export const useLogin = (navigation) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    
    try {
      const user = await loginUser(username, password);
      if (user) {
        await setCurrentUser(user);
        
        // Navigate based on user position
        if (user.position === 'Service Vehicle Driver') {
          navigation.reset({ index: 0, routes: [{ name: 'Monitoring' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'TripList' }] });
        }
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Login failed');
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return {
    // State
    username, password,
    // Setters
    setUsername, setPassword,
    // Handlers
    handleLogin, navigateToRegister,
  };
};