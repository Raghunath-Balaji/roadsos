
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Animated, Easing, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase';
import { createAlert, AlertSeverity, listenToMyAlert, ActiveAlert, markAsSaved, uploadAlertImage, updateAlertDetails } from '../../services/alertService';
import { Ionicons } from '@expo/vector-icons';
import SOSMap from '../../components/SOSMap';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
        <View className="bg-brand-vivid w-16 h-16 rounded-full items-center justify-center z-10 shadow-lg shadow-brand-vivid/50">
          <Ionicons name="radio" size={32} color="black" />
        </View>
      </View>
  );
};

export default function SosScreen() {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);

      if (granted) {
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } catch (e) {
          console.error("Location Fetch Error:", e);
        }
      }
    })();

    const user = auth.currentUser;
    if (user) {
      const unsubscribe = listenToMyAlert(user.uid, (alert) => {
        setActiveAlert(alert);
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
      Alert.alert("Permission Denied", "Location access is required for SOS.");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await createAlert(user.uid, severity, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error: any) {
      Alert.alert("Error", "SOS Broadcast Failed.");
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleUpdateDetails = async () => {
    if (!activeAlert) return;
    setUpdating(true);
    try {
      let imageUrl = activeAlert.imageUrl;
      if (imageUri && imageUri !== activeAlert.imageUrl) {
        const uploadRes = await uploadAlertImage(imageUri, activeAlert.id, activeAlert.userId);
        if (uploadRes.success) imageUrl = uploadRes.url;
      }
      await updateAlertDetails(activeAlert.id, activeAlert.userId, details, imageUrl);
      Alert.alert("Updated", "Responder intel synced.");
    } catch (error: any) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsSaved = async () => {
    if (!activeAlert) return;
    setLoading(true);
    try {
      await markAsSaved(activeAlert.id, activeAlert.userId);
    } catch (error) {
      Alert.alert("Error", "Resolution failed.");
    } finally {
      setLoading(false);
    }
  };

  if (locationPermission === false) {
    return (
        <View className="flex-1 justify-center items-center bg-black p-6">
          <Ionicons name="location-outline" size={64} color="#ee6c4d" />
          <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-xl text-white text-center mt-4 uppercase">No Surveillance Access</Text>
        </View>
    );
  }

  if (activeAlert) {
    const isPending = activeAlert.status === 'pending';
    const acceptedAt = activeAlert.acceptedAt ? activeAlert.acceptedAt.toDate().toLocaleTimeString() : null;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}>
            <View className="items-center mb-8">
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-2xl text-white mb-2 uppercase tracking-tighter">Tracking Protocol</Text>
              <View className={`px-4 py-1 rounded-lg border ${isPending ? 'border-brand-vivid bg-brand-vivid/10' : 'border-green-500 bg-green-500/10'}`}>
                <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className={`uppercase text-[10px] tracking-widest ${isPending ? 'text-brand-vivid' : 'text-green-500'}`}>{activeAlert.status}</Text>
              </View>
            </View>

            <View className="flex-1 justify-center mb-10">
              {isPending ? (
                  <View>
                    <RadarAnimation />
                    <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-center text-brand-muted text-sm uppercase tracking-widest mt-6">Awaiting Command...</Text>

                    {(!activeAlert.additionalDetails || !activeAlert.imageUrl) && (
                        <View className="mt-8 bg-brand-card p-6 rounded-[32px] border border-brand-border">
                          {!activeAlert.additionalDetails && (
                              <TextInput
                                  style={{ fontFamily: 'IBMPlexSans_500Medium', color: '#ffffff' }}
                                  className="bg-black border border-brand-border rounded-2xl p-5 mb-5 min-h-[100px]"
                                  placeholder="Describe incident situation..."
                                  placeholderTextColor="#444444"
                                  multiline
                                  value={details}
                                  onChangeText={setDetails}
                              />
                          )}

                          {!activeAlert.imageUrl && (
                              <TouchableOpacity
                                  onPress={takePhoto}
                                  className="bg-black border border-dashed border-brand-border rounded-2xl p-5 items-center mb-5"
                              >
                                {imageUri ? (
                                    <View className="items-center">
                                      <Image source={{ uri: imageUri }} className="w-24 h-24 rounded-xl mb-2" />
                                      <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-vivid text-[10px] uppercase">Retake Incident Photo</Text>
                                    </View>
                                ) : (
                                    <View className="items-center">
                                      <Ionicons name="camera-outline" size={32} color="#777777" />
                                      <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase mt-2">Capture Visual Evidence</Text>
                                    </View>
                                )}
                              </TouchableOpacity>
                          )}

                          <TouchableOpacity
                              onPress={handleUpdateDetails}
                              disabled={updating}
                              className="bg-brand-vivid py-4 rounded-2xl items-center shadow-lg shadow-brand-vivid/20"
                          >
                            {updating ? <ActivityIndicator color="black" /> : <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-black uppercase tracking-widest">Dispatch Intel</Text>}
                          </TouchableOpacity>
                        </View>
                    )}
                  </View>
              ) : (
                  <View className="bg-brand-card p-8 rounded-[40px] border border-brand-border items-center">
                    <View className="w-24 h-24 bg-green-500/10 rounded-full items-center justify-center mb-6 border border-green-500/30">
                      <Ionicons name="shield-checkmark" size={48} color="#22c55e" />
                    </View>

                    <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-2xl text-white mb-8 uppercase tracking-tighter">Response Deployed</Text>

                    <View className="w-full space-y-4">
                      <View className="bg-black/40 p-5 rounded-[24px] border border-brand-border">
                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[3px] mb-2">Hospital Command</Text>
                        <Text style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} className="text-brand-accent text-lg uppercase tracking-tight">{activeAlert.hospitalName || 'UNITS DISPATCHED'}</Text>
                      </View>

                      <View className="bg-black/40 p-5 rounded-[24px] border border-brand-border">
                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[3px] mb-2">Lead Responder</Text>
                        <Text style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} className="text-brand-accent text-lg uppercase tracking-tight">{activeAlert.doctorName || 'SEARCHING...'}</Text>
                      </View>
                    </View>

                    <View className="w-full mt-10 bg-green-500/5 p-4 rounded-2xl border border-green-500/20">
                      <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-green-500 text-[10px] text-center uppercase tracking-widest italic">Encrypted Link Established • Constant Surveillance</Text>
                    </View>
                  </View>
              )}
            </View>

            <TouchableOpacity onPress={handleMarkAsSaved} className="bg-brand-card py-6 rounded-[32px] items-center border border-brand-border">
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-green-500 uppercase tracking-[4px]">Abort / Mark Safe</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
    );
  }

  return (
      <View className="flex-1 bg-black">
        <View style={{ height: SCREEN_HEIGHT * 0.58 }} className="w-full relative">
          {currentLocation ? (
              <SOSMap latitude={currentLocation.latitude} longitude={currentLocation.longitude} />
          ) : (
              <View className="flex-1 items-center justify-center bg-brand-dark">
                <ActivityIndicator size="small" color="#ee6c4d" />
                <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted text-[10px] uppercase tracking-[4px] mt-4">Syncing Map Node...</Text>
              </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)', 'black']} className="absolute bottom-0 left-0 right-0 h-40" />
        </View>

        <View className="flex-1 px-8 justify-center pb-10">
          <View className="flex-row justify-between items-center mb-10 px-1">
            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] uppercase tracking-[4px]">Deployment Sector</Text>
            <View className="w-2 h-2 rounded-full bg-brand-vivid shadow shadow-brand-vivid" />
          </View>

          <View className="flex-row gap-6">
            <TouchableOpacity
                onPress={() => handleSosPress('high')}
                disabled={loading}
                activeOpacity={0.8}
                className="flex-1 aspect-square bg-[#ef4444] rounded-[48px] items-center justify-center shadow-2xl shadow-red-950"
            >
              <Ionicons name="flame" size={48} color="white" />
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-white text-base mt-3 uppercase tracking-tighter">High</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handleSosPress('medium')}
                disabled={loading}
                activeOpacity={0.8}
                className="flex-1 aspect-square bg-[#f59e0b] rounded-[48px] items-center justify-center shadow-2xl shadow-amber-950"
            >
              <Ionicons name="warning" size={48} color="white" />
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-white text-base mt-3 uppercase tracking-tighter">Medium</Text>
            </TouchableOpacity>
          </View>

          {/*<TouchableOpacity onPress={() => handleSosPress('low')} disabled={loading} className="mt-12 items-center">*/}
          {/*  <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[11px] uppercase tracking-[5px] opacity-60 italic">Low Severity Protocol</Text>*/}
          {/*</TouchableOpacity>*/}
        </View>

        {loading && (
            <View className="absolute inset-0 bg-black/70 flex-1 justify-center items-center z-[2000]">
              <ActivityIndicator size="large" color="#ee6c4d" />
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="mt-4 text-white uppercase tracking-[4px]">Transmitting...</Text>
            </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  radarCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(238, 108, 77, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(238, 108, 77, 0.4)',
  }
});
