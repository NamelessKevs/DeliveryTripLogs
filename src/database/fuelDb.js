import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ensureDbInitialized, getLocalTimestamp } from './helpers';

// ---------------------
// Truck Fuel Monitoring Functions
// ---------------------

// Generate TFP ID
export const generateTfpId = async (userName) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.getAllAsync(
      'SELECT MAX(id) as max_id FROM truck_fuel_monitoring'
    );
    const nextId = (result[0]?.max_id || 0) + 1;
    
    // Extract initials from user name
    const nameParts = userName.trim().split(' ').filter(part => part.length > 0);
    let initials = '';
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const middleName = nameParts.length > 2 ? nameParts[nameParts.length - 2] : '';
      
      initials = firstName.charAt(0).toUpperCase() + 
                 (middleName ? middleName.charAt(0).toUpperCase() : '') + 
                 lastName.charAt(0).toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0].substring(0, 3).toUpperCase();
    }
    
    return `RFF-${nextId}-${initials}`;
  } catch (error) {
    console.error('Generate TFP ID error:', error);
    return 'RFF-1-XXX';
  }
};

// Add fuel record
export const addFuelRecord = async (record) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.runAsync(
      `INSERT INTO truck_fuel_monitoring 
        (tfp_id, utility_driver, truck_plate, type, cash_advance,
         departure_time, odometer_readings, invoice_date, reference_no, tin_no, particular,
         payee, receipt_photo_path, receipt_photo_url, photo_uploaded, total_liters, cost_per_liter, total_amount, vat_amount, net_amount,
         arrival_time, created_at, created_by, synced, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.tfp_id,
        record.utility_driver,
        record.truck_plate,
        record.type || null,
        record.cash_advance || null,
        record.departure_time || null,
        record.odometer_readings || null,
        record.invoice_date || null,
        record.reference_no || null,
        record.tin_no || null,
        record.particular || 'Fuel',
        record.payee || null,
        record.receipt_photo_path || null,
        record.receipt_photo_url || null,
        record.photo_uploaded || 0,
        record.total_liters || null,
        record.cost_per_liter || null,
        record.total_amount || null,
        record.vat_amount || null,
        record.net_amount || null,
        record.arrival_time || null,
        record.created_at || getLocalTimestamp(),
        record.created_by,
        record.synced || -1,
        record.sync_status || 'no',
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add fuel record error:', error);
    throw error;
  }
};

// Update fuel record
export const updateFuelRecord = async (id, record) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync(
      `UPDATE truck_fuel_monitoring 
       SET utility_driver = ?, truck_plate = ?, type = ?, cash_advance = ?,
           departure_time = ?, odometer_readings = ?, invoice_date = ?, reference_no = ?, tin_no = ?,
           particular = ?, payee = ?, receipt_photo_path = ?, receipt_photo_url = ?, photo_uploaded = ?, total_liters = ?, cost_per_liter = ?,
           total_amount = ?, vat_amount = ?, net_amount = ?, arrival_time = ?,
           synced = ?, sync_status = ?
       WHERE id = ?`,
      [
        record.utility_driver,
        record.truck_plate,
        record.type || null,
        record.cash_advance || null,
        record.departure_time || null,
        record.odometer_readings || null,
        record.invoice_date || null,
        record.reference_no || null,
        record.tin_no || null,
        record.particular || 'Fuel',
        record.payee || null,
        record.receipt_photo_path || null,
        record.receipt_photo_url || null,
        record.photo_uploaded,
        record.total_liters || null,
        record.cost_per_liter || null,
        record.total_amount || null,
        record.vat_amount || null,
        record.net_amount || null,
        record.arrival_time || null,
        record.synced,
        record.sync_status || 'no',
        id,
      ]
    );
  } catch (error) {
    console.error('Update fuel record error:', error);
    throw error;
  }
};

// Get all fuel records
export const getAllFuelRecords = async () => {
  try {
    const db = ensureDbInitialized();
    const records = await db.getAllAsync(
      'SELECT * FROM truck_fuel_monitoring ORDER BY id DESC'
    );
    return records;
  } catch (error) {
    console.error('Get all fuel records error:', error);
    return [];
  }
};

// Get fuel record by ID
export const getFuelRecordById = async (id) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.getAllAsync(
      'SELECT * FROM truck_fuel_monitoring WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Get fuel record by ID error:', error);
    return null;
  }
};

// Get fuel record by TFP ID
export const getFuelRecordByTfpId = async (tfpId) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.getAllAsync(
      'SELECT * FROM truck_fuel_monitoring WHERE tfp_id = ?',
      [tfpId]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Get fuel record by TFP ID error:', error);
    return null;
  }
};

// Get unsynced fuel records
export const getUnsyncedFuelRecords = async () => {
  try {
    const db = ensureDbInitialized();
    const records = await db.getAllAsync(
      'SELECT * FROM truck_fuel_monitoring WHERE synced = 0'
    );
    return records;
  } catch (error) {
    console.error('Get unsynced fuel records error:', error);
    return [];
  }
};

// Mark fuel record as synced
export const markFuelRecordAsSynced = async (id) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync(
      'UPDATE truck_fuel_monitoring SET synced = 1 WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Mark fuel record as synced error:', error);
    throw error;
  }
};

// Delete fuel record
export const deleteFuelRecord = async (id) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync(
      'DELETE FROM truck_fuel_monitoring WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Delete fuel record error:', error);
    throw error;
  }
};

export const getFuelRecordsWithUnuploadedPhotos = async () => {
  try {
    const db = ensureDbInitialized();
    const records = await db.getAllAsync(
      `SELECT * FROM truck_fuel_monitoring 
       WHERE receipt_photo_path IS NOT NULL 
       AND photo_uploaded = 0
       AND synced = 0`
    );
    return records;
  } catch (error) {
    console.error('Get records with unuploaded photos error:', error);
    throw error;
  }
};

// ---------------------
// Photo Functions
// ---------------------
export const takePhoto = async (useCamera = true) => {
  try {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      throw new Error('Permission to access camera/gallery is required!');
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      })
      : await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: ['images'],
      });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Take photo error:', error);
    throw error;
  }
};

export const savePhotoLocally = async (photoUri, tfpId) => {
  try {
    const fileName = `receipt_${tfpId}_${Date.now()}.jpg`;
    const directoryUri = `${FileSystem.documentDirectory}receipts/`;
    
    const dirInfo = await FileSystem.getInfoAsync(directoryUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    }

    const localPath = `${directoryUri}${fileName}`;
    
    await FileSystem.copyAsync({
      from: photoUri,
      to: localPath,
    });

    return localPath;
  } catch (error) {
    console.error('Save photo locally error:', error);
    throw error;
  }
};

export const deleteLocalPhoto = async (photoPath) => {
  try {
    if (!photoPath) return;
    
    const fileInfo = await FileSystem.getInfoAsync(photoPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(photoPath);
      console.log('Deleted local photo:', photoPath);
    }
  } catch (error) {
    console.error('Delete local photo error:', error);
  }
};

export const getPhotoBase64 = async (photoPath) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(photoPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Get photo base64 error:', error);
    throw error;
  }
};

// ---------------------
// Cached Trucks Functions
// ---------------------
export const saveCachedTrucks = async (trucks) => {
  try {
    const db = ensureDbInitialized();
    
    await db.runAsync('DELETE FROM cached_trucks');
    
    for (const truck of trucks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_trucks 
          (truck_plate, cached_at)
         VALUES (?, ?)`,
        [truck, getLocalTimestamp()]
      );
    }
  } catch (error) {
    console.error('Save cached trucks error:', error);
    throw error;
  }
};

export const getCachedTrucks = async () => {
  try {
    const db = ensureDbInitialized();
    const trucks = await db.getAllAsync(
      'SELECT truck_plate FROM cached_trucks ORDER BY truck_plate ASC'
    );
    return trucks.map(t => t.truck_plate);
  } catch (error) {
    console.error('Get cached trucks error:', error);
    return [];
  }
};

// ---------------------
// Payee + TIN No cached function
// ---------------------
export const savePayee = async (payeeName, tinNo) => {
  try {
    const db = ensureDbInitialized();

    const existing = await db.getFirstAsync(
      'SELECT * FROM saved_payees WHERE payee_name = ?',
      [payeeName]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE saved_payees
        SET tin_no = ?, last_used = ?, usage_count = usage_count + 1
        WHERE payee_name = ?`,
        [tinNo, getLocalTimestamp(), payeeName]
      );
    } else {
      await db.runAsync(
        `INSERT INTO saved_payees (payee_name, tin_no, last_used, usage_count)
        VALUES (?, ?, ?, 1)`,
        [payeeName, tinNo, getLocalTimestamp()]
      );
    }
  } catch (error) {
    console.error('Save payee error:', error);
  }
};

export const searchPayees = async (searchText) => {
  try {
    const db = ensureDbInitialized();
    const results = await db.getAllAsync(
      `SELECT * FROM saved_payees
       WHERE payee_name LIKE ?
       ORDER BY usage_count DESC, last_used DESC
       LIMIT 10`,
       [`%${searchText}%`]
    );
    return results;
  } catch (error) {
    console.error('Search payees error:', error);
    return [];
  }
};