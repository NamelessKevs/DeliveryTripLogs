import * as Network from 'expo-network';
import {getUnsyncedTripLogs, markTripAsSynced, getTripLogsByDeliveryId} from '../database/db';
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
      dlf_code: log.dlf_code,
      driver: log.driver,
      helper: log.helper,
      plate_no: log.plate_no,
      trip_count: log.trip_count,
      company_departure: log.company_departure,
      company_arrival: log.company_arrival,
      plant_run_hours: log.plant_run_hours,
      plant_odo_departure: log.plant_odo_departure,
      plant_odo_arrival: log.plant_odo_arrival,
      plant_kms_run: log.plant_kms_run,
      drop_number: log.drop_number,
      customer: log.customer,
      address: log.address,
      customer_arrival: log.customer_arrival,
      customer_departure: log.customer_departure,
      remarks: log.remarks,
      created_at: log.created_at,
      created_by: log.created_by,
    }));

    const result = await syncTripsToGoogleSheets(tripsToSync);

    if (result.success) {
      for (const log of unsyncedLogs) {
        await markTripAsSynced(log.id);
      }
      
      // ALSO mark drop 0 for each delivery as synced
      const deliveryIds = [...new Set(unsyncedLogs.map(log => log.dlf_code))];
      for (const deliveryId of deliveryIds) {
        const allLogs = await getTripLogsByDeliveryId(deliveryId);
        const drop0s = allLogs.filter(l => l.drop_number === 0 && l.synced === 0);
        
        for (const drop0 of drop0s) {
          await markTripAsSynced(drop0.id);
        }
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