import { StyleSheet } from 'react-native';

// Color palette
export const Colors = {
  primary: '#1FCFFF',
  primaryDark: '#0099c3ff',
  primaryLight: '#acecfdff',
  primaryLighter: '#e3f7ff',
  success: '#10dc17ff',
  successLight: '#d4edda',
  warning: '#FF9500',
  warningLight: '#fff3cd',
  danger: '#ff6b6b',
  dangerLight: '#f8d7da',
  gray: '#84827dff',
  grayLight: '#7aa2aaff',
  // Text colors
  textDark: '#333',
  textMedium: '#666',
  textLight: '#999',
  // Background colors
  bgWhite: '#fff',
  bgLight: '#f5f5f5',
  bgLighter: '#f8f9fa',
  bgInput: '#f8f8f8ff',
  bgDisabled: '#f0f0f0',
  // Border colors
  borderLight: '#ddd',
  borderMedium: '#ccc',
  borderDark: '#e0e0e0',
};
export const styles = StyleSheet.create({
  // ============================================
  // COMMON STYLES (Used across multiple screens)
  // ============================================
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  hideMe: {
    display: 'none',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 10,
  },
  // Labels
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 5,
  },
  required: {
    color: 'red',
  },
  // Inputs
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: Colors.bgWhite,
    marginBottom: 12,
  },
  inputReadOnly: {
    backgroundColor: Colors.bgDisabled,
    color: Colors.textMedium,
  },
  inputDisabled: {
    backgroundColor: Colors.bgDisabled,
    color: '#504f4fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Dropdowns
  dropdownButton: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 15,
    backgroundColor: Colors.bgWhite,
    flex: 1,
    marginBottom: 10,
  },
  dropdownButtonExpenses: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 15,
    backgroundColor: Colors.bgWhite,
    marginBottom: 10,
  },
  dropdownButtonInRow: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 15,
    backgroundColor: Colors.bgWhite,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  dropdownDisabled: {
    backgroundColor: Colors.bgDisabled,
    opacity: 0.6,
  },
  // Buttons
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryDark: {
    backgroundColor: Colors.primaryDark,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonWarning: {
    backgroundColor: Colors.warning,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: Colors.danger,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonGray: {
    backgroundColor: Colors.gray,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  buttonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  // Small buttons
  buttonSmall: {
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  // Button rows
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  // Info boxes
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.bgLighter,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
  },
  // Cards
  card: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Badges
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncedBadge: {
    backgroundColor: Colors.successLight,
  },
  unsyncedBadge: {
    backgroundColor: Colors.warningLight,
  },
  draftBadge: {
    backgroundColor: Colors.dangerLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDark,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalContentBottom: {
    backgroundColor: Colors.bgWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 15,
  },
  // Picker modal
  pickerContent: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  pickerCloseButton: {
    backgroundColor: Colors.borderMedium,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  pickerCloseButtonText: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  // FABs (Floating Action Buttons)
  fab: {
    position: 'absolute',
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
  },
  // Input rows
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textLight,
  },
  // ============================================
  // LoginScreen Section
  // ============================================
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.bgWhite,
  },
  loginLogo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  loginLinkText: { 
    color: Colors.primary, 
    marginTop: 15, 
    textAlign: 'center' 
  },
  // ============================================
  // RegisterScreen Section
  // ============================================
  registerScrollContent: {
    padding: 0,
    paddingBottom: 40,
  },
  registerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  // ============================================
  // TripListScreen Section
  // ============================================
  tripListHeader: {
    backgroundColor: Colors.bgWhite,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  tripListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  tripListCount: {
    fontSize: 14,
    color: Colors.textMedium,
    marginTop: 5,
  },
  tripListSyncButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  tripListSyncButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  tripListList: {
    padding: 15,
  },
  tripCard: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripCardDriverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  tripCardTruckPlate: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: 10,
  },
  tripCardRouteContainer: {
    backgroundColor: Colors.bgLighter,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  tripCardLocationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
    width: 50,
  },
  tripCardLocationText: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
  },
  tripCardTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tripCardTimeRow: {
    flex: 1,
  },
  tripCardTimeLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 2,
  },
  tripCardTimeText: {
    fontSize: 13,
    color: Colors.textDark,
  },
  tripCardRemarks: {
    fontSize: 13,
    color: Colors.textMedium,
    marginTop: 8,
    fontStyle: 'italic',
  },
  tripCardCreatedBy: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  tripCardDraftActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tripCardEditButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tripCardEditButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  tripCardDeleteButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tripCardDeleteButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  tripPickUpBadge: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fabLogout: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    backgroundColor: Colors.grayLight,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabLogoutText: {
    fontSize: 24,
  },
  fabAccount: {
    position: 'absolute',
    right: 20,
    bottom: 130,
    backgroundColor: Colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabAccountText: {
    fontSize: 24,
  },
  fabForm: {
    position: 'absolute',
    right: 20,
    bottom: 200,
    backgroundColor: '#4caf50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabFormText: {
    fontSize: 24,
  },
  // ============================================
  // DeliveryFormScreen Section
  // ============================================
  deliveryFormEditModeButton: {
    display: 'none',
  },
  deliveryFormRefreshButton: {
    backgroundColor: Colors.primaryLight,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryFormRefreshButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryFormExpenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deliveryFormExpenseType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  deliveryFormExpenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  deliveryFormAddExpenseButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveryFormAddExpenseButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryFormDeleteExpenseButton: {
    backgroundColor: Colors.danger,
    padding: 8,
    borderRadius: 6,
  },
  deliveryFormDeleteExpenseButtonText: {
    color: Colors.bgWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryFormDeliveryAddressText: {
    fontSize: 12,
    color: Colors.textMedium,
    marginLeft: 30,
    marginTop: 2,
  },
  deliveryFormUsedBadge: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deliveryFormChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryFormCheckbox: {
    fontSize: 20,
    marginRight: 10,
  },
  deliveryFormChecklistText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  deliveryFormDropLogCard: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deliveryFormDropTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 5,
  },
  deliveryFormDropTime: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: 10,
  },
  deliveryFormEditButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deliveryFormEditButtonText: {
    color: Colors.bgWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryFormAddDropButton: {
    backgroundColor: Colors.success,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  deliveryFormAddDropButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryFormDraftButton: {
    flex: 1,
    backgroundColor: Colors.gray,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveryFormFinalizeButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveryFormDeliveryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  deliveryFormDeliveryItemUsed: {
    backgroundColor: Colors.bgDisabled,
    opacity: 0.6,
  },
  deliveryFormDeliveryItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  deliveryFormDeliveryItemTextDisabled: {
    color: Colors.textLight,
  },
  deliveryFormDeliveryItemSubtext: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 4,
  },
  deliveryFormModalCloseButton: {
    backgroundColor: Colors.borderMedium,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deliveryFormModalCloseButtonText: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryFormCaptureButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deliveryFormCaptureButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  // ============================================
  // TruckFuelFormScreen Section
  // ============================================
  fuelFormPhotoContainer: {
    marginBottom: 12,
  },
  fuelFormPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: Colors.bgDisabled,
  },
  fuelFormPhotoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  fuelFormCameraButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelFormCameraButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  fuelFormGalleryButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelFormGalleryButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  fuelFormRetakeButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelFormRetakeButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  fuelFormRemovePhotoButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelFormRemovePhotoButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  fuelFormUploadedBadge: {
    backgroundColor: '#4CAF50',
    color: Colors.bgWhite,
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  fuelFormSuggestionsContainer: {
    backgroundColor: Colors.bgWhite,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    marginTop: -10,
    marginBottom: 10,
    maxHeight: 200,
  },
  fuelFormSuggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fuelFormSuggestionPayee: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  fuelFormSuggestionTin: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  fuelFormRefreshIconButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: Colors.bgWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fuelFormRefreshIcon: {
    fontSize: 20,
  },
  fuelFormEmptyPickerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  fuelFormEmptyPickerText: {
    fontSize: 16,
    color: Colors.textMedium,
    marginBottom: 15,
  },
  fuelFormFetchButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  fuelFormFetchButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  fuelFormCaptureButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fuelFormCaptureButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fuelFormDraftButton: {
    flex: 1,
    backgroundColor: Colors.gray,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  fuelFormFinalizeButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  // ============================================
  // MonitoringScreen Section
  // ============================================
  monitoringHeader: {
    backgroundColor: Colors.bgWhite,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  monitoringTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  monitoringCount: {
    fontSize: 14,
    color: Colors.textMedium,
    marginTop: 5,
  },
  monitoringSyncButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  monitoringSyncButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  monitoringList: {
    padding: 15,
  },
  monitoringRecordCard: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monitoringRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monitoringTfpId: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  monitoringRecordDetail: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: 4,
  },
  monitoringTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  monitoringTimeRow: {
    flex: 1,
  },
  monitoringTimeLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 2,
  },
  monitoringTimeText: {
    fontSize: 13,
    color: Colors.textDark,
  },
  monitoringTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
    marginTop: 8,
  },
  monitoringCreatedBy: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  monitoringDraftActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  monitoringEditButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  monitoringEditButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  monitoringDeleteButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  monitoringDeleteButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  // ============================================
  // UserManagementScreen Section
  // ============================================
  userManagementContainer: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  userManagementList: {
    padding: 15,
  },
  userManagementResetButton: {
    backgroundColor: Colors.danger,
    padding: 12,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    bottom: 40,
    borderColor: '#ff0000',
  },
  userManagementResetButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  userManagementCard: {
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userManagementUserInfo: {
    flex: 1,
  },
  userManagementUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  userManagementYouBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  userManagementUserUsername: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  userManagementActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  userManagementEditButton: {
    backgroundColor: '#b7eefdff',
    padding: 10,
    borderRadius: 8,
    width: 45,
    alignItems: 'center',
  },
  userManagementEditButtonText: {
    fontSize: 18,
  },
  userManagementDeleteButton: {
    backgroundColor: '#ffc0c0ff',
    padding: 10,
    borderRadius: 8,
    width: 45,
    alignItems: 'center',
  },
  userManagementDeleteButtonText: {
    fontSize: 18,
  },
  userManagementModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  userManagementModalContent: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    padding: 20,
  },
  userManagementModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  userManagementModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  userManagementModalBtnCancel: {
    backgroundColor: Colors.borderMedium,
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  userManagementModalBtnSave: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  userManagementModalBtnText: {
    color: Colors.bgWhite,
    fontWeight: '600',
    textAlign: 'center',
  },
  // ============================================
  // CustomerDropModal Section
  // ============================================
  customerDropModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  customerDropModalContent: {
    backgroundColor: Colors.bgWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  customerDropModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 20,
  },
  customerDropLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 15,
    marginBottom: 8,
  },
  customerDropDeliveryAddressSubtext: {
    fontSize: 12,
    color: '#888888ff',
    marginTop: 4,
  },
  customerDropRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.bgWhite,
  },
  customerDropRadioOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  customerDropRadioOptionDisabled: {
    display: 'none',
  },
  customerDropRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDropRadioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  customerDropRadioText: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
  },
  customerDropLoggedBadge: {
    color: Colors.success,
    fontWeight: 'bold',
  },
  customerDropCaptureButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customerDropCaptureButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  customerDropButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  customerDropCancelButton: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  customerDropCancelButtonText: {
    color: '#641',
    fontSize: 16,
    fontWeight: '600',
  },
  customerDropSaveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  customerDropSaveButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  // ============================================
  // ExpenseModal Section
  // ============================================
  expenseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  expenseModalContent: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    padding: 20,
  },
  expenseModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.textDark,
  },
  expenseModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  expenseModalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  expenseModalCancelButton: {
    flex: 1,
    backgroundColor: Colors.borderMedium,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  expenseModalCancelButtonText: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  expenseModalSaveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  expenseModalSaveButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  // ============================================
  // PickUpFormModal Section
  // ============================================
  pickUpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickUpModalContent: {
    backgroundColor: Colors.bgWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  pickUpModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 20,
  },
  pickUpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 15,
    marginBottom: 8,
  },
  pickUpCaptureButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickUpCaptureButtonText: {
    color: Colors.bgWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  pickUpButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  pickUpCancelButton: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  pickUpCancelButtonText: {
    color: '#641',
    fontSize: 16,
    fontWeight: '600',
  },
  pickUpSaveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickUpSaveButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});