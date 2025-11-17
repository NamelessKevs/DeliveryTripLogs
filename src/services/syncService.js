import * as Network from 'expo-network';
import * as SQLite from 'expo-sqlite';
import { API_CONFIG } from '../config';
import {getUnsyncedTripLogs, markTripAsSynced, getTripLogsByDeliveryId, getExpensesByDeliveryId, getUnsyncedFuelRecords, markFuelRecordAsSynced, getPhotoBase64, deleteLocalPhoto, updateFuelRecord, getFuelRecordsWithUnuploadedPhotos} from '../database/db';
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

    console.log('Checking for photos to upload...');
    await uploadReceiptPhotos();

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
      tin_no: record.tin_no,
      receipt_photo_url: record.receipt_photo_url,
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

// Upload receipt photos to Google Drive
export const uploadReceiptPhotos = async () => {
  try {
    // Get records with photos that haven't been uploaded yet
    const recordsWithPhotos = await getFuelRecordsWithUnuploadedPhotos();

    if (recordsWithPhotos.length === 0) {
      console.log('No photos to upload');
      return { success: true, uploaded: 0, message: 'No photos to upload' };
    }

    console.log(`Found ${recordsWithPhotos.length} photos to upload`);
    let uploaded = 0;
    let failed = 0;

    for (const record of recordsWithPhotos) {
      try {
        console.log(`Uploading photo for ${record.tfp_id}...`);
        
        // Get photo as base64
        const base64Data = await getPhotoBase64(record.receipt_photo_path);
        const fileName = `receipt_${record.tfp_id}.jpg`;

        // Upload to Google Drive
        const response = await fetch(API_CONFIG.GOOGLE_SHEETS_FUEL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'uploadPhoto',
            base64Data: base64Data,
            fileName: fileName,
            tfpId: record.tfp_id,
          }),
          timeout: 30000, // 30 second timeout for photo upload
        });

        const result = await response.json();
        console.log(`Upload result for ${record.tfp_id}:`, result);

        if (result.success) {
          // Update record with Drive URL and mark as uploaded
          await updateFuelRecord(record.id, {
            ...record,
            receipt_photo_url: result.fileUrl,
            photo_uploaded: 1,
          });

          // Delete local photo file ONLY after successful upload
          await deleteLocalPhoto(record.receipt_photo_path);

          uploaded++;
          console.log(`✅ Uploaded photo for ${record.tfp_id}`);
        } else {
          failed++;
          console.error(`❌ Failed to upload photo for ${record.tfp_id}:`, result.error);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error uploading photo for ${record.tfp_id}:`, error);
      }
    }

    return {
      success: true,
      uploaded: uploaded,
      failed: failed,
      message: `${uploaded} photos uploaded, ${failed} failed`,
    };

  } catch (error) {
    console.error('Upload receipt photos error:', error);
    return { success: false, error: error.message };
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