import React from 'react';
import {View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native';
import { styles, Colors } from '../styles/styles';
import { useTripList } from './hooks/useTripList';

const TripListScreen = ({ navigation }) => {
  const {
    trips, refreshing, syncing, loading, groupedDeliveries, draftCount, unsyncedCount, onRefresh, handleSync, handleEditDraft,
    handleDeleteDraft, handleLogout, handleUserManagement, formatDateTime, getStatusBadge,
  } = useTripList(navigation);

  const renderDelivery = ({ item }) => {
    const badge = getStatusBadge(item);
    const isDraft = item.synced === -1;
    
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripCardHeader}>
          <Text style={styles.tripCardDriverName}>{item.dlf_code}</Text>
          <View style={[styles.badge, styles[badge.style]]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>
        
        <Text style={styles.tripCardTruckPlate}>👤 {item.driver}</Text>
        {item.helper && (
          <Text style={styles.tripCardTruckPlate}>🤝 {item.helper}</Text>
        )}
        <Text style={styles.tripCardTruckPlate}>🚚 {item.plate_no} | Trip {item.trip_count}</Text>
        <Text style={styles.tripCardTruckPlate}>ODO Depart: {item.plant_odo_departure} | ODO Arrive: {item.plant_odo_arrival}</Text>
        
        <View style={styles.tripCardTimeContainer}>
          <View style={styles.tripCardTimeRow}>
            <Text style={styles.tripCardTimeLabel}>Depart:</Text>
            <Text style={styles.tripCardTimeText}>{formatDateTime(item.company_departure)}</Text>
          </View>
          {item.company_arrival && (
            <View style={styles.tripCardTimeRow}>
              <Text style={styles.tripCardTimeLabel}>Arrival:</Text>
              <Text style={styles.tripCardTimeText}>{formatDateTime(item.company_arrival)}</Text>
            </View>
          )}
        </View>

        {item.drops.length > 0 ? (
          <View style={styles.tripCardRouteContainer}>
            <Text style={styles.tripCardLocationLabel}>Drops:</Text>
            {item.drops.map((drop, idx) => (
              <View key={drop.id} style={{marginTop: 8}}>
                <Text style={styles.tripCardLocationText}>
                  {drop.drop_number}. {drop.customer}
                  {drop.form_type === 'pick-up' && (
                    <Text style={styles.tripPickUpBadge}> 📦 Pick-Up</Text>
                  )}
                </Text>
                <Text style={styles.tripCardTimeText}>
                    {formatDateTime(drop.customer_arrival)} - {formatDateTime(drop.customer_departure)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.tripCardRouteContainer}>
            <Text style={styles.tripCardRemarks}>No drops logged yet</Text>
          </View>
        )}

        {item.created_by && (
          <Text style={styles.tripCardCreatedBy}>👤 {item.created_by}</Text>
        )}

        {isDraft && (
          <View style={styles.tripCardDraftActions}>
            <TouchableOpacity
              style={styles.tripCardEditButton}
              onPress={() => handleEditDraft(item)}
            >
              <Text style={styles.tripCardEditButtonText}>✏️ Edit Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tripCardDeleteButton}
              onPress={() => handleDeleteDraft(item)}
            >
              <Text style={styles.tripCardDeleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tripListHeader}>
        <View>
          <Text style={styles.tripListTitle}>Trip Logs</Text>
        </View>
        <View>
        <Text style={styles.tripListCount}>
          Total: {groupedDeliveries.length} | Drafts: {draftCount} | Pending: {unsyncedCount}
        </Text>
        </View>
      </View>

      {unsyncedCount > 0 && (
        <TouchableOpacity
          style={styles.tripListSyncButton}
          onPress={handleSync}
          disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.tripListSyncButtonText}>
              Sync {unsyncedCount} Trips to Google Sheets
            </Text>
          )}
        </TouchableOpacity>
      )}

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No delivery trip logs</Text>
        </View>
      ) : (
        <FlatList
          data={groupedDeliveries}
          renderItem={renderDelivery}
          keyExtractor={item => item.dlf_code}
          contentContainerStyle={styles.tripListList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fabAccount}
        onPress={handleUserManagement}>
        <Text style={styles.fabAccountText}>🔑</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabLogout}
        onPress={handleLogout}>
        <Text style={styles.fabLogoutText}>↩️</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabForm}
        onPress={() => navigation.navigate('DeliveryForm')}>
        <Text style={styles.fabFormText}>🚚</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TripListScreen;