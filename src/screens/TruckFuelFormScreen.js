import React from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform, Image} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles, Colors } from '../styles/styles';
import { useTruckFuelForm } from './hooks/useTruckFuelForm';

const TruckFuelFormScreen = ({ navigation, route }) => {
  const {
    // State
    loading, tfpId, utilityDriver, truckPlate, showTruckPicker, cachedTrucks, fetchingTrucks, type, cashAdvance, showTypePicker,
    departureTime, odometerReadings, invoiceDate, referenceNo, tinNo, payee, receiptPhoto, receiptPhotoUrl, photoUploaded,
    totalLiters, costPerLiter, totalAmount, arrivalTime, payeeSuggestions, showSuggestions, showInvoiceDatePicker,
    // Setters
    setShowTruckPicker, setTruckPlate, setShowTypePicker, setType, setCashAdvance, setOdometerReadings, setShowInvoiceDatePicker,
    setReferenceNo, setTinNo, setTotalLiters, setCostPerLiter,
    // Handlers
    handleFetchTrucks, handleCaptureDeparture, handleCaptureArrival,handleInvoiceDateChange, handlePayeeChange, handleSelectPayee,
    handleTakePhoto, handleRemovePhoto, handleSaveDraft, handleFinalize,
    // Utilities
    formatTimeOnly,
  } = useTruckFuelForm(navigation, route);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TFP ID Display */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>RFF ID:</Text>
          <Text style={styles.infoValue}>{tfpId}</Text>
        </View>

        {/* Draft Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Information</Text>

          <Text style={styles.label}>Service Vehicle Driver <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            placeholder="Enter driver name"
            value={utilityDriver}
            editable={false}
          />

          <Text style={styles.label}>Truck Plate <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTruckPicker(true)}
            >
              <Text style={styles.dropdownText}>
                {truckPlate || 'Select truck...'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fuelFormRefreshIconButton}
              onPress={handleFetchTrucks}
              disabled={fetchingTrucks}
            >
              {fetchingTrucks ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.fuelFormRefreshIcon}>🔄</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Truck Picker Modal */}
          <Modal visible={showTruckPicker} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContent}>
                <Text style={styles.modalTitle}>Select Truck</Text>
                
                {cachedTrucks.length === 0 ? (
                  <View style={styles.fuelFormEmptyPickerContainer}>
                    <Text style={styles.fuelFormEmptyPickerText}>No trucks cached</Text>
                    <TouchableOpacity
                      style={styles.fuelFormFetchButton}
                      onPress={handleFetchTrucks}
                      disabled={fetchingTrucks}
                    >
                      <Text style={styles.fuelFormFetchButtonText}>
                        {fetchingTrucks ? 'Fetching...' : 'Fetch Trucks'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView style={styles.pickerScroll}>
                    {cachedTrucks.map((truck, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.pickerItem}
                        onPress={() => {
                          setTruckPlate(truck);
                          setShowTruckPicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>{truck}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                
                <TouchableOpacity
                  style={styles.pickerCloseButton}
                  onPress={() => setShowTruckPicker(false)}
                >
                  <Text style={styles.pickerCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Type</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.dropdownText}>
                {type || 'Select type...'}
              </Text>
            </TouchableOpacity>
          </View>

          {type === 'Cash' && (
            <>
              <Text style={styles.label}>Cash Advance <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                value={cashAdvance}
                onChangeText={setCashAdvance}
              />
            </>
          )}
        </View>

        {/* Finalize Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truck Fuel Details</Text>
          
          {/* Departure Time */}
          <Text style={styles.label}>Departure Time <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.fuelFormCaptureButton}
            onPress={handleCaptureDeparture}
          >
            <Text style={styles.fuelFormCaptureButtonText}>
              {formatTimeOnly(departureTime)}
            </Text>
          </TouchableOpacity>

          {/* Odometer */}
          <Text style={styles.label}>Odometer Readings <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 125400"
            keyboardType="number-pad"
            value={odometerReadings}
            onChangeText={setOdometerReadings}
          />

          {/* Invoice Date */}
          <Text style={styles.label}>Invoice Date <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.fuelFormCaptureButton}
            onPress={() => setShowInvoiceDatePicker(true)}
          >
            <Text style={styles.fuelFormCaptureButtonText}>
              {invoiceDate || 'Select date'}
            </Text>
          </TouchableOpacity>

          {/* Payee */}
          <Text style={styles.label}>Payee <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter payee name"
            value={payee}
            onChangeText={handlePayeeChange}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <View style={styles.fuelFormSuggestionsContainer}>
              {payeeSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.fuelFormSuggestionItem}
                  onPress={() => handleSelectPayee(item)}
                >
                  <Text style={styles.fuelFormSuggestionPayee}>{item.payee_name}</Text>
                  <Text style={styles.fuelFormSuggestionTin}>TIN: {item.tin_no}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* TIN No */}
          <Text style={styles.label}>TIN No <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter TIN number"
            keyboardType='numeric'
            value={tinNo}
            onChangeText={setTinNo}
          />

          {/* Reference No */}
          <Text style={styles.label}>Reference No <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reference number"
            keyboardType='numeric'
            value={referenceNo}
            onChangeText={setReferenceNo}
          />

          {/* Receipt Photo */}
          <Text style={styles.label}>Receipt Photo</Text>
          {receiptPhoto ? (
            <View style={styles.fuelFormPhotoContainer}>
              <Image 
                source={{ uri: photoUploaded === 1 && receiptPhotoUrl ? receiptPhotoUrl : receiptPhoto }} 
                style={styles.fuelFormPhotoPreview} 
              />
              {photoUploaded === 1 && (
                <Text style={styles.fuelFormUploadedBadge}>☁️ Uploaded to Drive</Text>
              )}
              <View style={styles.fuelFormPhotoButtons}>
                <TouchableOpacity
                  style={styles.fuelFormRetakeButton}
                  onPress={() => handleTakePhoto(true)}
                >
                  <Text style={styles.fuelFormRetakeButtonText}>📷 Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fuelFormRemovePhotoButton}
                  onPress={handleRemovePhoto}
                >
                  <Text style={styles.fuelFormRemovePhotoButtonText}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.fuelFormPhotoButtons}>
              <TouchableOpacity
                style={styles.fuelFormCameraButton}
                onPress={() => handleTakePhoto(true)}
              >
                <Text style={styles.fuelFormCameraButtonText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fuelFormGalleryButton}
                onPress={() => handleTakePhoto(false)}
              >
                <Text style={styles.fuelFormGalleryButtonText}>🖼️ Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Total Liters */}
          <Text style={styles.label}>Qty Liters <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50.5"
            keyboardType="decimal-pad"
            value={totalLiters}
            onChangeText={setTotalLiters}
          />

          {/* Cost Per Liter */}
          <Text style={styles.label}>Cost Per Liter <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 65.50"
            keyboardType="decimal-pad"
            value={costPerLiter}
            onChangeText={setCostPerLiter}
          />

          {/* Total Amount (Auto-calculated, read-only) */}
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={totalAmount ? `₱${totalAmount}` : ''}
            editable={false}
          />

          {/* Arrival Time */}
          <Text style={styles.label}>Arrival Time <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.fuelFormCaptureButton}
            onPress={handleCaptureArrival}
          >
            <Text style={styles.fuelFormCaptureButtonText}>
              {formatTimeOnly(arrivalTime)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Draft / Finalize Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.fuelFormDraftButton} onPress={handleSaveDraft}>
            <Text style={styles.buttonText}>💾 Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fuelFormFinalizeButton} onPress={handleFinalize}>
            <Text style={styles.buttonText}>✅ Finalize</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>Select Type</Text>
            {['Fleet Card', 'Cash'].map((t, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.pickerItem}
                onPress={() => {
                  setType(t);
                  setShowTypePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.pickerCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Date Picker */}
      {showInvoiceDatePicker && (
        <DateTimePicker
          value={invoiceDate ? new Date(invoiceDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleInvoiceDateChange}
        />
      )}
    </View>
  );
};

export default TruckFuelFormScreen;