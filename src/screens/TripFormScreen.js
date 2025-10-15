import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker'; // Updated import
import { addTripLog } from '../database/db';

const TripFormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    driver_name: '',
    truck_plate: '',
    from_location: '',
    to_location: '',
    remarks: '',
  });

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleStartConfirm = (date) => {
    setStartTime(date);
    setStartPickerVisible(false);
  };

  const handleEndConfirm = (date) => {
    setEndTime(date);
    setEndPickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.driver_name || !formData.from_location || !formData.to_location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      await addTripLog({
        driver_name: formData.driver_name,
        truck_plate: formData.truck_plate,
        from_location: formData.from_location,
        to_location: formData.to_location,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        remarks: formData.remarks,
        created_at: new Date().toISOString(),
      });
      Alert.alert('Success', 'Trip log form saved successfully', [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              driver_name: '',
              truck_plate: '',
              from_location: '',
              to_location: '',
              remarks: '',
            });
            setStartTime(new Date());
            setEndTime(new Date());
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save trip log');
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
        <Text style={styles.title}>Log Delivery Trip</Text>
        <Text style={styles.subtitle}>
          Save offline, syncs automatically when online
        </Text>

        <View style={styles.form}>
          {/* Driver Name */}
          <Text style={styles.label}>
            Driver Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver name"
            value={formData.driver_name}
            onChangeText={(value) => handleChange('driver_name', value)}
          />

          {/* Truck Plate */}
          <Text style={styles.label}>Truck Plate Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC-1234"
            value={formData.truck_plate}
            onChangeText={(value) => handleChange('truck_plate', value)}
            autoCapitalize="characters"
          />

          {/* From Location */}
          <Text style={styles.label}>
            From Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Starting location"
            value={formData.from_location}
            onChangeText={(value) => handleChange('from_location', value)}
          />

          {/* To Location */}
          <Text style={styles.label}>
            To Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={formData.to_location}
            onChangeText={(value) => handleChange('to_location', value)}
          />

          {/* Start Time */}
          <Text style={styles.label}>
            Start Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setStartPickerVisible(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateTime(startTime)}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="datetime"
            date={startTime}
            onConfirm={handleStartConfirm}
            onCancel={() => setStartPickerVisible(false)}
          />

          {/* End Time */}
          <Text style={styles.label}>
            End Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setEndPickerVisible(true)}
          >
            <Text style={styles.dateButtonText}>{formatDateTime(endTime)}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="datetime"
            date={endTime}
            onConfirm={handleEndConfirm}
            onCancel={() => setEndPickerVisible(false)}
          />

          {/* Remarks */}
          <Text style={styles.label}>Remarks (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any notes or remarks"
            value={formData.remarks}
            onChangeText={(value) => handleChange('remarks', value)}
            multiline
            numberOfLines={3}
          />

          {/* Buttons */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save Trip Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('TripList')}
          >
            <Text style={styles.secondaryButtonText}>View All Trips</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    marginTop: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1FCFFF',
  },
  secondaryButtonText: {
    color: '#1FCFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripFormScreen;