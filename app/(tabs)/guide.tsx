import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FIRST_AID_DATA, FirstAidGuide } from '@/resources/firstAidData';

/**
 * First Aid Guide Screen (Corporate Dark Aesthetic)
 * Offline assistance with high-contrast monochrome/orange theme.
 */
export default function GuideScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);

    const filteredGuides = FIRST_AID_DATA.filter(
        (guide) =>
            guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View className="px-8 pt-12 pb-6">
                <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-3xl text-white uppercase tracking-tighter">First Aid Guide</Text>
                <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted mt-1 uppercase text-[11px] tracking-tight">Offline Resource • Emergency Intelligence</Text>
            </View>

            <View className="px-8 mb-6">
                <View className="flex-row items-center bg-brand-card rounded-2xl px-5 py-3 border border-brand-border shadow-2xl shadow-black">
                    <Ionicons name="search" size={20} color="#777777" />
                    <TextInput
                        style={{ fontFamily: 'IBMPlexSans_500Medium', color: '#ffffff' }}
                        className="flex-1 ml-3 py-2"
                        placeholder="Search situation or injury..."
                        placeholderTextColor="#444444"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#777777" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredGuides}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-brand-card rounded-[28px] p-6 mb-5 border border-brand-border shadow-lg shadow-black"
                        onPress={() => setSelectedGuide(item)}
                    >
                        <View className="flex-row justify-between items-center mb-3">
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-[10px] text-brand-vivid uppercase tracking-[2px]">
                                {item.category}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#222222" />
                        </View>
                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-xl text-brand-accent mb-2">{item.title}</Text>
                        <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted leading-5 text-sm" numberOfLines={2}>
                            {item.description}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center mt-12 opacity-50">
                        <Ionicons name="search-outline" size={60} color="#777777" />
                        <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted mt-4 text-base italic uppercase tracking-widest text-center">No Data in Registry for "{searchQuery}"</Text>
                    </View>
                }
            />

            <Modal
                visible={selectedGuide !== null}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSelectedGuide(null)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
                    <View className="flex-row justify-between items-center px-8 py-6 border-b border-brand-border">
                        <TouchableOpacity onPress={() => setSelectedGuide(null)}>
                            <Ionicons name="close" size={28} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-sm uppercase text-brand-accent tracking-[2px]">Step-by-Step Guide</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="mb-10">
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-[10px] text-brand-vivid uppercase tracking-[3px] mb-3">
                                {selectedGuide?.category}
                            </Text>
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-3xl text-white mb-6 uppercase tracking-tighter">{selectedGuide?.title}</Text>
                            <View className="bg-brand-card p-6 rounded-[32px] border border-brand-border">
                                <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-accent leading-6 text-sm italic opacity-80">
                                    {selectedGuide?.description}
                                </Text>
                            </View>
                        </View>

                        <View>
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-xs text-brand-muted uppercase tracking-[4px] mb-8">Protocol Instructions</Text>
                            {selectedGuide?.steps.map((step, index) => (
                                <View key={index} className="flex-row mb-10">
                                    <View className="bg-brand-vivid w-8 h-8 rounded-full items-center justify-center mr-5 border border-brand-vivid shadow-lg shadow-brand-vivid/20">
                                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-black text-xs">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-lg text-brand-accent mb-2 uppercase tracking-tight">{step.title}</Text>
                                        <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted leading-6 text-[15px]">{step.instruction}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View className="mt-6 mb-12 p-8 bg-brand-card rounded-[40px] border border-brand-border items-center">
                            <Ionicons name="alert-circle" size={40} color="#ee6c4d" />
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-accent text-lg mt-4 text-center uppercase tracking-tighter">
                                Critical Assistance Required?
                            </Text>
                            <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-brand-muted text-center mt-2 mb-8 text-xs uppercase tracking-tight opacity-70">
                                If the situation escalates, deploy the primary SOS protocol immediately.
                            </Text>
                            <TouchableOpacity
                                className="bg-brand-vivid px-10 py-4 rounded-2xl shadow-lg shadow-brand-vivid/20"
                                onPress={() => setSelectedGuide(null)}
                            >
                                <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-black uppercase text-xs tracking-[2px]">Return to Console</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
