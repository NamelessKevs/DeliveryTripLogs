import * as Network from 'expo-network';
import {getUnsyncedTripLogs, markTripAsSynced, getTripLogsByDeliveryId, getExpensesByDeliveryId,getUnsyncedFuelRecords, markFuelRecordAsSynced} from '../database/db';
import {syncTripsToGoogleSheets, syncFuelToGoogleSheets} from '../api/tripApi';

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

    const tripsToSync = await Promise.all(
      unsyncedLogs.map(async (log) => {
        const expenses = await getExpensesByDeliveryId(log.dlf_code);
        
        return {
          dlf_code: log.dlf_code,
          driver: log.driver,
          helper: log.helper,
          plate_no: log.plate_no,
          trip_count: log.trip_count,
          company_departure: log.company_departure,
          company_arrival: log.company_arrival,
          dr_no: log.dr_no,
          plant_odo_departure: log.plant_odo_departure,
          plant_odo_arrival: log.plant_odo_arrival,
          si_no: log.si_no,
          drop_number: log.drop_number,
          customer: log.customer,
          address: log.address,
          customer_arrival: log.customer_arrival,
          customer_departure: log.customer_departure,
          remarks: log.remarks,
          created_at: log.created_at,
          created_by: log.created_by,
          expense_details: JSON.stringify(expenses), // ← Add expenses as JSON
          dds_id: log.dds_id || '',
          form_type: log.form_type || 'delivery',
          delivery_address: log.delivery_address,
          quantity: log.quantity,
        };
      })
    );

    console.log('📤 Syncing data:', JSON.stringify(tripsToSync, null, 2));

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

export const checkAndSyncFuel = async () => {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return {success: false, message: 'Sync already in progress'};
  }

  try {
    isSyncing = true;
    
    const networkState = await Network.getNetworkStateAsync();
    
    console.log('Network State:', networkState);
    
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      console.log('No internet connection');
      return {success: false, message: 'No internet connection'};
    }

    const unsyncedRecords = await getUnsyncedFuelRecords();
    
    if (unsyncedRecords.length === 0) {
      console.log('No fuel records to sync');
      return {success: true, message: 'No fuel records to sync', synced: 0};
    }

    console.log(`Syncing ${unsyncedRecords.length} fuel records to Google Sheets...`);

    const recordsToSync = unsyncedRecords.map(record => ({
      tfp_id: record.tfp_id,
      utility_driver: record.utility_driver,
      truck_plate: record.truck_plate,
      type: record.type,
      cash_advance: record.cash_advance,
      departure_time: record.departure_time,
      odometer_readings: record.odometer_readings,
      invoice_date: record.invoice_date,
      reference_no: record.reference_no,
      particular: record.particular,
      payee: record.payee,
      total_liters: record.total_liters,
      cost_per_liter: record.cost_per_liter,
      total_amount: record.total_amount,
      vat_amount: record.vat_amount,
      net_amount: record.net_amount,
      arrival_time: record.arrival_time,
      created_at: record.created_at,
      created_by: record.created_by,
    }));

    console.log('📤 Syncing fuel data:', JSON.stringify(recordsToSync, null, 2));

    const result = await syncFuelToGoogleSheets(recordsToSync);

    if (result.success) {
      for (const record of unsyncedRecords) {
        await markFuelRecordAsSynced(record.id);
      }
      
      return {
        success: true,
        message: `Successfully synced ${result.created} fuel records to Google Sheets`,
        synced: result.created,
        details: result,
      };
    }

    return {success: false, message: 'Sync failed', details: result};
  } catch (error) {
    console.error('Fuel sync service error:', error);
    return {success: false, message: error.message};
  } finally {
    isSyncing = false;
  }
};

export const startAutoSync = () => {
  let intervalId;
  
  const checkAndSyncNow = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected && networkState.isInternetReachable) {
      console.log('Internet connected, attempting auto-sync...');
      // Sync trip logs
      await checkAndSync();
      // Sync fuel records
      await checkAndSyncFuel();
    }
  };
  
  intervalId = setInterval(checkAndSyncNow, 30000);
  
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};