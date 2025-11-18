import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator} from 'react-native';
import {getAllTripLogs, deleteTripLog, getExpensesByDeliveryId, deleteExpense} from '../database/db';
import {checkAndSync} from '../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, Colors } from '../styles/styles';

const TripListScreen = ({navigation}) => {
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
              // Delete all drops with this dlf_code
              const allTrips = await getAllTripLogs();
              const tripsToDelete = allTrips.filter(t => t.dlf_code === delivery.dlf_code);
              
              for (const trip of tripsToDelete) {
                await deleteTripLog(trip.id);
              }

              // DELETE EXPENSES TOO
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
      // Update plant metrics if current trip has values and grouped doesn't
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
      // Always update company times to latest
      grouped[trip.dlf_code].company_departure = trip.company_departure || grouped[trip.dlf_code].company_departure;
      grouped[trip.dlf_code].company_arrival = trip.company_arrival || grouped[trip.dlf_code].company_arrival;
    }
    
    // Add drop to list (skip drop_number 0 placeholders in display)
    if (trip.drop_number > 0) {
      grouped[trip.dlf_code].drops.push(trip);
    }
    
    // Track synced status from ALL drops (including drop 0)
    if (grouped[trip.dlf_code].synced === null) {
      grouped[trip.dlf_code].synced = trip.synced;
    } else if (trip.synced === -1) {
      grouped[trip.dlf_code].synced = -1; // Draft takes priority
    } else if (trip.synced === 0 && grouped[trip.dlf_code].synced !== -1) {
      grouped[trip.dlf_code].synced = 0; // Pending
    }
  });
  
  return Object.values(grouped);
};

  const getStatusBadge = (item) => {
    if (item.synced === 1) {
      return { text: 'Synced', style: styles.syncedBadge };
    } else if (item.synced === 0) {
      return { text: 'Pending', style: styles.unsyncedBadge };
    } else {
      return { text: 'Draft', style: styles.draftBadge };
    }
  };

  const renderDelivery = ({item}) => {
    const badge = getStatusBadge(item);
    const isDraft = item.synced === -1;
    
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripCardHeader}>
          <Text style={styles.tripCardDriverName}>{item.dlf_code}</Text>
          <View style={[styles.badge, badge.style]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>
        
        <Text style={styles.tripCardTruckPlate}>👤 {item.driver}</Text>
        {item.helper && (
          <Text style={styles.tripCardTruckPlate}>🤝 {item.helper}</Text>
        )}
        <Text style={styles.tripCardTruckPlate}>🚚 {item.plate_no} | Trip {item.trip_count}</Text>
        <Text style={styles.tripCardTruckPlate}>ODO Depart: {item.plant_odo_departure} | ODO Arrive: {item.plant_odo_arrival}</Text>
        
        <View style={styles.tripCardTimeContainer}>
          <View style={styles.tripCardTimeRow}>
            <Text style={styles.tripCardTimeLabel}>Depart:</Text>
            <Text style={styles.tripCardTimeText}>{formatDateTime(item.company_departure)}</Text>
          </View>
          {item.company_arrival && (
            <View style={styles.tripCardTimeRow}>
              <Text style={styles.tripCardTimeLabel}>Arrival:</Text>
              <Text style={styles.tripCardTimeText}>{formatDateTime(item.company_arrival)}</Text>
            </View>
          )}
        </View>

        {/* Drops Section */}
        {item.drops.length > 0 ? (
          <View style={styles.tripCardRouteContainer}>
            <Text style={styles.tripCardLocationLabel}>Drops:</Text>
            {item.drops.map((drop, idx) => (
              <View key={drop.id} style={{marginTop: 8}}>
                <Text style={styles.tripCardLocationText}>
                  {drop.drop_number}. {drop.customer}
                  {drop.form_type === 'pick-up' && (
                    <Text style={styles.tripPickUpBadge}> 📦 Pick-Up</Text>
                  )}
                </Text>
                <Text style={styles.tripCardTimeText}>
                    {formatDateTime(drop.customer_arrival)} - {formatDateTime(drop.customer_departure)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.tripCardRouteContainer}>
            <Text style={styles.tripCardRemarks}>No drops logged yet</Text>
          </View>
        )}

        {item.created_by && (
          <Text style={styles.tripCardCreatedBy}>👤 {item.created_by}</Text>
        )}

        {/* Edit and Delete buttons for drafts */}
        {isDraft && (
          <View style={styles.tripCardDraftActions}>
            <TouchableOpacity
              style={styles.tripCardEditButton}
              onPress={() => handleEditDraft(item)}
            >
              <Text style={styles.tripCardEditButtonText}>✏️ Edit Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tripCardDeleteButton}
              onPress={() => handleDeleteDraft(item)}
            >
              <Text style={styles.tripCardDeleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const groupedDeliveries = groupTripsByDelivery(trips);
  const draftCount = groupedDeliveries.filter(d => d.synced === -1).length;
  const unsyncedCount = groupedDeliveries.filter(d => d.synced === 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.tripListHeader}>
        <View>
          <Text style={styles.tripListTitle}>Trip Logs</Text>
        </View>
        <View>
        <Text style={styles.tripListCount}>
          Total: {groupedDeliveries.length} | Drafts: {draftCount} | Pending: {unsyncedCount}
        </Text>
        </View>
      </View>

      {unsyncedCount > 0 && (
        <TouchableOpacity
          style={styles.tripListSyncButton}
          onPress={handleSync}
          disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.tripListSyncButtonText}>
              Sync {unsyncedCount} Trips to Google Sheets
            </Text>
          )}
        </TouchableOpacity>
      )}

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No delivery trip logs</Text>
        </View>
      ) : (
        <FlatList
          data={groupTripsByDelivery(trips)}
          renderItem={renderDelivery}
          keyExtractor={item => item.dlf_code}
          contentContainerStyle={styles.tripListList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
)}

      {/* FABs - Show based on user position */}
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
        onPress={() => navigation.navigate('DeliveryForm')}>
        <Text style={styles.fabFormText}>🚚</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TripListScreen;