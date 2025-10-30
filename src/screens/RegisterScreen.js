import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { registerUser } from '../database/db';
import { useNavigation } from '@react-navigation/native';

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
        password, // consider hashing later
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
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
        <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 10 },
    scrollContent: {
    padding: 0,
    paddingBottom: 40,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: '#f8f8f8ff' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  dropdownButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#f8f8f8ff', marginBottom: 15 },
  dropdownText: {fontSize: 16, color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  pickerContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  pickerItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  pickerItemText: { fontSize: 16, color: '#333' },
  pickerCloseButton: { backgroundColor: '#ccc', padding: 5, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  pickerCloseButtonText: { color: '#333', fontSize: 12, padding: 5, fontWeight: '600' },
});

export default RegisterScreen;
