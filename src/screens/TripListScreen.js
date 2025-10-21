import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {getAllTripLogs, deleteTripLog} from '../database/db';
import {checkAndSync} from '../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const handleEditDraft = (item) => {
    navigation.navigate('DeliveryForm', { draftToEdit: item });
  };

  const handleDeleteDraft = (item) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTripLog(item.id);
              Alert.alert('Success', 'Draft deleted');
              await loadTrips();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete draft');
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

  const getStatusBadge = (item) => {
    if (item.synced === 1) {
      return { text: 'Synced', style: styles.syncedBadge };
    } else if (item.synced === 0) {
      return { text: 'Pending', style: styles.unsyncedBadge };
    } else {
      return { text: 'Draft', style: styles.draftBadge };
    }
  };

  const renderTrip = ({item}) => {
    const badge = getStatusBadge(item);
    const isDraft = item.synced === -1;
    
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.driverName}>{item.driver_name}</Text>
          <View style={[styles.badge, badge.style]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>
        
        {item.truck_plate && (
          <Text style={styles.truckPlate}>🚚 {item.truck_plate}</Text>
        )}
        
        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>From:</Text>
            <Text style={styles.locationText}>{item.from_location || 'N/A'}</Text>
          </View>
          {item.to_location && (
            <>
              <Text style={styles.arrow}>↓</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>To:</Text>
                <Text style={styles.locationText}>{item.to_location}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeText}>{formatDateTime(item.start_time)}</Text>
          </View>
          {item.end_time && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>End:</Text>
              <Text style={styles.timeText}>{formatDateTime(item.end_time)}</Text>
            </View>
          )}
        </View>

        {item.remarks && (
          <Text style={styles.remarks}>📝 {item.remarks}</Text>
        )}

        {item.created_by && (
          <Text style={styles.createdBy}>👤 {item.created_by}</Text>
        )}

        {/* Edit and Delete buttons for drafts */}
        {isDraft && (
          <View style={styles.draftActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditDraft(item)}
            >
              <Text style={styles.editButtonText}>✏️ Edit Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDraft(item)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const draftCount = trips.filter(t => t.synced === -1).length;
  const unsyncedCount = trips.filter(t => t.synced === 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trip Logs</Text>
        </View>
        <View>
          <Text style={styles.count}>
            Total: {trips.length} | Drafts: {draftCount} | Pending: {unsyncedCount}
          </Text>
        </View>
      </View>

      {unsyncedCount > 0 && (
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSync}
          disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.syncButtonText}>
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
          data={trips}
          renderItem={renderTrip}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TripForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab3}
        onPress={handleUserManagement}>
        <Text style={styles.fab3Text}>🔑</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab2}
        onPress={handleLogout}>
        <Text style={styles.fab2Text}>↩️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab4}
        onPress={() => navigation.navigate('LDDData')}>
        <Text style={styles.fab4Text}>📊</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab5}
        onPress={() => navigation.navigate('DeliveryForm')}>
        <Text style={styles.fab5Text}>🚚</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  syncButton: {
    backgroundColor: '#1FCFFF',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncedBadge: {
    backgroundColor: '#d4edda',
  },
  unsyncedBadge: {
    backgroundColor: '#fff3cd',
  },
  draftBadge: {
    backgroundColor: '#f8d7da',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  truckPlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  routeContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    width: 50,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  arrow: {
    fontSize: 16,
    color: '#1FCFFF',
    textAlign: 'center',
    marginVertical: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeRow: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: '#333',
  },
  remarks: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  createdBy: {
    fontSize: 12,
    color: '#1FCFFF',
    marginTop: 6,
    fontWeight: '600',
  },
  draftActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1FCFFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 200,
    backgroundColor: '#10dc17ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  fab2: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    backgroundColor: '#7aa2aaff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab2Text: {
    fontSize: 24,
  },
  fab3: {
    position: 'absolute',
    right: 20,
    bottom: 130,
    backgroundColor: '#1FCFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab3Text: {
    fontSize: 24,
  },
  fab4: {
    position: 'absolute',
    right: 20,
    bottom: 270,
    backgroundColor: '#ff9800',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab4Text: {
    fontSize: 24,
  },
  fab5: {
    position: 'absolute',
    right: 20,
    bottom: 340,
    backgroundColor: '#4caf50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab5Text: {
    fontSize: 24,
  },
});

export default TripListScreen;