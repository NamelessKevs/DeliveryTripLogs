import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { loginUser, setCurrentUser } from '../../database/db';
import {isBiometricSupported, isBiometricEnrolled, authenticateWithBiometrics, saveCredentials, getSavedCredentials, 
deleteSavedCredentials, hasStoredCredentials, getBiometricTypes} from '../../services/biometricAuth';

export const useLogin = (navigation) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const supported = await isBiometricSupported();
    const enrolled = await isBiometricEnrolled();
    const stored = await hasStoredCredentials();
    
    if (supported && enrolled) {
      setBiometricAvailable(true);
      setHasCredentials(stored);
      
      // Get biometric type for UI display
      const types = await getBiometricTypes();
      if (types.includes(2)) {
        setBiometricType('Biometrics');
      } else if (types.includes(1)) {
        setBiometricType('Bio ID');
      } else {
        setBiometricType('ID');
      }
    }
  };

  const handleLogin = async (useBiometric = false) => {
    let loginUsername = username;
    let loginPassword = password;

    // If using biometric, get saved credentials
    if (useBiometric) {
      const authenticated = await authenticateWithBiometrics();
      
      if (!authenticated) {
        Alert.alert('Authentication Failed', 'Biometric authentication failed');
        return;
      }

      const credentials = await getSavedCredentials();
      if (!credentials) {
        Alert.alert('Error', 'No saved credentials found');
        return;
      }

      loginUsername = credentials.username;
      loginPassword = credentials.password;
    } else {
      // Regular login validation
      if (!username || !password) {
        Alert.alert('Error', 'Please enter username and password');
        return;
      }
    }

    try {
      const user = await loginUser(loginUsername, loginPassword);
      
      if (user) {
        await setCurrentUser(user);

        // Ask to save credentials for biometric login (only on first successful regular login)
        if (!useBiometric && biometricAvailable && !hasCredentials) {
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to use ${biometricType} for future logins?`,
            [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: async () => {
                  const saved = await saveCredentials(loginUsername, loginPassword);
                  if (saved) {
                    setHasCredentials(true);
                    Alert.alert('Success', 'Biometric login enabled!');
                  }
                },
              },
            ]
          );
        }

        // Navigate based on position
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

  const handleBiometricLogin = () => {
    handleLogin(true);
  };

  const handleDisableBiometric = () => {
    Alert.alert(
      'Disable Biometric Login',
      'Are you sure you want to disable biometric login?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedCredentials();
            setHasCredentials(false);
            Alert.alert('Success', 'Biometric login disabled');
          },
        },
      ]
    );
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return {
    // State
    username, password, biometricAvailable, hasCredentials, biometricType,
    // Setters
    setUsername, setPassword,
    // Handlers
    handleLogin: () => handleLogin(false), handleBiometricLogin, handleDisableBiometric, navigateToRegister,
  };
};