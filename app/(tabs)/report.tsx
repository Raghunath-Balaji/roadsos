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
 * Report Screen (Corporate Dark Aesthetic)
 * Allows users to report emergencies on behalf of others.
 * Strictly uses hex colors to match the dashboard.
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
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        throw new Error("Location access is required to send emergency services.");
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const uploadRes = await uploadAlertImage(imageUri, "bystander", user.uid);
      if (!uploadRes.success) throw new Error(uploadRes.error);

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
            setPatientName('');
            setSeverity('medium');
            setDetails('');
            setImageUri(null);
            router.replace('/(tabs)/sos');
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
      className={`flex-1 py-3 rounded-xl items-center border-2 ${severity === level ? 'border-brand-vivid bg-brand-card' : 'border-brand-border bg-brand-dark'}`}
    >
      <View className={`w-3 h-3 rounded-full mb-1`} style={{ backgroundColor: color }} />
      <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className={`text-[10px] uppercase ${severity === level ? 'text-brand-accent' : 'text-brand-muted'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 120 }}>
        <View style={{ marginBottom: 80 }} className="px-1">
          <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-5xl text-white tracking-tighter">Public Eye</Text>
        </View>

        <View>
          {/* Patient Name */}
          <View style={{ marginBottom: 60 }}>
            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[2px] mb-6 ml-1">Patient Identity</Text>
            <TextInput
              style={{ fontFamily: 'IBMPlexSans_500Medium', color: '#ffffff' }}
              className="bg-brand-card border border-brand-border rounded-[20px] p-6"
              placeholder="Full Name (Optional)"
              placeholderTextColor="#444444"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          {/* Severity */}
          <View style={{ marginBottom: 60 }}>
            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[2px] mb-6 ml-1">Emergency Severity</Text>
            <View className="flex-row gap-4">
              <SeverityButton level="low" label="Low" color="#10b981" />
              <SeverityButton level="medium" label="Medium" color="#f59e0b" />
              <SeverityButton level="high" label="High" color="#ef4444" />
            </View>
          </View>

          {/* Photo Capture */}
          <View style={{ marginBottom: 60 }}>
            <View className="flex-row items-center mb-6 ml-1">
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[2px]">Visual Evidence</Text>
              <Text className="text-brand-vivid ml-1 text-xs">*</Text>
            </View>
            <TouchableOpacity 
              onPress={takePhoto}
              className={`w-full aspect-[4/3] rounded-[40px] border-2 border-dashed items-center justify-center overflow-hidden ${imageUri ? 'border-brand-vivid' : 'border-brand-border bg-brand-card'}`}
            >
              {imageUri ? (
                <View className="w-full h-full">
                  <Image source={{ uri: imageUri }} className="w-full h-full" />
                  <View className="absolute bottom-6 right-6 bg-brand-vivid w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black">
                    <Ionicons name="camera" size={28} color="black" />
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Ionicons name="camera-outline" size={56} color="#222222" />
                  <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-widest mt-4">Tap to Capture Incident</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Additional Details */}
          <View style={{ marginBottom: 60 }}>
            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[2px] mb-6 ml-1">Incident Intelligence</Text>
            <TextInput
              style={{ fontFamily: 'IBMPlexSans_500Medium', color: '#ffffff' }}
              className="bg-brand-card border border-brand-border rounded-[20px] p-6 min-h-[160px]"
              placeholder="Describe situation, injuries, or precise location..."
              placeholderTextColor="#444444"
              multiline
              textAlignVertical="top"
              value={details}
              onChangeText={setDetails}
            />
          </View>

          {/* Search Radius */}
          <View style={{ marginBottom: 80 }}>
            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[2px] mb-6 ml-1">Response Radius</Text>
            <View className="flex-row gap-4">
              {[5, 10, 20].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setSearchRadius(r)}
                  className={`flex-1 py-4 rounded-xl items-center border ${searchRadius === r ? 'bg-brand-accent border-brand-accent' : 'bg-brand-card border-brand-border'}`}
                >
                  <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className={`text-sm ${searchRadius === r ? 'text-black' : 'text-brand-muted'}`}>{r}KM</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`py-6 rounded-[40px] items-center shadow-2xl ${submitting || !imageUri ? 'bg-brand-border opacity-50' : 'bg-brand-vivid'}`}
          >
            {submitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-slate-200 text-sm uppercase tracking-[4px]">Broadcast Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="h-32" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
