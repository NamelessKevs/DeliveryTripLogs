import axios from 'axios';
import {API_CONFIG} from '../config';

export const syncTripsToGoogleSheets = async (trips) => {
  try {
    const response = await axios.post(
      API_CONFIG.GOOGLE_SHEETS_URL,
      { logs: trips }, // <--- use "logs" to match Apps Script
      {
        timeout: API_CONFIG.TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Google Sheets error');
    } else if (error.request) {
      throw new Error('Cannot reach Google Sheets. Check internet connection.');
    } else {
      throw new Error(error.message);
    }
  }
};

export const syncFuelToGoogleSheets = async (records) => {
  try {
    const response = await axios.post(
      API_CONFIG.GOOGLE_SHEETS_FUEL_URL, // Add this to config
      { records: records },
      {
        timeout: API_CONFIG.TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Google Sheets fuel sync error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Google Sheets error');
    } else if (error.request) {
      throw new Error('Cannot reach Google Sheets. Check internet connection.');
    } else {
      throw new Error(error.message);
    }
  }
};
