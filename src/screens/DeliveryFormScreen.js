import React from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, FlatList} from 'react-native';
import { styles, Colors } from '../styles/styles';
import { useDeliveryForm } from './hooks/useDeliveryForm';
import CustomerDropModal from '../components/CustomerDropModal';
import ExpenseModal from '../components/ExpenseModal';
import PickUpFormModal from '../components/PickUpFormModal';

const DeliveryFormScreen = ({ navigation, route }) => {
  const {
    // State
    loading, syncing, isEditMode, deliveries, showDeliveryPicker, selectedDelivery, allTrips, companyDeparture, companyArrival,
    dropLogs, showDropModal, showPickUpModal, editingPickUp, editingDrop, plantOdoDeparture, plantOdoArrival, expenses, 
    showExpenseModal, expenseTypes,
    // Setters
    setShowDeliveryPicker, setShowDropModal, setShowPickUpModal, setShowExpenseModal, setPlantOdoDeparture, setPlantOdoArrival,
    // Handlers
    handleRefreshDeliveries, handleSelectDelivery, handleCaptureCompanyDeparture, handleCaptureCompanyArrival, handleAddDrop,
    handleEditDrop, handleSaveFromModal, handleAddExpense, handleSaveExpense, handleDeleteExpense, handleSaveDraft, handleFinalize,
    // Utilities
    formatTimeOnly, getLoggedCustomers,
  } = useDeliveryForm(navigation, route);

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
        {/* Refresh Button */}
        <View style={styles.inputRow}>
          {/* Delivery Dropdown */}
          <TouchableOpacity
            style={[styles.dropdownButton, isEditMode && styles.dropdownDisabled]}
            onPress={() => !isEditMode && setShowDeliveryPicker(true)}
            disabled={isEditMode}
          >
            <Text style={styles.dropdownText}>
              {selectedDelivery ? selectedDelivery.dlf_code : 'Select DLF Code...'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deliveryFormRefreshButton, isEditMode && styles.deliveryFormEditModeButton]}
            onPress={handleRefreshDeliveries}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deliveryFormRefreshButtonText}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        {selectedDelivery && (
          <>
            {/* Auto-filled fields */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Driver:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.driver}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Helper:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.helper || 'N/A'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Truck:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.plate_no}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Trip:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.trip_count}</Text>
            </View>

            {/* Company Times */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Time Logs</Text>
              <TouchableOpacity
                style={styles.deliveryFormCaptureButton}
                onPress={handleCaptureCompanyDeparture}
              >
                <Text style={styles.deliveryFormCaptureButtonText}>
                  Departure: {formatTimeOnly(companyDeparture)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deliveryFormCaptureButton}
                onPress={handleCaptureCompanyArrival}
              >
                <Text style={styles.deliveryFormCaptureButtonText}>
                  Arrival: {formatTimeOnly(companyArrival)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expenses Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              
              {/* Expense List */}
              {expenses.length > 0 && (
                <View style={{ marginBottom: 15 }}>
                  {expenses.map((expense, idx) => (
                    <View key={idx} style={styles.deliveryFormExpenseCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryFormExpenseType}>{expense.type}</Text>
                        <Text style={styles.deliveryFormExpenseAmount}>₱{expense.amount}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deliveryFormDeleteExpenseButton}
                        onPress={() => handleDeleteExpense(expense.id)}
                      >
                        <Text style={styles.deliveryFormDeleteExpenseButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add Expense Button */}
              <TouchableOpacity
                style={styles.deliveryFormAddExpenseButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.deliveryFormAddExpenseButtonText}>+ Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Plant Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Odometer Readings</Text>
              <Text style={styles.label}>Odometer Departure</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125400"
                keyboardType="number-pad"
                value={plantOdoDeparture}
                onChangeText={setPlantOdoDeparture}
              />
              <Text style={styles.label}>Odometer Arrival</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125650"
                keyboardType="number-pad"
                value={plantOdoArrival}
                onChangeText={setPlantOdoArrival}
              />
            </View>

            {/* Customer Checklist */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                No of Drop(s): ({selectedDelivery.customers.length})
              </Text>
              {selectedDelivery.customers.map((customer, idx) => {
                const uniqueKey = `${customer.customer_name}|${customer.delivery_address}`;
                const isLogged = getLoggedCustomers().includes(uniqueKey);
                
                return (
                  <View key={idx} style={styles.deliveryFormChecklistItem}>
                    <View style={{flex: 1}}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.deliveryFormCheckbox}>{isLogged ? '☑' : '☐'}</Text>
                        <Text style={styles.deliveryFormChecklistText}>{customer.customer_name}</Text>
                      </View>
                      {customer.delivery_address && (
                        <Text style={styles.deliveryFormDeliveryAddressText}>
                          📍 {customer.delivery_address}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Drop Logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drop Logs</Text>
              {dropLogs.filter(log => log.drop_number > 0).map((log, idx) => (
                <View key={log.id} style={styles.deliveryFormDropLogCard}>
                  <Text style={styles.deliveryFormDropTitle}>
                    Drop {log.drop_number}: ✅ {log.customer}
                  </Text>
                  <Text style={styles.deliveryFormDropTime}>
                    🕐 {formatTimeOnly(log.customer_arrival)} - {formatTimeOnly(log.customer_departure)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deliveryFormEditButton}
                    onPress={() => handleEditDrop(log)}
                  >
                    <Text style={styles.deliveryFormEditButtonText}>EDIT</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Drop Button */}
            <TouchableOpacity
              style={styles.deliveryFormAddDropButton}
              onPress={handleAddDrop}
            >
              <Text style={styles.deliveryFormAddDropButtonText}>+ Log Customer Drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deliveryFormAddDropButton, {backgroundColor: Colors.warning}]}
              onPress={() => setShowPickUpModal(true)}
            >
              <Text style={styles.deliveryFormAddDropButtonText}>+ Log Pick-Up</Text>
            </TouchableOpacity>

            {/* Draft / Finalize Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.deliveryFormDraftButton} onPress={handleSaveDraft}>
                <Text style={styles.buttonText}>💾 Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deliveryFormFinalizeButton} onPress={handleFinalize}>
                <Text style={styles.buttonText}>✅ Finalize</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Delivery Picker Modal */}
      <Modal visible={showDeliveryPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery</Text>
            <FlatList
              data={deliveries}
              keyExtractor={(item) => item.dlf_code}
              renderItem={({ item }) => {
                const hasLogs = allTrips.some(t => t.dlf_code === item.dlf_code);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.deliveryFormDeliveryItem,
                      hasLogs && styles.deliveryFormDeliveryItemUsed
                    ]}
                    onPress={() => !hasLogs && handleSelectDelivery(item)}
                    disabled={hasLogs}
                  >
                    <Text style={[styles.deliveryFormDeliveryItemText, hasLogs && styles.deliveryFormDeliveryItemTextDisabled]}>
                      {item.dlf_code}
                      {hasLogs && <Text style={styles.deliveryFormUsedBadge}> ✓ Already logged</Text>}
                    </Text>
                    <Text style={styles.deliveryFormDeliveryItemSubtext}>{item.driver}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.deliveryFormModalCloseButton}
              onPress={() => setShowDeliveryPicker(false)}
            >
              <Text style={styles.deliveryFormModalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Drop Modal */}
      {showDropModal && (
        <CustomerDropModal
          visible={showDropModal}
          delivery={selectedDelivery}
          editingDrop={editingDrop}
          loggedCustomers={getLoggedCustomers()}
          onSave={handleSaveFromModal}
          onCancel={() => setShowDropModal(false)}
        />
      )}
      
      {/* Pick-up Modal */}
      {showPickUpModal && (
        <PickUpFormModal
          visible={showPickUpModal}
          editingPickUp={editingPickUp}
          onSave={handleSaveFromModal}
          onCancel={() => {
            setShowPickUpModal(false);
          }}
        />
      )}
      
      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          visible={showExpenseModal}
          expenseTypes={expenseTypes}
          onSave={handleSaveExpense}
          onCancel={() => setShowExpenseModal(false)}
        />
      )}
    </View>
  );
};

export default DeliveryFormScreen;