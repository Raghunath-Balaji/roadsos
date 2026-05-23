import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {logOut, UserProfile } from '../../services/authService';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { startCrashDetection, stopCrashDetection } from '../../services/crashDetection';
import DriveModeOverlay from '../../components/DriveModeOverlay';

/**
 * Dashboard Screen
 * Displays the logged-in user's medical profile retrieved from Firestore.
 * Now includes the Drive Mode toggle for crash detection.
 */
export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDriveModeActive, setIsDriveModeActive] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  /**
   * Update Tab Bar visibility based on Drive Mode state
   */
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isDriveModeActive ? { display: 'none' } : undefined,
    });
  }, [isDriveModeActive]);
  const fetchProfileData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "userDetails", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setProfile(userDocSnap.data() as UserProfile);
      } else {
        console.warn("No user profile found in Firestore for UID:", user.uid);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Data Error", "Could not load your profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    
    // Ensure sensors are cleaned up if component unmounts
    return () => {
      stopCrashDetection();
    };
  }, []);

  /**
   * Toggle Drive Mode on/off.
   */
  const toggleDriveMode = () => {
    if (!isDriveModeActive) {
      setIsDriveModeActive(true);
      startCrashDetection(() => {
        // Crash detected callback
        setIsDriveModeActive(false);
        stopCrashDetection();
        router.push('/crash-alarm');
      });
    } else {
      setIsDriveModeActive(false);
      stopCrashDetection();
    }
  };

  /**
   * Handle user logout and cleanup session.
   */
  const handleSignOut = async () => {
    const { error } = await logOut();
    if (error) {
      Alert.alert("Logout Error", error);
    } else {
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-slate-500">Retrieving medical profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-6 pt-16">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-3xl font-bold text-slate-800">Dashboard</Text>
              <Text className="text-slate-500">Emergency Medical Profile</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} className="bg-slate-200 px-4 py-2 rounded-xl">
              <Text className="text-slate-700 font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Drive Mode Activation Card */}
          <TouchableOpacity 
            onPress={toggleDriveMode}
            activeOpacity={0.9}
            className={`rounded-3xl p-6 mb-6 shadow-sm border ${isDriveModeActive ? 'bg-blue-600 border-blue-700' : 'bg-white border-slate-100'}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`p-3 rounded-2xl mr-4 ${isDriveModeActive ? 'bg-white/20' : 'bg-blue-50'}`}>
                  <Ionicons name="car-sport" size={24} color={isDriveModeActive ? 'white' : '#3b82f6'} />
                </View>
                <View>
                  <Text className={`text-lg font-bold ${isDriveModeActive ? 'text-white' : 'text-slate-800'}`}>
                    Drive Mode
                  </Text>
                  <Text className={`text-sm ${isDriveModeActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {isDriveModeActive ? 'Monitoring for crashes...' : 'Enable crash detection'}
                  </Text>
                </View>
              </View>
              <View className={`px-4 py-2 rounded-full ${isDriveModeActive ? 'bg-green-400' : 'bg-slate-100'}`}>
                <Text className={`text-xs font-black uppercase tracking-widest ${isDriveModeActive ? 'text-white' : 'text-slate-400'}`}>
                  {isDriveModeActive ? 'ON' : 'OFF'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Primary Information Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-slate-100">
            <Text className="text-slate-400 uppercase text-[10px] font-extrabold tracking-widest mb-1">PATIENT NAME</Text>
            <Text className="text-2xl font-bold text-slate-800 mb-4">{profile?.name || 'N/A'}</Text>

            <View className="flex-row items-center justify-between border-t border-slate-50 pt-4">
              <View>
                <Text className="text-slate-400 uppercase text-[10px] font-extrabold tracking-widest mb-1">BLOOD GROUP</Text>
                <Text className="text-2xl font-bold text-red-600">{profile?.bloodGroup || 'N/A'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-400 uppercase text-[10px] font-extrabold tracking-widest mb-1">ACCOUNT TYPE</Text>
                <Text className="text-lg font-bold text-blue-600 capitalize">{profile?.role || 'Citizen'}</Text>
              </View>
            </View>
          </View>

          {/* Detailed Medical Info */}
          <View className="space-y-4">
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <Text className="text-orange-500 uppercase text-[10px] font-extrabold tracking-widest mb-2">KNOWN ALLERGENS</Text>
              <Text className="text-slate-700 text-lg font-medium leading-6">
                {profile?.allergens || 'None reported.'}
              </Text>
            </View>

            <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <Text className="text-blue-500 uppercase text-[10px] font-extrabold tracking-widest mb-2">CURRENT MEDICATIONS</Text>
              <Text className="text-slate-700 text-lg font-medium leading-6">
                {profile?.medications || 'None listed.'}
              </Text>
            </View>
          </View>

          {/* Safety Footer */}
          <View className="mt-10 p-5 bg-slate-800 rounded-3xl">
            <Text className="text-slate-400 text-xs text-center mb-1">REGISTERED EMAIL</Text>
            <Text className="text-white text-center font-bold">{profile?.email}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Full-screen Drive Mode Overlay */}
      {isDriveModeActive && (
        <DriveModeOverlay onExit={toggleDriveMode} />
      )}
    </View>
  );
}

