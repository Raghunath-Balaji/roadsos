import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { createAlert } from '../services/alertService';
import { auth } from '../config/firebase';
import * as Location from 'expo-location';

/**
 * CrashAlarm Screen
 * High-urgency screen triggered when a crash is detected.
 * Includes a loud siren, haptics, and a 30-second automatic SOS trigger.
 */
export default function CrashAlarm() {
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const soundRef = useRef<Audio.Sound | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setupAlarm();
    startCountdown();
    startFlashing();

    return () => {
      cleanup();
    };
  }, []);

  const setupAlarm = async () => {
    try {
      // Load and play siren sound
      const { sound } = await Audio.Sound.createAsync(
        require('./emergency-siren.mp3'),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      
      // Start continuous haptics
      const hapticInterval = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 1000);
      
      // Store interval to clear later
      (global as any).hapticInterval = hapticInterval;
    } catch (error) {
      console.error("Failed to setup alarm audio/haptics:", error);
    }
  };

  const startCountdown = () => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startFlashing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const cleanup = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if ((global as any).hapticInterval) clearInterval((global as any).hapticInterval);
  };

  const triggerSOS = async () => {
    await cleanup();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const location = await Location.getCurrentPositionAsync({});
      
      // Trigger high-severity alert
      await createAlert(user.uid, 'high', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Navigate to SOS tracking screen
      router.replace('/(tabs)/sos');
    } catch (error) {
      console.error("Auto SOS Trigger Failed:", error);
      router.replace('/(tabs)/sos');
    }
  };

  const handleImOk = async () => {
    await cleanup();
    router.replace('/(tabs)/dashboard');
  };

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1e293b', '#ef4444'], // Dark slate to Red
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} className="flex-1 p-8 justify-center items-center">
      <View className="items-center mb-12">
        <View className="bg-white/20 p-8 rounded-full mb-6">
          <Ionicons name="warning" size={100} color="white" />
        </View>
        <Text className="text-white text-5xl font-black text-center mb-4 uppercase">
          Crash Detected!
        </Text>
        <Text className="text-white/80 text-xl text-center font-bold px-4">
          Are you okay? We are about to call for emergency help.
        </Text>
      </View>

      <View className="items-center mb-16">
        <Text className="text-white/60 text-sm font-bold tracking-widest uppercase mb-2">
          Automatic SOS in
        </Text>
        <Text className="text-white text-9xl font-black italic">
          {countdown}
        </Text>
      </View>

      <TouchableOpacity 
        onPress={handleImOk}
        activeOpacity={0.8}
        className="bg-white w-full py-6 rounded-3xl shadow-2xl items-center mb-6"
      >
        <Text className="text-red-600 text-2xl font-black uppercase tracking-tighter">
          I AM OKAY
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={triggerSOS}
        className="py-4"
      >
        <Text className="text-white/60 text-lg font-bold underline">
          Send Help Now
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
