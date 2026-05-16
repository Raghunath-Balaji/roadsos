import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { signInAdmin } from '../../services/authService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSignInScreen() {
  const [unitId, setUnitId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSignIn = async () => {
    if (!unitId || !passcode) {
      Alert.alert("Error", "Please enter both Unit ID and Passcode");
      return;
    }

    setLoading(true);
    const { error } = await signInAdmin(unitId, passcode);
    setLoading(false);

    if (error) {
      Alert.alert("Sign In Failed", error);
    } else {
      router.replace('/(admin)/dashboard');
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <TouchableOpacity onPress={() => router.replace('/')} className="absolute top-16 left-6">
        <Ionicons name="arrow-back" size={28} color="#1e293b" />
      </TouchableOpacity>

      <View className="mb-10">
        <Text className="text-4xl font-black text-slate-900 mb-2">Admin Login</Text>
        <Text className="text-slate-500">Access your organization's dashboard.</Text>
      </View>
      
      <View className="space-y-6">
        <View>
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Unit ID</Text>
          <TextInput
            className="bg-slate-50 border border-slate-100 p-5 rounded-3xl text-slate-900 font-bold"
            placeholder="HELP-XXXXX"
            value={unitId}
            onChangeText={setUnitId}
            autoCapitalize="characters"
          />
        </View>
        
        <View>
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Passcode</Text>
          <TextInput
            className="bg-slate-50 border border-slate-100 p-5 rounded-3xl text-slate-900 font-bold"
            placeholder="Your 10-char passcode"
            value={passcode}
            onChangeText={setPasscode}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity 
        className={`mt-10 p-6 rounded-[30px] items-center shadow-lg ${loading ? 'bg-slate-300' : 'bg-slate-900'}`}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-black uppercase tracking-widest">Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/adminSignUp')} className="mt-8">
        <Text className="text-slate-400 text-center font-bold">
          Need to register? <Text className="text-blue-600">Create Entity</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
