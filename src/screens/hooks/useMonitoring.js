import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAllFuelRecords, deleteFuelRecord } from '../../database/db';
import { checkAndSyncFuel } from '../../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useMonitoring = (navigation) => {
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
      return { text: 'Synced', style: 'syncedBadge' };
    } else if (synced === 0) {
      return { text: 'Pending', style: 'unsyncedBadge' };
    } else {
      return { text: 'Draft', style: 'draftBadge' };
    }
  };

  const draftCount = fuelRecords.filter(r => r.synced === -1).length;
  const unsyncedCount = fuelRecords.filter(r => r.synced === 0).length;

  return {
    // State
    fuelRecords, refreshing, syncing, loading, draftCount, unsyncedCount,
    // Handlers
    onRefresh, handleSync, handleEditDraft, handleDeleteDraft, handleLogout, handleUserManagement,
    // Utilities
    formatDateTime, getStatusBadge,
  };
};