import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { signUpAdmin } from '../../services/authService';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

type EntityType = 'hospital' | 'ambulance' | 'police' | 'fire';

export default function AdminSignUpScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>('hospital');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successData, setSuccessData] = useState<{ unitId: string; passcode: string } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to register an entity.");
        setLocating(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error("Location Error:", error);
      Alert.alert("Error", "Could not fetch current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !location) {
      Alert.alert("Error", "Please provide a name and ensure location is captured.");
      return;
    }

    setLoading(true);
    const { unitId, passcode, error } = await signUpAdmin(name, type, location);
    setLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error);
    } else if (unitId && passcode) {
      setSuccessData({ unitId, passcode });
    }
  };

  if (successData) {
    return (
      <View className="flex-1 bg-white p-8 justify-center">
        <View className="items-center mb-10">
          <View className="bg-emerald-100 p-6 rounded-full mb-6">
            <Ionicons name="shield-checkmark" size={60} color="#10b981" />
          </View>
          <Text className="text-3xl font-black text-slate-900 text-center">Registration Successful!</Text>
          <Text className="text-slate-500 text-center mt-2 px-4">
            Please save these credentials securely. They will NOT be shown again.
          </Text>
        </View>

        <View className="bg-slate-50 border border-slate-200 rounded-[35px] p-8 space-y-6">
          <View>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Unit ID</Text>
            <View className="bg-white border border-slate-100 p-4 rounded-2xl">
              <Text className="text-2xl font-black text-slate-900 text-center tracking-widest">{successData.unitId}</Text>
            </View>
          </View>

          <View>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Passcode</Text>
            <View className="bg-white border border-slate-100 p-4 rounded-2xl">
              <Text className="text-2xl font-black text-blue-600 text-center tracking-widest">{successData.passcode}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          className="mt-12 bg-slate-900 p-6 rounded-[25px] items-center"
          onPress={() => router.replace('/(auth)/adminSignIn')}
        >
          <Text className="text-white text-lg font-black uppercase tracking-widest">Proceed to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 bg-white p-6">
      <View className="mt-10">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>

        <Text className="text-3xl font-black text-slate-900 mb-2">Entity Registration</Text>
        <Text className="text-slate-500 mb-10">Register your organization as an emergency responder.</Text>
        
        <View className="space-y-6">
          <View>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Organization Name</Text>
            <TextInput
              className="bg-slate-50 border border-slate-100 p-5 rounded-3xl text-slate-900 font-bold"
              placeholder="e.g. City General Hospital"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Entity Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['hospital', 'ambulance', 'police', 'fire'] as EntityType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`px-6 py-3 rounded-full border ${type === t ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-bold capitalize ${type === t ? 'text-white' : 'text-slate-600'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Base Location</Text>
            <TouchableOpacity 
              onPress={handleGetLocation}
              disabled={locating}
              className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color={location ? "#3b82f6" : "#94a3b8"} />
                <Text className={`ml-3 font-bold ${location ? 'text-slate-900' : 'text-slate-400'}`}>
                  {locating ? "Locating..." : location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Pin Entity Location"}
                </Text>
              </View>
              <Ionicons name="refresh" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <Text className="text-[10px] text-slate-400 mt-2 italic ml-2">* Location is used for 5km radius alert distribution.</Text>
          </View>
        </View>

        <TouchableOpacity 
          className={`mt-12 p-6 rounded-[30px] items-center shadow-lg ${loading ? 'bg-slate-300' : 'bg-blue-600 shadow-blue-200'}`}
          onPress={handleSignUp}
          disabled={loading || locating}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black uppercase tracking-widest">Register Entity</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/adminSignIn')} className="mt-8">
          <Text className="text-slate-400 text-center font-bold">
            Already registered? <Text className="text-blue-600">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
