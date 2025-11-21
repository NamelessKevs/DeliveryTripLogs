import { useState } from 'react';
import { Alert } from 'react-native';
import { registerUser } from '../../database/db';

export const useRegister = (navigation) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('Logistics Driver');
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await registerUser({
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        username,
        password,
        position,
      });
      Alert.alert('Success', 'Account created', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Username already exists or registration failed');
    }
  };

  return {
    // State
    firstName, middleName, lastName, username, password, position, showPositionPicker,
    // Setters
    setFirstName, setMiddleName, setLastName, setUsername, setPassword, setPosition, setShowPositionPicker,
    // Handlers
    handleRegister,
  };
};