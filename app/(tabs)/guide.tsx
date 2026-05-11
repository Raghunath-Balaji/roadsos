
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIRST_AID_DATA, FirstAidGuide } from '@/resources/firstAidData';

export default function GuideScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);

    const filteredGuides = FIRST_AID_DATA.filter(
        (guide) =>
            guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-slate-50">
            <View className="px-6 pt-10 pb-4">
                <Text className="text-3xl font-bold text-slate-900">First Aid Guide</Text>
                <Text className="text-slate-500 mt-1">Offline assistance for emergencies</Text>
            </View>

            <View className="px-6 mb-4">
                <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-2 text-slate-900 py-2"
                        placeholder="Search for accident or symptom..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredGuides}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100"
                        onPress={() => setSelectedGuide(item)}
                    >
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                {item.category}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 mb-2">{item.title}</Text>
                        <Text className="text-slate-500 leading-5" numberOfLines={2}>
                            {item.description}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center mt-10">
                        <Ionicons name="search-outline" size={60} color="#cbd5e1" />
                        <Text className="text-slate-400 mt-4 text-lg">No guides found for "{searchQuery}"</Text>
                    </View>
                }
            />

            <Modal
                visible={selectedGuide !== null}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSelectedGuide(null)}
            >
                <SafeAreaView style={{ flex: 1 }} className="bg-white">
                    <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-100">
                        <TouchableOpacity onPress={() => setSelectedGuide(null)}>
                            <Ionicons name="close" size={28} color="#1e293b" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-slate-900">Step-by-Step Guide</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
                    >
                        <View className="mb-8">
                            <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                {selectedGuide?.category}
                            </Text>
                            <Text className="text-3xl font-bold text-slate-900 mb-4">{selectedGuide?.title}</Text>
                            <View className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <Text className="text-blue-800 leading-6 font-medium">
                                    {selectedGuide?.description}
                                </Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-slate-900 mb-6">Instructions</Text>
                            {selectedGuide?.steps.map((step, index) => (
                                <View key={index} className="flex-row mb-6">
                                    <View className="bg-slate-900 w-8 h-8 rounded-full items-center justify-center mr-4">
                                        <Text className="text-white font-bold">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-slate-900 mb-1">{step.title}</Text>
                                        <Text className="text-slate-600 leading-6">{step.instruction}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View className="mt-10 mb-10 p-6 bg-red-50 rounded-2xl border border-red-100 items-center">
                            <Ionicons name="alert-circle" size={40} color="#ef4444" />
                            <Text className="text-red-800 font-bold text-lg mt-2 text-center">
                                Still need professional help?
                            </Text>
                            <Text className="text-red-700 text-center mt-1 mb-4">
                                If the situation worsens, use the SOS button to alert emergency services.
                            </Text>
                            <TouchableOpacity
                                className="bg-red-500 px-8 py-3 rounded-full"
                                onPress={() => setSelectedGuide(null)}
                            >
                                <Text className="text-white font-bold">Close and Return</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}