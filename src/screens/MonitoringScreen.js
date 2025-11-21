import React from 'react';
import {View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native';
import { styles } from '../styles/styles';
import { useMonitoring } from './hooks/useMonitoring';

const MonitoringScreen = ({ navigation }) => {
  const {
    fuelRecords, refreshing, syncing, draftCount, unsyncedCount, onRefresh, handleSync, handleEditDraft,
    handleDeleteDraft, handleLogout, handleUserManagement, formatDateTime, getStatusBadge,
  } = useMonitoring(navigation);

  const renderFuelRecord = ({ item }) => {
    const badge = getStatusBadge(item.synced);
    const isDraft = item.synced === -1;
    
    return (
      <View style={styles.monitoringRecordCard}>
        <View style={styles.monitoringRecordHeader}>
          <Text style={styles.monitoringTfpId}>{item.tfp_id}</Text>
          <View style={[styles.badge, styles[badge.style]]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>
        
        <Text style={styles.monitoringRecordDetail}>👤 Driver: {item.utility_driver}</Text>
        <Text style={styles.monitoringRecordDetail}>🚚 Truck: {item.truck_plate}</Text>
        {item.type && (
          <Text style={styles.monitoringRecordDetail}>💳 Type: {item.type}</Text>
        )}
        {item.cash_advance && (
          <Text style={styles.monitoringRecordDetail}>💵 Cash Advance: ₱{item.cash_advance}</Text>
        )}
        
        {item.departure_time && (
          <View style={styles.monitoringTimeContainer}>
            <View style={styles.monitoringTimeRow}>
              <Text style={styles.monitoringTimeLabel}>Depart:</Text>
              <Text style={styles.monitoringTimeText}>{formatDateTime(item.departure_time)}</Text>
            </View>
            {item.arrival_time && (
              <View style={styles.monitoringTimeRow}>
                <Text style={styles.monitoringTimeLabel}>Arrival:</Text>
                <Text style={styles.monitoringTimeText}>{formatDateTime(item.arrival_time)}</Text>
              </View>
            )}
          </View>
        )}

        {item.total_amount && (
          <Text style={styles.monitoringTotalAmount}>Total: ₱{item.total_amount}</Text>
        )}

        {item.created_by && (
          <Text style={styles.monitoringCreatedBy}>👤 {item.created_by}</Text>
        )}

        {isDraft && (
          <View style={styles.monitoringDraftActions}>
            <TouchableOpacity
              style={styles.monitoringEditButton}
              onPress={() => handleEditDraft(item)}
            >
              <Text style={styles.monitoringEditButtonText}>✏️ Edit Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.monitoringDeleteButton}
              onPress={() => handleDeleteDraft(item)}
            >
              <Text style={styles.monitoringDeleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.monitoringHeader}>
        <View>
          <Text style={styles.monitoringTitle}>RFF List</Text>
        </View>
        <View>
          <Text style={styles.monitoringCount}>
            Total: {fuelRecords.length} | Drafts: {draftCount} | Pending: {unsyncedCount}
          </Text>
        </View>
      </View>

      {unsyncedCount > 0 && (
        <TouchableOpacity
          style={styles.monitoringSyncButton}
          onPress={handleSync}
          disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.monitoringSyncButtonText}>
              Sync {unsyncedCount} Records to Google Sheets
            </Text>
          )}
        </TouchableOpacity>
      )}

      {fuelRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No fuel records</Text>
        </View>
      ) : (
        <FlatList
          data={fuelRecords}
          renderItem={renderFuelRecord}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.monitoringList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fabAccount}
        onPress={handleUserManagement}>
        <Text style={styles.fabAccountText}>🔑</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fabLogout}
        onPress={handleLogout}>
        <Text style={styles.fabLogoutText}>↩️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fabForm}
        onPress={() => navigation.navigate('TruckFuelForm')}>
        <Text style={styles.fabFormText}>⛽</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MonitoringScreen;