import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { registerUser } from '../database/db';
import { useNavigation } from '@react-navigation/native';
import { styles, Colors } from '../styles/styles';

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('Logistics Driver');
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const navigation = useNavigation();

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

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
        <ScrollView
          contentContainerStyle={styles.registerScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, {padding: 10}]}>
            <Text style={styles.registerTitle}>Register</Text>
            <Text style={styles.label}>Position</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowPositionPicker(true)}>
                <Text style={styles.dropdownText}>{position}</Text>
            </TouchableOpacity>
            <Modal visible={showPositionPicker} animationType="fade" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.pickerContent}>
                  <Text style={styles.modalTitle}>Select Position</Text>
                  {['Logistics Driver', 'Service Vehicle Driver'].map((pos, idx) => (
                    <TouchableOpacity key={idx} style={styles.pickerItem} onPress={() => {setPosition(pos); setShowPositionPicker(false);}}>
                      <Text style={styles.pickerItemText}>{pos}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.pickerCloseButton} onPress={() => setShowPositionPicker(false)}>
                    <Text style={styles.pickerCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Middle Name (optional)" value={middleName} onChangeText={setMiddleName} />
            <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.buttonSuccess} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;