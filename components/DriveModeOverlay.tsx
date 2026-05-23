import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface DriveModeOverlayProps {
  onExit: () => void;
}

/**
 * DriveModeOverlay Component
 * Provides a "soft lock" UI to prevent accidental app navigation or closure
 * while driving.
 */
export default function DriveModeOverlay({ onExit }: DriveModeOverlayProps) {
  useEffect(() => {
    // Intercept back button on Android
    const backAction = () => {
      // Prevent going back
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} className="z-[1000]">
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
        <View className="flex-1 justify-center items-center p-8">
          <View className="bg-blue-600/20 p-8 rounded-full mb-8">
            <Ionicons name="car-sport" size={80} color="#3b82f6" />
          </View>
          
          <Text className="text-white text-4xl font-black text-center mb-2">
            DRIVE MODE
          </Text>
          <Text className="text-blue-200 text-lg text-center mb-12 font-medium">
            Crash detection is active. We are monitoring your journey for sudden impacts.
          </Text>

          <View className="w-full space-y-6">
            <View className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <View className="flex-row items-center mb-4">
                <View className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-3" />
                <Text className="text-green-400 font-bold tracking-widest text-xs uppercase">
                  Sensors Online
                </Text>
              </View>
              <Text className="text-slate-300 text-sm leading-5">
                Keep your phone stable in a holder for best accuracy. Do not use your phone while driving.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={onExit}
              activeOpacity={0.7}
              className="bg-white/10 py-6 rounded-3xl border border-white/20 items-center flex-row justify-center"
            >
              <Ionicons name="lock-open-outline" size={24} color="white" />
              <Text className="text-white text-xl font-bold ml-3">Exit Drive Mode</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white/40 text-xs mt-auto font-bold tracking-tighter uppercase">
            RoadSOS • Guardian Protocol Active
          </Text>
        </View>
      </BlurView>
    </View>
  );
}
