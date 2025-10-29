import axios from 'axios';
import { API_CONFIG } from '../config';

export const fetchDeliveriesFromAPI = async (driverName) => {
  try {
    const response = await axios.get(
      `${API_CONFIG.LARAVEL_API_URL}/logistics/ldd-data`,
      {
        params: { driver: driverName },
        timeout: API_CONFIG.TIMEOUT,
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Token': API_CONFIG.API_TOKEN, // Add this line
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Fetch deliveries error:', error);
    if (error.response?.status === 403) {
      throw new Error('Must be connected to company WiFi (ap-prd)');
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please update app.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Check your connection.');
    } else if (error.response) {
      throw new Error(error.response.data.message || 'API error');
    } else if (error.request) {
      throw new Error('Cannot reach server. Check internet connection.');
    } else {
      throw new Error(error.message);
    }
  }
};