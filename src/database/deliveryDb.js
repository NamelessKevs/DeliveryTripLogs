import { ensureDbInitialized, getLocalTimestamp } from './helpers';

// ---------------------
// Trip Logs Functions
// ---------------------
export const addTripLog = async (tripLog) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.runAsync(
      `INSERT INTO trip_logs 
        (dlf_code, driver, helper, plate_no, trip_count, 
         company_departure, company_arrival, dr_no, plant_odo_departure, plant_odo_arrival, si_no, drop_number, customer, delivery_address, dds_id, address, 
         customer_arrival, customer_departure, quantity, remarks, form_type, created_by, created_at, synced, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripLog.dlf_code,
        tripLog.driver,
        tripLog.helper || null,
        tripLog.plate_no || null,
        tripLog.trip_count || null,
        tripLog.company_departure || null,
        tripLog.company_arrival || null,
        tripLog.dr_no || null,
        tripLog.plant_odo_departure || null,
        tripLog.plant_odo_arrival || null,
        tripLog.si_no || null,
        tripLog.drop_number,
        tripLog.customer || null,
        tripLog.delivery_address || null,
        tripLog.dds_id || null,
        tripLog.address || null,
        tripLog.customer_arrival || null,
        tripLog.customer_departure || null,
        tripLog.quantity || null,
        tripLog.remarks || null,
        tripLog.form_type || 'delivery',
        tripLog.created_by,
        tripLog.created_at || getLocalTimestamp(),
        tripLog.synced || 0,
        tripLog.sync_status || 'no',
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add trip log error:', error);
    throw error;
  }
};

export const updateTripLog = async (id, tripLog) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync(
      `UPDATE trip_logs 
       SET dlf_code = ?, driver = ?, helper = ?, plate_no = ?, trip_count = ?, company_departure = ?, company_arrival = ?,
           dr_no = ?, plant_odo_departure = ?, plant_odo_arrival = ?, si_no = ?, drop_number = ?,
           customer = ?, delivery_address = ?, dds_id = ?, address = ?, customer_arrival = ?, customer_departure = ?, quantity = ?, remarks = ?, form_type = ?, synced = ?, sync_status = ?
       WHERE id = ?`,
      [
        tripLog.dlf_code,
        tripLog.driver,
        tripLog.helper || null,
        tripLog.plate_no || null,
        tripLog.trip_count || null,
        tripLog.company_departure || null,
        tripLog.company_arrival || null,
        tripLog.dr_no || null,
        tripLog.plant_odo_departure || null,
        tripLog.plant_odo_arrival || null,
        tripLog.si_no || null,
        tripLog.drop_number,
        tripLog.customer || null,
        tripLog.delivery_address || null,
        tripLog.dds_id || null,
        tripLog.address || null,
        tripLog.customer_arrival || null,
        tripLog.customer_departure || null,
        tripLog.quantity || null,
        tripLog.remarks || null,
        tripLog.form_type || 'delivery',
        tripLog.synced,
        tripLog.sync_status || 'no',
        id,
      ]
    );
  } catch (error) {
    console.error('Update trip log error:', error);
    throw error;
  }
};

export const getTripLogsByDeliveryId = async (deliveryId) => {
  try {
    const db = ensureDbInitialized();
    const logs = await db.getAllAsync(
      'SELECT * FROM trip_logs WHERE dlf_code = ? ORDER BY drop_number ASC',
      [deliveryId]
    );
    return logs;
  } catch (error) {
    console.error('Get trip logs by delivery ID error:', error);
    return [];
  }
};

export const updateCompanyTimes = async (deliveryId, companyDeparture, companyArrival) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync(
      `UPDATE trip_logs 
       SET company_departure = ?, company_arrival = ?
       WHERE dlf_code = ?`,
      [companyDeparture, companyArrival, deliveryId]
    );
  } catch (error) {
    console.error('Update company times error:', error);
    throw error;
  }
};

export const getNextDropNumber = async (deliveryId) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.getAllAsync(
      'SELECT MAX(drop_number) as max_drop FROM trip_logs WHERE dlf_code = ?',
      [deliveryId]
    );
    return (result[0]?.max_drop || 0) + 1;
  } catch (error) {
    console.error('Get next drop number error:', error);
    return 1;
  }
};

export const markTripAsSynced = async (id) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync('UPDATE trip_logs SET synced = 1 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Mark as synced error:', error);
    throw error;
  }
};

export const getAllTripLogs = async () => {
  try {
    const db = ensureDbInitialized();
    const logs = await db.getAllAsync('SELECT * FROM trip_logs ORDER BY id DESC');
    return logs;
  } catch (error) {
    console.error('Get all logs error:', error);
    return [];
  }
};

export const getUnsyncedTripLogs = async () => {
  try {
    const db = ensureDbInitialized();
    const logs = await db.getAllAsync(
      'SELECT * FROM trip_logs WHERE synced = 0 AND drop_number > 0'
    );
    return logs;
  } catch (error) {
    console.error('Get unsynced logs error:', error);
    return [];
  }
};

export const deleteTripLog = async (id) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync('DELETE FROM trip_logs WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete log error:', error);
  }
};

// ---------------------
// Delivery Expenses Functions
// ---------------------
export const addExpense = async (expense) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.runAsync(
      `INSERT INTO delivery_expenses 
        (dlf_code, expense_type, amount, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        expense.dlf_code,
        expense.expense_type,
        expense.amount,
        expense.created_at || getLocalTimestamp(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add expense error:', error);
    throw error;
  }
};

export const getExpensesByDeliveryId = async (deliveryId) => {
  try {
    const db = ensureDbInitialized();
    const expenses = await db.getAllAsync(
      'SELECT * FROM delivery_expenses WHERE dlf_code = ? ORDER BY id ASC',
      [deliveryId]
    );
    return expenses.map(exp => ({
      id: exp.id,
      type: exp.expense_type,
      amount: parseFloat(exp.amount),
    }));
  } catch (error) {
    console.error('Get expenses by delivery ID error:', error);
    return [];
  }
};

export const deleteExpense = async (id) => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync('DELETE FROM delivery_expenses WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete expense error:', error);
    throw error;
  }
};

// ---------------------
// Cached Expense Types Functions
// ---------------------
export const saveCachedExpenseTypes = async (expenseTypes) => {
  try {
    const db = ensureDbInitialized();
    
    for (const type of expenseTypes) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_expense_types 
          (expense_type, cached_at)
         VALUES (?, ?)`,
        [type, getLocalTimestamp()]
      );
    }
  } catch (error) {
    console.error('Save cached expense types error:', error);
    throw error;
  }
};

export const getCachedExpenseTypes = async () => {
  try {
    const db = ensureDbInitialized();
    const types = await db.getAllAsync(
      'SELECT expense_type FROM cached_expense_types ORDER BY expense_type ASC'
    );
    return types.map(t => t.expense_type);
  } catch (error) {
    console.error('Get cached expense types error:', error);
    return [];
  }
};

// ---------------------
// Cached Deliveries Functions
// ---------------------
export const saveCachedDelivery = async (delivery) => {
  try {
    const db = ensureDbInitialized();
    
    const deliveryDate = delivery.delivery_date || delivery.dlf_code.split('-').slice(0, 3).join('-');
    
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_deliveries 
        (dlf_code, driver, helper, plate_no, trip_count, delivery_date, customers_json, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        delivery.dlf_code,
        delivery.driver,
        delivery.helper || null,
        delivery.plate_no || null,
        delivery.trip_count || null,
        deliveryDate,
        JSON.stringify(delivery.customers || []),
        getLocalTimestamp(),
      ]
    );
  } catch (error) {
    console.error('Save cached delivery error:', error);
    throw error;
  }
};

export const getCachedDeliveries = async () => {
  try {
    const db = ensureDbInitialized();
    
    const today = new Date();

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayDate = formatDate(today);
    
    const deliveries = await db.getAllAsync(
      `SELECT * FROM cached_deliveries 
       WHERE delivery_date = ?
       ORDER BY dlf_code DESC`,
      [todayDate]
    );
    
    return deliveries.map(d => ({
      ...d,
      customers: JSON.parse(d.customers_json || '[]'),
    }));
  } catch (error) {
    console.error('Get cached deliveries error:', error);
    return [];
  }
};

export const getCachedDeliveryById = async (deliveryId) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.getAllAsync(
      'SELECT * FROM cached_deliveries WHERE dlf_code = ?',
      [deliveryId]
    );
    
    if (result.length > 0) {
      return {
        ...result[0],
        customers: JSON.parse(result[0].customers_json || '[]'),
      };
    }
    return null;
  } catch (error) {
    console.error('Get cached delivery by ID error:', error);
    return null;
  }
};

export const clearCachedDeliveries = async () => {
  try {
    const db = ensureDbInitialized();
    await db.runAsync('DELETE FROM cached_deliveries');
  } catch (error) {
    console.error('Clear cached deliveries error:', error);
  }
};