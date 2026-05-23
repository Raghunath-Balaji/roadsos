import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Modal, Image, Dimensions } from 'react-native';
import LeafletMap from '../LeafletMap';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logOut } from '../../services/authService';
import { listenToActiveAlerts, ActiveAlert, acceptAlert } from '../../services/alertService';
import { UserProfile } from '../../services/authService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { calculateDistance } from '../../services/haversine';

const { width } = Dimensions.get('window');

/**
 * Helper Dashboard (Hospital Portal)
 * Displays a live feed of emergency incidents across the system.
 */
export default function HelperDashboard() {
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [rawAlerts, setRawAlerts] = useState<ActiveAlert[]>([]);
  const [helperLocation, setHelperLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [patientInfo, setPatientInfo] = useState<{ [key: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ActiveAlert | null>(null);
  const router = useRouter();

  /**
   * Watch helper's live location
   */
  useEffect(() => {
    let locationSubscription: any;

    const startWatching = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location access is required to receive local alerts.");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setHelperLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    startWatching();
    return () => locationSubscription?.remove();
  }, []);

  /**
   * Compute filtered alerts based on geofencing
   */
  const activeAlerts = useMemo(() => {
    if (!helperLocation) return [];

    return rawAlerts.filter(alert => {
      const distance = calculateDistance(
        helperLocation.latitude,
        helperLocation.longitude,
        alert.location.latitude,
        alert.location.longitude
      );
      
      // If alert doesn't have a search radius, default to 5km
      const radius = alert.searchRadiusKm || 5;
      return distance <= radius;
    });
  }, [rawAlerts, helperLocation]);

  /**
   * Fetch both the staff member's individual info and their shared hospital data.
   */
  const loadHospitalData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const registrySnap = await getDoc(doc(db, "staffRegistry", user.uid));
      if (!registrySnap.exists()) {
        throw new Error("You are not registered as a hospital staff member.");
      }
      
      const { hospitalId } = registrySnap.data();

      const hospitalSnap = await getDoc(doc(db, "hospitals", hospitalId));
      if (hospitalSnap.exists()) {
        setHospitalInfo(hospitalSnap.data());
      }

      const staffSnap = await getDoc(doc(db, "hospitals", hospitalId, "staff", user.uid));
      if (staffSnap.exists()) {
        setStaffInfo(staffSnap.data());
      }

    } catch (error: any) {
      console.error("Dashboard Load Error:", error);
      Alert.alert("Access Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitalData();

    // Start listening to active alerts
    const unsubscribe = listenToActiveAlerts((alerts) => {
      setRawAlerts(alerts);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Fetch patient details for alerts that don't have them cached yet.
   */
  useEffect(() => {
    const fetchPatientDetails = async () => {
      const newUids = activeAlerts
        .map(a => a.userId)
        .filter(uid => !patientInfo[uid]);
      
      if (newUids.length === 0) return;

      const updatedInfo = { ...patientInfo };
      let hasNewData = false;

      await Promise.all(newUids.map(async (uid) => {
        try {
          const docSnap = await getDoc(doc(db, "userDetails", uid));
          if (docSnap.exists()) {
            updatedInfo[uid] = docSnap.data() as UserProfile;
            hasNewData = true;
          }
        } catch (error) {
          console.error(`Error fetching user details for ${uid}:`, error);
        }
      }));

      if (hasNewData) {
        setPatientInfo(updatedInfo);
      }
    };

    fetchPatientDetails();
  }, [activeAlerts]);

  const handleSignOut = async () => {
    await logOut();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#10b981'; // emerald-500
      default: return '#64748b'; // slate-500
    }
  };

  const handleAcceptIncident = async (alert: ActiveAlert) => {
    try {
      setProcessingId(alert.id);
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required");

      const result = await acceptAlert(
        alert.id,
        alert.userId,
        user.uid,
        staffInfo?.name || "Emergency Responder",
        hospitalInfo?.name || "Emergency Center",
        alert.isBystanderReport
      );

      if (result.success) {
        router.push({
          pathname: '/(helper)/mission',
          params: { alertId: alert.id, userId: alert.userId }
        });
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const renderAlertItem = ({ item }: { item: ActiveAlert }) => (
    <TouchableOpacity 
      className="bg-slate-900 rounded-3xl p-4 mb-3 border border-slate-800 flex-row items-center"
      onPress={() => setSelectedAlert(item)}
    >
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-16 h-16 rounded-2xl mr-4 bg-slate-800"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-2xl mr-4 bg-slate-800 items-center justify-center border border-slate-700">
          <Ionicons name="image-outline" size={24} color="#475569" />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <View 
            className="w-2 h-2 rounded-full mr-2" 
            style={{ backgroundColor: getSeverityColor(item.severity) }} 
          />
          <Text className="text-white font-bold text-xs uppercase tracking-wider">
            {item.severity}
          </Text>
        </View>
        <Text className="text-white text-lg font-bold" numberOfLines={1}>
          {item.isBystanderReport ? item.reportedPatientName : (patientInfo[item.userId]?.name || 'Loading...')}
        </Text>
        <Text className="text-slate-500 text-[10px] font-mono">
          {item.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
        </Text>
      </View>

      <View className="bg-slate-800 p-2 rounded-xl">
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-4 text-slate-400 font-medium">Initializing Command Center...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View className="mt-12">
          {/* Hospital Header */}
          <View className="flex-row justify-between items-start mb-8">
            <View className="flex-1">
              <Text className="text-red-500 text-[10px] font-bold uppercase tracking-[3px] mb-1">Live Response System</Text>
              <Text className="text-white text-3xl font-bold leading-tight">{hospitalInfo?.name || 'Emergency Center'}</Text>
              <View className="bg-slate-900 self-start px-3 py-1 rounded-full mt-2 border border-slate-800">
                <Text className="text-slate-400 text-[10px] font-mono">UNIT ID: {hospitalInfo?.hospitalId}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleSignOut} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
              <Text className="text-slate-400 font-bold text-[10px] uppercase">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Staff Banner */}
          <View className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-10 flex-row items-center">
            <View className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center mr-4">
              <Text className="text-red-500 font-bold text-lg">{staffInfo?.name?.charAt(0)}</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Logged in as</Text>
              <Text className="text-white text-lg font-semibold">{staffInfo?.name}</Text>
            </View>
          </View>

          {/* Live Incident Feed Section */}
          <View>
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                <Text className="text-white text-xl font-extrabold uppercase tracking-tight">Active Alerts</Text>
              </View>
              <View className="bg-red-600/10 px-3 py-1 rounded-full border border-red-600/20">
                <Text className="text-red-500 text-[10px] font-bold uppercase">{activeAlerts.length} Pending</Text>
              </View>
            </View>

            {activeAlerts.length === 0 ? (
              <View className="bg-slate-900/30 rounded-[40px] p-12 border-2 border-dashed border-slate-900 items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={48} color="#1e293b" />
                <Text className="text-slate-600 text-center font-bold mt-4 uppercase tracking-tighter">
                  Area Secured
                </Text>
                <Text className="text-slate-800 text-[10px] text-center mt-2 uppercase tracking-widest font-bold">
                  No active incidents reported
                </Text>
              </View>
            ) : (
              <View>
                {activeAlerts.map(alert => (
                  <View key={alert.id}>
                    {renderAlertItem({ item: alert })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Case Detail Modal */}
      <Modal
        visible={selectedAlert !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-slate-900 rounded-t-[50px] p-6 max-h-[90%] border-t border-slate-800">
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 bg-slate-800 rounded-full mb-6" />
              <View className="flex-row items-center justify-between w-full">
                <Text className="text-white text-2xl font-black uppercase tracking-tighter">Emergency Details</Text>
                <TouchableOpacity 
                  onPress={() => setSelectedAlert(null)}
                  className="bg-slate-800 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedAlert && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Visual Verification */}
                {selectedAlert.imageUrl && (
                  <View className="mb-6 overflow-hidden rounded-[30px] border border-slate-800">
                    <Image 
                      source={{ uri: selectedAlert.imageUrl }} 
                      className="w-full h-56 bg-slate-800"
                      resizeMode="cover"
                    />
                    <View className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full shadow-lg">
                      <Text className="text-white font-bold text-[10px] uppercase">Incident Image</Text>
                    </View>
                  </View>
                )}

                {/* Patient Overview */}
                <View className="bg-slate-800/50 p-6 rounded-[35px] border border-slate-800 mb-6">
                  <View className="flex-row justify-between items-center mb-6">
                    <View>
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Patient Name</Text>
                      <Text className="text-white text-2xl font-bold">
                        {selectedAlert.isBystanderReport ? selectedAlert.reportedPatientName : (patientInfo[selectedAlert.userId]?.name || 'Loading...')}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Severity</Text>
                      <View className="flex-row items-center bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getSeverityColor(selectedAlert.severity) }} />
                        <Text className="text-white font-bold text-[10px] uppercase">{selectedAlert.severity}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                      <Text className="text-orange-500 text-[9px] font-bold uppercase tracking-widest mb-1">Allergies</Text>
                      <Text className="text-slate-200 text-xs font-medium">
                        {selectedAlert.isBystanderReport ? 'Unavailable' : (patientInfo[selectedAlert.userId]?.allergens || 'None reported')}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                      <Text className="text-blue-500 text-[9px] font-bold uppercase tracking-widest mb-1">Medications</Text>
                      <Text className="text-slate-200 text-xs font-medium">
                        {selectedAlert.isBystanderReport ? 'Unavailable' : (patientInfo[selectedAlert.userId]?.medications || 'None listed')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Additional Details */}
                {selectedAlert.additionalDetails && (
                  <View className="mb-6">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Incident Briefing</Text>
                    <View className="bg-slate-900 p-5 rounded-[30px] border border-slate-800">
                      <Text className="text-slate-300 leading-6 text-sm">{selectedAlert.additionalDetails}</Text>
                    </View>
                  </View>
                )}

                {/* Location Map */}
                <View className="mb-8">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Exact Location</Text>
                  <View className="w-full h-48 rounded-[35px] overflow-hidden border border-slate-800 bg-slate-900">
                    <LeafletMap 
                      latitude={selectedAlert.location.latitude}
                      longitude={selectedAlert.location.longitude}
                    />
                  </View>
                  <View className="flex-row items-center mt-3 ml-4">
                    <Ionicons name="location" size={14} color="#94a3b8" />
                    <Text className="text-slate-500 text-[10px] ml-1 font-mono">
                      LAT: {selectedAlert.location.latitude.toFixed(6)} | LONG: {selectedAlert.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>

                {/* Accept Button */}
                <TouchableOpacity 
                  className={`mb-10 py-5 rounded-[25px] items-center flex-row justify-center ${processingId === selectedAlert.id ? 'bg-slate-800' : 'bg-red-600'}`}
                  onPress={() => {
                    handleAcceptIncident(selectedAlert);
                    setSelectedAlert(null);
                  }}
                  disabled={processingId !== null}
                >
                  {processingId === selectedAlert.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkbox" size={24} color="white" className="mr-3" />
                      <Text className="text-white font-black uppercase tracking-widest ml-3">Accept Mission</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];
