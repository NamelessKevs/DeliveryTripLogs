import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'user_credentials';

// Check if device supports biometrics
export const isBiometricSupported = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Biometric check error:', error);
    return false;
  }
};

// Check if biometrics are enrolled (fingerprint/face registered on device)
export const isBiometricEnrolled = async () => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Enrollment check error:', error);
    return false;
  }
};

// Get available biometric types
export const getBiometricTypes = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
    // Returns array like:
    // [1] = FINGERPRINT
    // [2] = FACIAL_RECOGNITION
    // [3] = IRIS
  } catch (error) {
    console.error('Get types error:', error);
    return [];
  }
};

// Authenticate with biometrics
export const authenticateWithBiometrics = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });
    
    return result.success;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

// Save credentials securely
export const saveCredentials = async (username, password) => {
  try {
    const credentials = JSON.stringify({ username, password });
    await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
    return true;
  } catch (error) {
    console.error('Save credentials error:', error);
    return false;
  }
};

// Get saved credentials
export const getSavedCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (credentials) {
      return JSON.parse(credentials);
    }
    return null;
  } catch (error) {
    console.error('Get credentials error:', error);
    return null;
  }
};

// Delete saved credentials
export const deleteSavedCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return true;
  } catch (error) {
    console.error('Delete credentials error:', error);
    return false;
  }
};

// Check if credentials are saved
export const hasStoredCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return credentials !== null;
  } catch (error) {
    return false;
  }
};