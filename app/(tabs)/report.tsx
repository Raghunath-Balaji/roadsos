import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { 
  AlertSeverity, 
  uploadAlertImage, 
  createBystanderAlert 
} from '../../services/alertService';
import { useRouter } from 'expo-router';

/**
 * Report Screen
 * Allows users to report emergencies on behalf of others.
 * Mandatory photo, optional name and details.
 */
export default function ReportScreen() {
  const [patientName, setPatientName] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('medium');
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera access is required for verification photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // 1. Mandatory Photo Check
    if (!imageUri) {
      Alert.alert("Photo Required", "Please take a photo of the incident for verification.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to report an incident.");
      return;
    }

    setSubmitting(true);

    try {
      // 2. Get Location
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        throw new Error("Location access is required to send emergency services.");
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3. Upload Image (Temp alert ID used for naming)
      const uploadRes = await uploadAlertImage(imageUri, "bystander", user.uid);
      if (!uploadRes.success) throw new Error(uploadRes.error);

      // 4. Create Alert
      const result = await createBystanderAlert(
        user.uid,
        patientName || 'John Doe',
        severity,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        details,
        uploadRes.url!,
        searchRadius
      );

      if (result.success) {
        Alert.alert(
          "Report Sent",
          "The emergency services have been notified. Thank you for your assistance.",
          [{ text: "OK", onPress: () => {
            // Reset Form
            setPatientName('');
            setSeverity('medium');
            setDetails('');
            setImageUri(null);
            router.replace('/(tabs)/sos'); // Redirect to tracking or home
          }}]
        );
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      Alert.alert("Report Failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const SeverityButton = ({ level, label, color }: { level: AlertSeverity, label: string, color: string }) => (
    <TouchableOpacity
      onPress={() => setSeverity(level)}
      className={`flex-1 py-3 rounded-xl items-center border-2 ${severity === level ? 'border-slate-900 bg-white shadow-sm' : 'border-transparent bg-slate-100'}`}
    >
      <View className={`w-3 h-3 rounded-full mb-1`} style={{ backgroundColor: color }} />
      <Text className={`text-[10px] font-bold uppercase ${severity === level ? 'text-slate-900' : 'text-slate-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <View className="mb-8">
          <Text className="text-3xl font-extrabold text-slate-900">Bystander Report</Text>
          <Text className="text-slate-500 mt-2">Report an emergency for someone else. Photo verification is mandatory.</Text>
        </View>

        <View className="space-y-6">
          {/* Patient Name */}
          <View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Patient Name (Optional)</Text>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900"
              placeholder="e.g. John Doe"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          {/* Severity */}
          <View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Emergency Level</Text>
            <View className="flex-row gap-2">
              <SeverityButton level="low" label="Low" color="#10b981" />
              <SeverityButton level="medium" label="Medium" color="#f59e0b" />
              <SeverityButton level="high" label="High" color="#ef4444" />
            </View>
          </View>

          {/* Photo Capture */}
          <View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Visual Verification (Mandatory)</Text>
            <TouchableOpacity 
              onPress={takePhoto}
              className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed items-center justify-center overflow-hidden ${imageUri ? 'border-blue-500' : 'border-slate-200 bg-slate-50'}`}
            >
              {imageUri ? (
                <View className="w-full h-full">
                  <Image source={{ uri: imageUri }} className="w-full h-full" />
                  <View className="absolute bottom-4 right-4 bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="camera" size={20} color="white" />
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Ionicons name="camera-outline" size={48} color="#94a3b8" />
                  <Text className="text-slate-400 font-medium mt-2">Tap to take photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Additional Details */}
          <View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Additional Details (Optional)</Text>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 min-h-[100px]"
              placeholder="Describe the injuries or location specifics..."
              multiline
              textAlignVertical="top"
              value={details}
              onChangeText={setDetails}
            />
          </View>

          {/* Search Radius */}
          <View>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">Response Radius</Text>
            <View className="flex-row gap-2">
              {[5, 10, 20].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setSearchRadius(r)}
                  className={`flex-1 py-2 rounded-xl items-center border ${searchRadius === r ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-bold text-xs ${searchRadius === r ? 'text-white' : 'text-slate-500'}`}>{r}km</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`py-5 rounded-3xl items-center shadow-lg ${submitting || !imageUri ? 'bg-slate-300 shadow-none' : 'bg-red-600 shadow-red-200'}`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg uppercase tracking-widest">Broadcast Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
