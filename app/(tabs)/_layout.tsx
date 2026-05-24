import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Bottom Tab Navigator for the Citizen experience.
 * Configures the navigation bar and sets the SOS screen as the default.
 */
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#777777',
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#111111',
                    borderTopWidth: 1,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                },
            }}
        >
            {/* SOS Tab - Default Route */}
            <Tabs.Screen
                name="sos"
                options={{
                    title: 'SOS',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="alert-circle" size={size + 4} color="#ef4444" />
                    ),
                    tabBarLabelStyle: {
                        color: '#ef4444',
                        fontWeight: 'bold',
                    },
                }}
            />

            {/* Report Tab */}
            <Tabs.Screen
                name="report"
                options={{
                    title: 'Report',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="clipboard-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Guide Tab */}
            <Tabs.Screen
                name="guide"
                options={{
                    title: 'Guide',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medkit-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Chatbot Tab */}
            <Tabs.Screen
                name="chatbot"
                options={{
                    title: 'First Aid AI',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Dashboard Tab */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}