import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator} from 'react-native';
import {getAllFuelRecords, deleteFuelRecord, getCurrentUser} from '../database/db';
import {checkAndSyncFuel} from '../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, Colors } from '../styles/styles';

const MonitoringScreen = ({navigation}) => {
  const [fuelRecords, setFuelRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFuelRecords = async () => {
    try {
      const allRecords = await getAllFuelRecords();
      setFuelRecords(allRecords);
    } catch (error) {
      console.error('Load fuel records error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuelRecords();
    const unsubscribe = navigation.addListener('focus', () => {
      loadFuelRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFuelRecords();
    setRefreshing(false);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await checkAndSyncFuel();
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadFuelRecords();
      } else {
        Alert.alert('Sync Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleEditDraft = (record) => {
    navigation.navigate('TruckFuelForm', { 
      recordToEdit: record 
    });
  };

  const handleDeleteDraft = (record) => {
    Alert.alert(
      'Delete Fuel Record',
      `Delete fuel record ${record.tfp_id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFuelRecord(record.id);
              Alert.alert('Success', 'Fuel record deleted');
              await loadFuelRecords();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fuel record');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('current_user');
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const handleUserManagement = () => {
    navigation.navigate('Accounts');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (synced) => {
    if (synced === 1) {
      return { text: 'Synced', style: styles.syncedBadge };
    } else if (synced === 0) {
      return { text: 'Pending', style: styles.unsyncedBadge };
    } else {
      return { text: 'Draft', style: styles.draftBadge };
    }
  };

  const renderFuelRecord = ({item}) => {
    const badge = getStatusBadge(item.synced);
    const isDraft = item.synced === -1;
    
    return (
      <View style={styles.monitoringRecordCard}>
        <View style={styles.monitoringRecordHeader}>
          <Text style={styles.monitoringTfpId}>{item.tfp_id}</Text>
          <View style={[styles.badge, badge.style]}>
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

        {/* Edit and Delete buttons for drafts */}
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

  const draftCount = fuelRecords.filter(r => r.synced === -1).length;
  const unsyncedCount = fuelRecords.filter(r => r.synced === 0).length;

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