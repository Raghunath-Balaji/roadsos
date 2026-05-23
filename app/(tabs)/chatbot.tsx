import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';
import { initLlama } from 'llama.rn';
import { LlamaContext } from 'llama.rn';
import { ChatMessage, getUserMedicalInfo } from '../../services/chatservice';
import { File, Paths } from 'expo-file-system';
import { ensureModel } from '../../services/modelmanager';

const Chatbot = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [medicalInfo, setMedicalInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<LlamaContext | null>(null);
    const [modelLoading, setModelLoading] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);


    useEffect(() => {
        setupAI();
    }, []);



    const setupAI = async () => {
        try {
            const info = await getUserMedicalInfo();
            setMedicalInfo(info);

            setMessages([{
                role: 'assistant',
                content: `Hello ${info?.name || 'there'}! Initializing offline AI...`
            }]);

            const modelPath = await ensureModel();

            const ctx = await initLlama({
                model: modelPath,
                is_model_asset: false,
                use_mlock: false,
                use_mmap: true,
                n_ctx: 512,
                n_threads: 2,
            });

            setContext(ctx);
            setModelLoading(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Local AI is ready! How can I help you?"
            }]);

        } catch (error) {
            console.error("Llama Init Error:", error);
            setModelLoading(false);
        }
    };

    const handleSend = async () => {
        if (inputText.trim() === '' || loading || !context) return;

        const userMessage: ChatMessage = { role: 'user', content: inputText };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInputText('');
        setLoading(true);

        try {
            // Construct prompt for local model
            const medicalHistoryString = medicalInfo
                ? `\nUser Medical History:\n- Allergens: ${medicalInfo.allergens}\n- Medications: ${medicalInfo.medications}\n- Blood Group: ${medicalInfo.bloodGroup}`
                : "\nUser Medical History: Not available.";

            // Format for Gemma-3 / It models
            let prompt = `<start_of_turn>system\nYou are a professional emergency first-aid assistant for RoadSOS. Provide concise, life-saving instructions. Use the user's medical history for safety.${medicalHistoryString}<end_of_turn>\n`;
            
            // Add conversation history (limited to last few for context window)
            const recentMessages = updatedMessages.slice(-5);
            recentMessages.forEach(msg => {
                prompt += `<start_of_turn>${msg.role}\n${msg.content}<end_of_turn>\n`;
            });
            prompt += `<start_of_turn>model\n`;

            const result = await context.completion({
                prompt: prompt,
                n_predict: 500,
                temperature: 0.7,
                stop: ['<end_of_turn>', 'user', 'system'],
            });

            const assistantResponse = result.text.trim();
            setMessages([...updatedMessages, { role: 'assistant', content: assistantResponse }]);
        } catch (error) {
            console.error("Inference Error:", error);
            Alert.alert("Error", "Local AI failed to generate a response.");
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View className={`mb-4 max-w-[85%] ${item.role === 'user' ? 'self-end' : 'self-start'}`}>
            <View className={`p-4 rounded-2xl ${
                item.role === 'user'
                    ? 'bg-red-600 rounded-tr-none'
                    : 'bg-gray-100 border border-gray-200 rounded-tl-none'
            }`}>
                <Text className={`${item.role === 'user' ? 'text-white font-medium' : 'text-gray-800'} text-base leading-6`}>
                    {item.content}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: 'white',
            }}
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={{ flex: 1, paddingHorizontal: 16 }}>
                    {/* Header */}
                    <View className="py-4 border-b border-gray-100 flex-row items-center">
                        <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="medical" size={20} color="#dc2626" />
                        </View>
                        <View>
                            <Text className="text-xl font-bold text-gray-900">Offline First Aid AI</Text>
                            <Text className="text-xs text-gray-500">{modelLoading ? 'Initializing model...' : 'Running Locally'}</Text>
                        </View>
                        {modelLoading && <ActivityIndicator size="small" color="#dc2626" className="ml-auto" />}
                    </View>

                    {/* Alert Message */}
                    <View className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex-row items-start">
                        <Ionicons name="warning" size={18} color="#dc2626" className="mr-2" />
                        <Text className="text-xs text-red-800 flex-1 ml-2">
                            <Text className="font-bold">Disclaimer:</Text> This is an OFFLINE AI. It provides guidance based on your profile. For severe emergencies, call 911 immediately.
                        </Text>
                    </View>

                    {/* Chat area */}

                    <ScrollView
                        ref={scrollViewRef}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingTop: 20,
                            paddingBottom: 120,
                        }}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((item, index) => (
                            <View key={index}>
                                {renderMessage({ item })}
                            </View>
                        ))}
                    </ScrollView>

                    {loading && (
                        <View className="flex-row items-center mb-6 ml-2">
                            <ActivityIndicator size="small" color="#dc2626" />
                            <Text className="ml-2 text-gray-400 text-sm italic">Local AI is thinking...</Text>
                        </View>
                    )}

                    {/* Input Area */}
                    <View className="pb-4 pt-2">
                        <View className="flex-row items-end bg-gray-50 rounded-3xl px-4 py-2 border border-gray-200">
                            <TextInput
                                className="flex-1 text-base text-gray-800 py-2 max-h-32"
                                placeholder={modelLoading ? "Loading model..." : "Describe the medical situation..."}
                                placeholderTextColor="#94a3b8"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline={false}
                                returnKeyType="send"
                                onSubmitEditing={handleSend}
                                editable={!modelLoading}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={loading || inputText.trim() === '' || modelLoading}
                                className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                                    (inputText.trim() === '' || modelLoading) ? 'bg-gray-200' : 'bg-red-600'
                                }`}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Chatbot;