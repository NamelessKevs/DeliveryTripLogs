import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { styles, Colors } from '../styles/styles';
import { useLogin } from './hooks/useLogin';

const LoginScreen = ({ navigation }) => {
  const {
    username,
    password,
    biometricAvailable,
    hasCredentials,
    biometricType,
    setUsername,
    setPassword,
    handleLogin,
    handleBiometricLogin,
    handleDisableBiometric,
    navigateToRegister,
  } = useLogin(navigation);

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

        {/* Regular Login */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
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

        <TouchableOpacity onPress={navigateToRegister}>
          <Text style={styles.loginLinkText}>Don't have an account? Register</Text>
        </TouchableOpacity>

        {/* Biometric Login Button (only if available and credentials saved) */}
        {biometricAvailable && hasCredentials && (
          <>
            <Text style={{ marginVertical: 10, color: Colors.gray, textAlign: 'center' }}>OR</Text>
            <TouchableOpacity
              style={[styles.buttonPrimaryDark, { backgroundColor: Colors.success }]}
              onPress={handleBiometricLogin}
            >
              <Text style={styles.buttonText}>
                {biometricType === 'Biometrics' ? '👆' : '🔓'} {biometricType}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Disable Biometric Option */}
        {biometricAvailable && hasCredentials && (
          <TouchableOpacity onPress={handleDisableBiometric}>
            <Text style={[styles.loginLinkText, { color: Colors.danger, marginTop: 10 }]}>
              Disable {biometricType}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;