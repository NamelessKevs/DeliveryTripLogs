import React, { useState, useEffect } from 'react';
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { addTripLog, saveDraftTripLog, updateTripLog, markAsReadyToSync, getCurrentUser } from '../database/db';

const TripFormScreen = ({ navigation, route }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  
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

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
        } else {
          Alert.alert('Error', 'No user logged in');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Load current user error:', error);
      }
    };
    loadCurrentUser();

    // Check if we're editing a draft
    if (route.params?.draftToEdit) {
      const draft = route.params.draftToEdit;
      setIsEditMode(true);
      setEditingDraftId(draft.id);
      
      setFormData({
        driver_name: draft.driver_name || '',
        truck_plate: draft.truck_plate || '',
        from_location: draft.from_location || '',
        to_location: draft.to_location || '',
        remarks: draft.remarks || '',
      });

      if (draft.start_time) {
        setStartTime(new Date(draft.start_time));
      }
      if (draft.end_time) {
        setEndTime(new Date(draft.end_time));
      }
    }
  }, [route.params]);

  const getFormattedUserName = () => {
    if (!currentUser) return '';
    const firstName = currentUser.first_name || '';
    const middleName = currentUser.middle_name || '';
    const lastName = currentUser.last_name || '';
    const middleInitial = middleName ? middleName.charAt(0).toUpperCase() + '.' : '';
    return `${firstName} ${middleInitial} ${lastName}`.trim();
  };

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

  const resetForm = () => {
    setFormData({
      driver_name: '',
      truck_plate: '',
      from_location: '',
      to_location: '',
      remarks: '',
    });
    setStartTime(new Date());
    setEndTime(new Date());
    setIsEditMode(false);
    setEditingDraftId(null);
  };

  // Save as Draft (partial data allowed)
  const handleSaveDraft = async () => {
    if (!formData.driver_name || !formData.from_location) {
      Alert.alert('Error', 'Please fill in Driver Name and From Location at minimum');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      if (isEditMode && editingDraftId) {
        // Update existing draft
        await updateTripLog(editingDraftId, {
          driver_name: formData.driver_name,
          truck_plate: formData.truck_plate,
          from_location: formData.from_location,
          to_location: formData.to_location,
          start_time: formatDateTime(startTime),
          end_time: formData.to_location ? formatDateTime(endTime) : null,
          remarks: formData.remarks,
        });
        
        Alert.alert('Success', 'Draft updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              navigation.goBack();
            },
          },
        ]);
      } else {
        // Create new draft
        await saveDraftTripLog({
          driver_name: formData.driver_name,
          truck_plate: formData.truck_plate,
          from_location: formData.from_location,
          to_location: formData.to_location,
          start_time: formatDateTime(startTime),
          end_time: formData.to_location ? formatDateTime(endTime) : null,
          remarks: formData.remarks,
          created_by: getFormattedUserName(),
          created_at: formatDateTime(new Date()),
        });
        
        Alert.alert('Success', 'Trip log saved as draft. You can complete it later.', [
          {
            text: 'OK',
            onPress: () => resetForm(),
          },
        ]);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      Alert.alert('Error', error.message || 'Failed to save draft');
    }
  };

  // Sync (finalize - all fields required)
  const handleSync = async () => {
    if (!formData.driver_name || !formData.from_location || !formData.to_location) {
      Alert.alert('Error', 'Please fill in all required fields to sync');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      if (isEditMode && editingDraftId) {
        // Update the draft and mark as ready to sync
        await updateTripLog(editingDraftId, {
          driver_name: formData.driver_name,
          truck_plate: formData.truck_plate,
          from_location: formData.from_location,
          to_location: formData.to_location,
          start_time: formatDateTime(startTime),
          end_time: formatDateTime(endTime),
          remarks: formData.remarks,
        });
        
        // Mark as ready to sync (synced = 0)
        await markAsReadyToSync(editingDraftId);
        
        Alert.alert('Success', 'Draft finalized and ready to sync!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              navigation.goBack();
            },
          },
        ]);
      } else {
        // Create new trip ready to sync
        await addTripLog({
          driver_name: formData.driver_name,
          truck_plate: formData.truck_plate,
          from_location: formData.from_location,
          to_location: formData.to_location,
          start_time: formatDateTime(startTime),
          end_time: formatDateTime(endTime),
          remarks: formData.remarks,
          created_by: getFormattedUserName(),
          created_at: formatDateTime(new Date()),
        });
        
        Alert.alert('Success', 'Trip log ready to sync!', [
          {
            text: 'OK',
            onPress: () => resetForm(),
          },
        ]);
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', error.message || 'Failed to prepare for sync');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Editing',
      'Are you sure you want to cancel? Changes will not be saved.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            resetForm();
            navigation.goBack();
          },
        },
      ]
    );
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
        <Text style={styles.title}>
          {isEditMode ? '✏️ Edit Draft' : 'Log Delivery Trip'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditMode ? 'Update and save your draft' : 'Save as draft or finalize to sync'}
        </Text>
        
        {currentUser && (
          <Text style={styles.userInfo}>
            📝 Logged by: {getFormattedUserName()}
          </Text>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>
            Driver Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver name"
            value={formData.driver_name}
            onChangeText={(value) => handleChange('driver_name', value)}
          />

          <Text style={styles.label}>Truck Plate Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC-1234"
            value={formData.truck_plate}
            onChangeText={(value) => handleChange('truck_plate', value)}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>
            From Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Starting location"
            value={formData.from_location}
            onChangeText={(value) => handleChange('from_location', value)}
          />

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

          <Text style={styles.label}>
            To Location <Text style={styles.required}>* (for sync)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={formData.to_location}
            onChangeText={(value) => handleChange('to_location', value)}
          />

          <Text style={styles.label}>
            End Time <Text style={styles.required}>* (for sync)</Text>
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

          <Text style={styles.label}>Remarks (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any notes or remarks"
            value={formData.remarks}
            onChangeText={(value) => handleChange('remarks', value)}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
              <Text style={styles.buttonText}>
                {isEditMode ? '📝 Update' : '📝 Draft'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.buttonText}>
                {isEditMode ? '💾 Save' : '💾 Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditMode ? (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('TripList')}
            >
              <Text style={styles.secondaryButtonText}>View All Trips</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: '#1FCFFF',
    marginBottom: 20,
    fontWeight: '600',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 25,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#84827dff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButton: {
    flex: 1,
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  cancelButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripFormScreen;