import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { loginUser, setCurrentUser } from '../database/db';
import { useNavigation } from '@react-navigation/native';
import { styles, Colors } from '../styles/styles';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    try {
      const user = await loginUser(username, password);
      if (user) {
        await setCurrentUser(user);
        
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/betafoam-logo.png')}
          style={styles.loginLogo}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.buttonPrimaryDark} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.loginLinkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;