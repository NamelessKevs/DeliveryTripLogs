import axios from 'axios';
import { API_CONFIG } from '../config';

export const fetchTrucksFromAPI = async () => {
  try {
    const response = await axios.get(
      `${API_CONFIG.LARAVEL_API_URL}/maintenance/trucks`,
      {
        timeout: API_CONFIG.TIMEOUT,
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Token': API_CONFIG.API_TOKEN, // Add this line
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Fetch trucks error:', error);
    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please update app.');
    }
    throw new Error('Failed to fetch trucks');
  }
};