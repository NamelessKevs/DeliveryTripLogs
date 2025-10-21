import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_CONFIG } from '../config';

const LDDDataScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLDDData = async () => {
    try {
      setError(null);
      const response = await axios.get(
        `${API_CONFIG.LARAVEL_API_URL}/logistics/ldd-data`,
        { timeout: API_CONFIG.TIMEOUT }
      );

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('LDD fetch error:', err);
      if (err.response?.status === 403) {
        setError('Need to connect to company wifi to view data');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Check your connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLDDData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLDDData();
  };

const renderItem = ({ item }) => (
  <View style={styles.card}>
    {/* 🔹 DELIVERY INFORMATION */}
    <View style={styles.row}>
      <Text style={styles.label}>Delivery ID:</Text>
      <Text style={styles.value}>{item.delivery_id || 'N/A'}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Driver:</Text>
      <Text style={styles.value}>{item.driver || 'N/A'}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Helper:</Text>
      <Text style={styles.value}>{item.helper || 'N/A'}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Truck Plate:</Text>
      <Text style={styles.value}>{item.truckplateno || 'N/A'}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Trip:</Text>
      <Text style={styles.value}>{item.trip || 'N/A'}</Text>
    </View>

    {/* 🔹 DDS DATA */}
    {item.dds && item.dds.length > 0 && (
      <View style={{ marginTop: 10 }}>
        {item.dds.map((ddsItem, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={styles.label}>SO#:</Text>
            <Text style={styles.value}>{ddsItem.so_no || 'N/A'}</Text>

            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{ddsItem.customer_name || 'N/A'}</Text>
          </View>
        ))}
      </View>
    )}
  </View> // ✅ this closing tag was missing
);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1FCFFF" />
        <Text style={styles.loadingText}>Loading LDD data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LDD Data (Test)</Text>
        <Text style={styles.count}>Total: {data.length}</Text>
      </View>
      
      {data.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No data found</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  list: {
    padding: 15,
  },
  divider: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
});

export default LDDDataScreen;