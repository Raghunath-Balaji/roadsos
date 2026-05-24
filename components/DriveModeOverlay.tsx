import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DriveModeOverlayProps {
  onExit: () => void;
}

/**
 * Monochrome Corporate DriveMode Overlay
 * Matches the Dashboard aesthetic with Orange/Black/White.
 */
export default function DriveModeOverlay({ onExit }: DriveModeOverlayProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Intercept back button on Android
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} className="z-[1000] bg-[#111111]">
        <View style={{ paddingTop: insets.top + 60 }} className="flex-1 items-center p-10">
          
          <View className="w-32 h-32 bg-brand-vivid rounded-[40px] items-center justify-center mb-10 shadow-lg shadow-brand-vivid">
            <Ionicons name="car-sport" size={60} color="white" />
          </View>
          
          <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-white text-5xl tracking-tighter text-center mb-4 uppercase italic">
            Drive Mode
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted text-lg text-center mb-16 leading-6 px-4">
            Safety protocol is active. System is monitoring for high-impact events.
          </Text>

          <View className="w-full">
            <View className="bg-brand-card p-6 rounded-[32px] border border-brand-vivid/20 mb-10">
              <View className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-green-500 text-[10px] uppercase tracking-[3px]">
                  Guardian Link Active
                </Text>
              </View>
              <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-accent text-sm leading-5">
                Place device in a stable holder. Avoid interaction while vehicle is in motion.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={onExit}
              activeOpacity={0.8}
              className="bg-brand-card py-6 rounded-[32px] border border-brand-border items-center flex-row justify-center shadow-2xl shadow-black"
            >
              <Ionicons name="lock-open-outline" size={24} color="#ee6c4d" />
              <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-white text-xl ml-4 tracking-tight">EXIT PROTOCOL</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-muted text-[10px] mt-auto uppercase tracking-[4px]">
            RoadSOS • Guardian Active
          </Text>
        </View>
    </View>
  );
}
