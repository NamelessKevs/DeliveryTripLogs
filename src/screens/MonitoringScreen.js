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
import {getAllFuelRecords, deleteFuelRecord, getCurrentUser} from '../database/db';
import {checkAndSyncFuel} from '../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.tfpId}>{item.tfp_id}</Text>
          <View style={[styles.badge, badge.style]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>
        
        <Text style={styles.recordDetail}>👤 Driver: {item.utility_driver}</Text>
        <Text style={styles.recordDetail}>🚚 Truck: {item.truck_plate}</Text>
        {item.type && (
          <Text style={styles.recordDetail}>💳 Type: {item.type}</Text>
        )}
        {item.cash_advance && (
          <Text style={styles.recordDetail}>💵 Cash Advance: ₱{item.cash_advance}</Text>
        )}
        
        {item.departure_time && (
          <View style={styles.timeContainer}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Depart:</Text>
              <Text style={styles.timeText}>{formatDateTime(item.departure_time)}</Text>
            </View>
            {item.arrival_time && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Arrival:</Text>
                <Text style={styles.timeText}>{formatDateTime(item.arrival_time)}</Text>
              </View>
            )}
          </View>
        )}

        {item.total_amount && (
          <Text style={styles.totalAmount}>Total: ₱{item.total_amount}</Text>
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

  const draftCount = fuelRecords.filter(r => r.synced === -1).length;
  const unsyncedCount = fuelRecords.filter(r => r.synced === 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fuel Monitoring</Text>
        </View>
        <View>
          <Text style={styles.count}>
            Total: {fuelRecords.length} | Drafts: {draftCount} | Pending: {unsyncedCount}
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
          contentContainerStyle={styles.list}
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
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tfpId: {
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
  recordDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
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
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10dc17ff',
    marginTop: 8,
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
  },
  fabLogout: {
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
  fabLogoutText: {
    fontSize: 24,
  },
  fabAccount: {
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
  fabAccountText: {
    fontSize: 24,
  },
  fabForm: {
    position: 'absolute',
    right: 20,
    bottom: 200,
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
  fabFormText: {
    fontSize: 24,
  },
});

export default MonitoringScreen;