import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Animated, Easing, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase';
import { createAlert, AlertSeverity, listenToMyAlert, ActiveAlert, markAsSaved, uploadAlertImage, updateAlertDetails } from '../../services/alertService';
import { Ionicons } from '@expo/vector-icons';

/**
 * Radar Animation Component
 */
const RadarAnimation = () => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      scaleValue.setValue(0);
      opacityValue.setValue(1);
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 4,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <View className="items-center justify-center h-48">
      <Animated.View
        style={[
          styles.radarCircle,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      />
      <View className="bg-red-500 w-16 h-16 rounded-full items-center justify-center z-10 shadow-lg shadow-red-500/50">
        <Ionicons name="radio" size={32} color="white" />
      </View>
    </View>
  );
};

export default function SosScreen() {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  
  // Optional details state
  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();

    const user = auth.currentUser;
    if (user) {
      const unsubscribe = listenToMyAlert(user.uid, (alert) => {
        setActiveAlert(alert);
        // Reset local form if no active alert or alert changed
        if (!alert) {
          setDetails('');
          setImageUri(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSosPress = async (severity: AlertSeverity) => {
    if (!locationPermission) {
      Alert.alert(
        "Permission Denied",
        "Location access is required to send an SOS alert. Please enable it in your settings."
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to send an alert.");
      return;
    }

    setLoading(true);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const result = await createAlert(user.uid, severity, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (!result.success) {
        Alert.alert("Error", "Failed to send alert: " + result.error);
      }
    } catch (error: any) {
      console.error("SOS Press Error:", error);
      Alert.alert("Error", "An unexpected error occurred while sending the alert.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdateDetails = async () => {
    if (!activeAlert) return;
    if (!details.trim() && !imageUri) {
      Alert.alert("No information", "Please add some text or a photo first.");
      return;
    }

    setUpdating(true);
    try {
      let imageUrl = activeAlert.imageUrl;
      
      if (imageUri && imageUri !== activeAlert.imageUrl) {
        const uploadRes = await uploadAlertImage(imageUri, activeAlert.id, activeAlert.userId);
        if (uploadRes.success) {
          imageUrl = uploadRes.url;
        } else {
          throw new Error(uploadRes.error);
        }
      }

      const updateRes = await updateAlertDetails(activeAlert.id, activeAlert.userId, details, imageUrl);
      if (updateRes.success) {
        Alert.alert("Updated", "Additional details sent to responders.");
      }
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsSaved = async () => {
    if (!activeAlert) return;
    
    setLoading(true);
    try {
      const result = await markAsSaved(activeAlert.id, activeAlert.userId);
      if (result.success) {
        Alert.alert("Glad you're safe!", "The emergency request has been cleared.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resolve alert.");
    } finally {
      setLoading(false);
    }
  };

  if (locationPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Ionicons name="location-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-slate-800 text-center mt-4">Location Access Required</Text>
        <Text className="text-slate-500 text-center mt-2">
          We need your location to send emergency services to your exact position.
        </Text>
      </View>
    );
  }

  // Tracking UI (Active Alert exists)
  if (activeAlert) {
    const isPending = activeAlert.status === 'pending';
    const createdAt = activeAlert.timestamp ? activeAlert.timestamp.toDate().toLocaleTimeString() : 'Processing...';
    const acceptedAt = activeAlert.acceptedAt ? activeAlert.acceptedAt.toDate().toLocaleTimeString() : null;

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View className="mt-8 items-center">
            <Text className="text-2xl font-bold text-slate-900 mb-2">Emergency Tracking</Text>
            <View className={`px-4 py-1 rounded-full ${isPending ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <Text className={`font-bold uppercase text-xs ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                Status: {activeAlert.status}
              </Text>
            </View>
          </View>

          <View className="flex-1 justify-center py-6">
            {isPending ? (
              <View>
                <RadarAnimation />
                <Text className="text-center text-slate-600 font-medium mt-4 mb-8">
                  Waiting for emergency service to accept...
                </Text>

                {/* Additional Details Form */}
                {(!activeAlert.additionalDetails || !activeAlert.imageUrl) && (
                  <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <Text className="text-slate-900 font-bold mb-4">Provide more details (Optional)</Text>
                    
                    {!activeAlert.additionalDetails && (
                      <TextInput
                        className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 mb-4 min-h-[80px]"
                        placeholder="Describe the situation or symptoms..."
                        multiline
                        value={details}
                        onChangeText={setDetails}
                      />
                    )}

                    {!activeAlert.imageUrl && (
                      <TouchableOpacity 
                        onPress={pickImage}
                        className="bg-white border border-dashed border-slate-300 rounded-xl p-4 items-center mb-4"
                      >
                        {imageUri ? (
                          <View className="items-center">
                            <Image source={{ uri: imageUri }} className="w-20 h-20 rounded-lg mb-2" />
                            <Text className="text-blue-600 font-medium text-xs">Change Photo</Text>
                          </View>
                        ) : (
                          <View className="items-center">
                            <Ionicons name="camera" size={24} color="#94a3b8" />
                            <Text className="text-slate-400 font-medium text-xs mt-1">Add Photo</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                      onPress={handleUpdateDetails}
                      disabled={updating}
                      className="bg-blue-600 py-3 rounded-xl items-center"
                    >
                      {updating ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-bold">Update Alert</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Show sent info if exists */}
                {(activeAlert.additionalDetails || activeAlert.imageUrl) && (
                  <View className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Attached Info</Text>
                    {activeAlert.additionalDetails && (
                      <Text className="text-slate-700 leading-5 mb-3">{activeAlert.additionalDetails}</Text>
                    )}
                    {activeAlert.imageUrl && (
                      <Image source={{ uri: activeAlert.imageUrl }} className="w-full h-40 rounded-xl" />
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 items-center">
                <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
                  <Ionicons name="shield-checkmark" size={40} color="#10b981" />
                </View>
                <Text className="text-2xl font-bold text-slate-900 text-center mb-2">Help is on the way!</Text>
                <Text className="text-slate-500 text-center mb-8">
                  {activeAlert.doctorName} from {activeAlert.hospitalName} has accepted your request.
                </Text>
                
                <View className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 font-bold text-xs uppercase">Created At</Text>
                    <Text className="text-slate-900 font-bold">{createdAt}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 font-bold text-xs uppercase">Accepted At</Text>
                    <Text className="text-slate-900 font-bold">{acceptedAt}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View className="pb-6">
            <View className="bg-slate-50 p-4 rounded-2xl mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500">Created At:</Text>
                <Text className="text-slate-900 font-semibold">{createdAt}</Text>
              </View>
              {acceptedAt && (
                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Accepted At:</Text>
                  <Text className="text-slate-900 font-semibold">{acceptedAt}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleMarkAsSaved}
              className="bg-slate-900 py-5 rounded-3xl items-center shadow-lg shadow-slate-200"
            >
              <Text className="text-white font-bold text-lg uppercase tracking-wider">Mark as Saved!</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Default SOS Screen
  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <View className="items-center mb-12">
        <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="megaphone" size={40} color="#ef4444" />
        </View>
        <Text className="text-3xl font-bold text-slate-800">Emergency SOS</Text>
        <Text className="text-slate-500 text-center mt-2">
          Select the severity of your emergency to notify nearby responders.
        </Text>
      </View>

      <View className="space-y-4">
        <TouchableOpacity
          onPress={() => handleSosPress('high')}
          disabled={loading}
          className="bg-red-600 p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-red-200"
          style={styles.buttonShadow}
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-3 rounded-2xl mr-4">
              <Ionicons name="flame" size={32} color="white" />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">High Severity</Text>
              <Text className="text-red-100 text-sm">Life-threatening / Critical</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSosPress('medium')}
          disabled={loading}
          className="bg-amber-500 p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-amber-200"
          style={styles.buttonShadow}
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-3 rounded-2xl mr-4">
              <Ionicons name="warning" size={32} color="white" />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">Medium Severity</Text>
              <Text className="text-amber-500 text-sm" style={{ color: '#fffbeb' }}>Urgent / Non-Critical</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSosPress('low')}
          disabled={loading}
          className="bg-emerald-500 p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-emerald-200"
          style={styles.buttonShadow}
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-3 rounded-2xl mr-4">
              <Ionicons name="shield-checkmark" size={32} color="white" />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">Low Severity</Text>
              <Text className="text-emerald-100 text-sm">Minor Incident / Precautionary</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View className="absolute inset-0 bg-white/60 flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="mt-4 text-slate-800 font-bold">Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  radarCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  }
});
