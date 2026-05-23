import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView, Text, TouchableOpacity, View, Animated } from "react-native";
import "../globals.css";

/**
 * Modernized Landing Page for RoadSOS.
 * Features a connectivity status indicator and high-quality role-based navigation buttons.
 */
export default function App() {
    const [isOnline, setIsOnline] = useState(true);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    /**
     * Monitor connectivity and handle pulsating animation.
     */
    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Lightweight ping to verify internet access
                await fetch("https://8.8.8.8", { method: "HEAD", mode: "no-cors" });
                setIsOnline(true);
            } catch (e) {
                setIsOnline(false);
            }
        };

        const interval = setInterval(checkStatus, 5000);
        checkStatus();

        // Pulsating animation for the status dot
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { 
                    toValue: 1.2, 
                    duration: 1000, 
                    useNativeDriver: true 
                }),
                Animated.timing(pulseAnim, { 
                    toValue: 1, 
                    duration: 1000, 
                    useNativeDriver: true 
                }),
            ])
        ).start();

        return () => clearInterval(interval);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="flex-1 px-8 justify-center">
                
                {/* Connectivity Dot & Status */}
                <View className="absolute top-12 right-8 flex-row items-center bg-white/80 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">
                        {isOnline ? "System Online" : "System Offline"}
                    </Text>
                    <Animated.View 
                        style={{ transform: [{ scale: pulseAnim }] }}
                        className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'} shadow-lg`} 
                    />
                </View>

                {/* Hero / Branding Section */}
                <View className="items-center mb-16">
                    <View className="w-24 h-24 bg-blue-600 rounded-[35px] items-center justify-center mb-6 shadow-2xl shadow-blue-500/40">
                        <Ionicons name="shield-checkmark" size={48} color="white" />
                    </View>
                    <Text className="text-4xl font-black text-slate-900 tracking-tighter">RoadSOS</Text>
                    <View className="h-1 w-12 bg-blue-600 rounded-full my-3" />
                    <Text className="text-slate-500 text-center font-medium leading-5 px-4">
                        Universal emergency response and local first-aid intelligence.
                    </Text>
                </View>

                {/* Role-Based Action Buttons */}
                <View className="space-y-4">
                    
                    {/* Citizen Portal */}
                    <Link href="/(auth)/signIn" asChild>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            className="bg-blue-600 p-6 rounded-[32px] flex-row items-center shadow-xl shadow-blue-600/20"
                        >
                            <View className="bg-white/20 p-3 rounded-2xl mr-4">
                                <Ionicons name="person" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-bold">Citizen Portal</Text>
                                <Text className="text-blue-100 text-xs">I need emergency help</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="white" opacity={0.6} />
                        </TouchableOpacity>
                    </Link>

                    {/* Helper Portal */}
                    <Link href="/(auth)/helperSignIn" asChild>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            className="bg-emerald-600 p-6 rounded-[32px] flex-row items-center shadow-xl shadow-emerald-600/20"
                        >
                            <View className="bg-white/20 p-3 rounded-2xl mr-4">
                                <Ionicons name="medkit" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-bold">Responder Login</Text>
                                <Text className="text-emerald-100 text-xs">Active mission dashboard</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="white" opacity={0.6} />
                        </TouchableOpacity>
                    </Link>

                    {/* Admin Portal */}
                    <Link href="/(auth)/adminSignIn" asChild>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            className="bg-slate-900 p-6 rounded-[32px] flex-row items-center shadow-xl shadow-slate-900/20"
                        >
                            <View className="bg-white/10 p-3 rounded-2xl mr-4">
                                <Ionicons name="business" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-bold">Organization Admin</Text>
                                <Text className="text-slate-400 text-xs">Manage medical units</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="white" opacity={0.6} />
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Registration Link */}
                <View className="mt-12 items-center">
                    <Link href="/(auth)/adminSignUp">
                        <View className="flex-row items-center border-b border-slate-200 pb-1">
                            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px]">
                                Register New Organization
                            </Text>
                            <Ionicons name="add-circle-outline" size={14} color="#94a3b8" className="ml-2" />
                        </View>
                    </Link>
                </View>

            </View>
        </SafeAreaView>
    );
}
