import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ActiveAlert, markAsSaved } from '../../services/alertService';
import { UserProfile } from '../../services/authService';
import LeafletMap from '../LeafletMap';
import { Ionicons } from '@expo/vector-icons';

export default function MissionScreen() {
  const { alertId, userId } = useLocalSearchParams<{ alertId: string; userId: string }>();
  const [alert, setAlert] = useState<ActiveAlert | null>(null);
  const [patientProfile, setPatientProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!alertId) return;

    // Listen to the specific alert for real-time updates
    const unsubscribe = onSnapshot(doc(db, "liveAlerts", alertId), async (docSnap) => {
      if (docSnap.exists()) {
        const alertData = { id: docSnap.id, ...docSnap.data() } as ActiveAlert;
        setAlert(alertData);

        // Fetch patient profile if it's a self-report and we haven't fetched it yet
        if (!alertData.isBystanderReport && alertData.userId && !patientProfile) {
          try {
            const userDoc = await getDoc(doc(db, "userDetails", alertData.userId));
            if (userDoc.exists()) {
              setPatientProfile(userDoc.data() as UserProfile);
            }
          } catch (error) {
            console.error("Error fetching patient profile:", error);
          }
        }
      } else {
        // Alert was deleted (resolved)
        Alert.alert("Mission Complete", "The incident has been resolved.");
        router.replace('/(helper)/dashboard');
      }
      setLoading(false);
    }, (error) => {
      console.error("Mission Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [alertId]);

  const handleOpenNavigation = () => {
    if (!alert) return;
    const { latitude, longitude } = alert.location;
    const label = "Emergency Location";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    if (url) Linking.openURL(url);
  };

  const handleCompleteMission = async () => {
    if (!alert) return;
    
    setResolving(true);
    try {
      const result = await markAsSaved(alert.id, alert.userId, alert.isBystanderReport);
      if (result.success) {
        router.replace('/(helper)/dashboard');
      } else {
        Alert.alert("Error", "Failed to resolve mission.");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-4 text-slate-400">Loading Mission Data...</Text>
      </View>
    );
  }

  if (!alert) return null;

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <View className="flex-row items-center mb-8">
          <View className="bg-red-600/20 p-3 rounded-2xl mr-4">
            <Ionicons name="shield-checkmark" size={24} color="#ef4444" />
          </View>
          <View>
            <Text className="text-red-500 text-[10px] font-bold uppercase tracking-[3px]">Active Mission</Text>
            <Text className="text-white text-2xl font-black">ON ROUTE</Text>
          </View>
        </View>

        {/* Incident Image (if available) */}
        {alert.imageUrl && (
          <View className="mb-6 overflow-hidden rounded-[30px] border border-slate-800">
            <Image 
              source={{ uri: alert.imageUrl }} 
              className="w-full h-56 bg-slate-800"
              resizeMode="cover"
            />
            <View className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full shadow-lg">
              <Text className="text-white font-bold text-[10px] uppercase">Incident Image</Text>
            </View>
          </View>
        )}

        {/* Map Section */}
        <View className="w-full h-64 rounded-[40px] overflow-hidden border border-slate-800 bg-slate-900 mb-8">
          <LeafletMap 
            latitude={alert.location.latitude}
            longitude={alert.location.longitude}
            zoom={16}
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          onPress={handleOpenNavigation}
          className="bg-blue-600 flex-row items-center justify-center py-5 rounded-3xl mb-4 shadow-lg shadow-blue-500/20"
        >
          <Ionicons name="navigate" size={24} color="white" />
          <Text className="text-white font-black uppercase tracking-widest ml-3">Start Navigation</Text>
        </TouchableOpacity>

        {/* Patient Info Card */}
        <View className="bg-slate-900 rounded-[35px] p-6 border border-slate-800 mb-8">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Patient Details</Text>
          
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-2">
                {alert.isBystanderReport ? alert.reportedPatientName : (patientProfile?.name || "Authenticated User")}
              </Text>
              <View className="flex-row items-center bg-slate-800 self-start px-3 py-1 rounded-full border border-slate-700">
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#10b981' }} />
                <Text className="text-white font-bold text-[10px] uppercase">{alert.severity} SEVERITY</Text>
              </View>
            </View>
            {!alert.isBystanderReport && patientProfile?.bloodGroup && (
              <View className="items-end">
                <Text className="text-red-500 font-black text-xl">{patientProfile.bloodGroup}</Text>
                <Text className="text-slate-500 text-[8px] font-bold uppercase">Blood Type</Text>
              </View>
            )}
          </View>

          {/* Medical Info for Self Reports */}
          {!alert.isBystanderReport && patientProfile && (
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                <Text className="text-orange-500 text-[9px] font-bold uppercase mb-1">Allergies</Text>
                <Text className="text-slate-200 text-xs font-medium">{patientProfile.allergens || 'None'}</Text>
              </View>
              <View className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                <Text className="text-blue-500 text-[9px] font-bold uppercase mb-1">Meds</Text>
                <Text className="text-slate-200 text-xs font-medium">{patientProfile.medications || 'None'}</Text>
              </View>
            </View>
          )}
          
          {alert.additionalDetails && (
            <View className="mt-4 pt-4 border-t border-slate-800">
              <Text className="text-slate-500 text-[10px] font-bold uppercase mb-2">Incident Briefing</Text>
              <Text className="text-slate-400 text-sm leading-6 italic">{alert.additionalDetails}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          onPress={handleCompleteMission}
          disabled={resolving}
          className="bg-slate-100 py-5 rounded-3xl items-center mb-12"
        >
          {resolving ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text className="text-slate-900 font-black uppercase tracking-widest">Mark as Resolved</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
