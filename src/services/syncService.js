import * as Network from 'expo-network';
import {getUnsyncedTripLogs, markTripAsSynced} from '../database/db';
import {syncTripsToGoogleSheets} from '../api/tripApi';

let isSyncing = false;

export const checkAndSync = async () => {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return {success: false, message: 'Sync already in progress'};
  }

  try {
    isSyncing = true; // Lock the sync
    
    const networkState = await Network.getNetworkStateAsync();
    
    console.log('Network State:', networkState);
    
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      console.log('No internet connection');
      return {success: false, message: 'No internet connection'};
    }

    const unsyncedLogs = await getUnsyncedTripLogs();
    
    if (unsyncedLogs.length === 0) {
      console.log('No trip logs to sync');
      return {success: true, message: 'No trip logs to sync', synced: 0};
    }

    console.log(`Syncing ${unsyncedLogs.length} trip logs to Google Sheets...`);

    const tripsToSync = unsyncedLogs.map(log => ({
      driver_name: log.driver_name,
      truck_plate: log.truck_plate,
      from_location: log.from_location,
      to_location: log.to_location,
      start_time: log.start_time,
      end_time: log.end_time,
      remarks: log.remarks,
      created_at: log.created_at,
      created_by: log.created_by,
    }));

    const result = await syncTripsToGoogleSheets(tripsToSync);

    if (result.success) {
      for (const log of unsyncedLogs) {
        await markTripAsSynced(log.id);
      }
      
      return {
        success: true,
        message: `Successfully synced ${result.created} trip logs to Google Sheets`,
        synced: result.created,
        details: result,
      };
    }

    return {success: false, message: 'Sync failed', details: result};
  } catch (error) {
    console.error('Sync service error:', error);
    return {success: false, message: error.message};
  } finally {
    isSyncing = false; // Unlock the sync
  }
};

export const startAutoSync = () => {
  let intervalId;
  
  const checkAndSyncNow = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected && networkState.isInternetReachable) {
      console.log('Internet connected, attempting auto-sync...');
      await checkAndSync();
    }
  };
  
  intervalId = setInterval(checkAndSyncNow, 30000);
  
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};