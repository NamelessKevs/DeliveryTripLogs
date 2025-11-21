import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAllTripLogs, deleteTripLog, getExpensesByDeliveryId, deleteExpense } from '../../database/db';
import { checkAndSync } from '../../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTripList = (navigation) => {
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      const allTrips = await getAllTripLogs();
      setTrips(allTrips);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    const unsubscribe = navigation.addListener('focus', () => {
      loadTrips();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await checkAndSync();
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadTrips();
      } else {
        Alert.alert('Sync Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleEditDraft = (delivery) => {
    navigation.navigate('DeliveryForm', { 
      deliveryToEdit: delivery 
    });
  };

  const handleDeleteDraft = (delivery) => {
    Alert.alert(
      'Delete Delivery',
      `Delete entire delivery ${delivery.dlf_code} and all its drops?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const allTrips = await getAllTripLogs();
              const tripsToDelete = allTrips.filter(t => t.dlf_code === delivery.dlf_code);
              
              for (const trip of tripsToDelete) {
                await deleteTripLog(trip.id);
              }

              const expenses = await getExpensesByDeliveryId(delivery.dlf_code);
              for (const expense of expenses) {
                await deleteExpense(expense.id);
              }
              
              Alert.alert('Success', 'Delivery deleted');
              await loadTrips();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete delivery');
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

  const groupTripsByDelivery = (trips) => {
    const grouped = {};
    
    trips.forEach(trip => {
      if (!trip.dlf_code) return;
      
      if (!grouped[trip.dlf_code]) {
        grouped[trip.dlf_code] = {
          dlf_code: trip.dlf_code,
          driver: trip.driver,
          helper: trip.helper,
          plate_no: trip.plate_no,
          trip_count: trip.trip_count,
          company_departure: trip.company_departure,
          company_arrival: trip.company_arrival,
          plant_odo_departure: trip.plant_odo_departure,
          plant_odo_arrival: trip.plant_odo_arrival,
          created_by: trip.created_by,
          created_at: trip.created_at,
          drops: [],
          synced: null,
        };
      } else {
        if (trip.dr_no && !grouped[trip.dlf_code].dr_no) {
          grouped[trip.dlf_code].dr_no = trip.dr_no;
        }
        if (trip.plant_odo_departure && !grouped[trip.dlf_code].plant_odo_departure) {
          grouped[trip.dlf_code].plant_odo_departure = trip.plant_odo_departure;
        }
        if (trip.plant_odo_arrival && !grouped[trip.dlf_code].plant_odo_arrival) {
          grouped[trip.dlf_code].plant_odo_arrival = trip.plant_odo_arrival;
        }
        if (trip.si_no && !grouped[trip.dlf_code].si_no) {
          grouped[trip.dlf_code].si_no = trip.si_no;
        }
        grouped[trip.dlf_code].company_departure = trip.company_departure || grouped[trip.dlf_code].company_departure;
        grouped[trip.dlf_code].company_arrival = trip.company_arrival || grouped[trip.dlf_code].company_arrival;
      }
      
      if (trip.drop_number > 0) {
        grouped[trip.dlf_code].drops.push(trip);
      }
      
      if (grouped[trip.dlf_code].synced === null) {
        grouped[trip.dlf_code].synced = trip.synced;
      } else if (trip.synced === -1) {
        grouped[trip.dlf_code].synced = -1;
      } else if (trip.synced === 0 && grouped[trip.dlf_code].synced !== -1) {
        grouped[trip.dlf_code].synced = 0;
      }
    });
    
    return Object.values(grouped);
  };

  const getStatusBadge = (item) => {
    if (item.synced === 1) {
      return { text: 'Synced', style: 'syncedBadge' };
    } else if (item.synced === 0) {
      return { text: 'Pending', style: 'unsyncedBadge' };
    } else {
      return { text: 'Draft', style: 'draftBadge' };
    }
  };

  const groupedDeliveries = groupTripsByDelivery(trips);
  const draftCount = groupedDeliveries.filter(d => d.synced === -1).length;
  const unsyncedCount = groupedDeliveries.filter(d => d.synced === 0).length;

  return {
    // State
    trips, refreshing, syncing, loading, groupedDeliveries, draftCount, unsyncedCount,
    // Handlers
    onRefresh, handleSync, handleEditDraft, handleDeleteDraft, handleLogout, handleUserManagement,
    // Utilities
    formatDateTime, getStatusBadge,
  };
};