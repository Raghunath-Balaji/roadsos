import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Alert, FlatList, Image } from 'react-native';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logOut } from '../../services/authService';
import { listenToActiveAlerts, ActiveAlert, acceptAlert } from '../../services/alertService';
import { UserProfile } from '../../services/authService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Helper Dashboard (Hospital Portal)
 * Displays a live feed of emergency incidents across the system.
 */
export default function HelperDashboard() {
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [patientInfo, setPatientInfo] = useState<{ [key: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

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
      setActiveAlerts(alerts);
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
        hospitalInfo?.name || "Emergency Center"
      );

      if (result.success) {
        Alert.alert("Success", "Incident accepted. Proceed to location.");
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
      className="bg-slate-900 rounded-3xl p-5 mb-4 border border-slate-800"
      onPress={() => {
        Alert.alert("Alert Selected", `Incident ID: ${item.id}\nSeverity: ${item.severity.toUpperCase()}`);
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: getSeverityColor(item.severity) }} 
          />
          <Text className="text-white font-bold uppercase text-xs tracking-widest">
            {item.severity} SEVERITY
          </Text>
        </View>
        <Text className="text-slate-500 text-[10px] font-mono">
          {item.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">PATIENT NAME</Text>
        <Text className="text-white text-lg font-medium">
          {patientInfo[item.userId]?.name || 'Loading...'}
        </Text>
      </View>

      {patientInfo[item.userId] && (
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">ALLERGIES</Text>
            <Text className="text-orange-400 text-xs font-medium">
              {patientInfo[item.userId].allergens || 'None reported'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">MEDICATIONS</Text>
            <Text className="text-blue-400 text-xs font-medium">
              {patientInfo[item.userId].medications || 'None listed'}
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row items-center bg-slate-800/50 p-3 rounded-2xl">
        <Ionicons name="location" size={16} color="#94a3b8" />
        <Text className="text-slate-300 text-xs ml-2">
          {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      </View>

      {item.additionalDetails && (
        <View className="mt-4 bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Additional Details</Text>
          <Text className="text-slate-200 text-xs leading-5">{item.additionalDetails}</Text>
        </View>
      )}

      {item.imageUrl && (
        <View className="mt-4">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Incident Photo</Text>
          <Image 
            source={{ uri: item.imageUrl }} 
            className="w-full h-48 rounded-2xl bg-slate-800"
            resizeMode="cover"
          />
        </View>
      )}

      <TouchableOpacity 
        className={`mt-4 py-3 rounded-xl items-center ${processingId === item.id ? 'bg-slate-700' : 'bg-red-600'}`}
        onPress={() => handleAcceptIncident(item)}
        disabled={processingId !== null}
      >
        {processingId === item.id ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white font-bold uppercase text-xs">Accept Incident</Text>
        )}
      </TouchableOpacity>
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
    </View>
  );
}
