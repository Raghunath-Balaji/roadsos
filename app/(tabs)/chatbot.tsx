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
import { ensureModel } from '../../services/modelmanager';
import { readLocalUserContext } from '../../services/ragservice';
import { auth } from '../../config/firebase';

const Chatbot = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [medicalInfo, setMedicalInfo] = useState<any>(null);
    const [localContext, setLocalContext] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<LlamaContext | null>(null);
    const [modelLoading, setModelLoading] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);


    useEffect(() => {
        setupAI();
    }, []);

    const setupAI = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const info = await getUserMedicalInfo();
            setMedicalInfo(info);
            console.log("[RAG-Debug] Medical Info Loaded:", !!info, info);

            // Fetch local RAG context
            const cachedContext = await readLocalUserContext(user.uid);
            console.log("[RAG-Debug] Local Context Loaded:", !!cachedContext);
            if (cachedContext) {
                setLocalContext(cachedContext);
            }

            setMessages([{
                role: 'assistant',
                content: `Guardian AI initializing for ${info?.name || 'Authorized User'}. Link established.`
            }]);

            const modelPath = await ensureModel();

            const ctx = await initLlama({
                model: modelPath,
                is_model_asset: false,
                use_mlock: false,
                use_mmap: true,
                n_ctx: 2048,
                n_threads: 4,
            });

            setContext(ctx);
            setModelLoading(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Local Intelligence Active. How can I assist you today?"
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

            const additionalContext = localContext 
                ? `\nAdditional Context from Vault:\n${localContext}`
                : "";

            // Format for Gemma-3 / It models
            let prompt = `<start_of_turn>system\nYou are a professional emergency first-aid assistant for RoadSOS. Provide concise, life-saving instructions. Use the user's medical history and vault context for safety.${medicalHistoryString}${additionalContext}<end_of_turn>\n`;

            // Add conversation history (limited to last few for context window)
            const recentMessages = updatedMessages.slice(-5);
            recentMessages.forEach(msg => {
                prompt += `<start_of_turn>${msg.role}\n${msg.content}<end_of_turn>\n`;
            });
            prompt += `<start_of_turn>model\n`;
            console.log("[RAG-Debug] Final Prompt Configuration:", prompt);

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
                    ? 'bg-brand-card border border-brand-border'
                    : 'bg-brand-vivid'
            }`}>
                <Text className={`${item.role === 'user' ? 'text-white' : 'text-black'} text-base leading-6`}>
                    {item.content}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: '#000000',
            }}
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 50}}>
                    {/* Header */}
                    <View className="py-4 border-b border-brand-border flex-row items-center">
                        <View className="w-10 h-10 bg-brand-card rounded-full items-center justify-center mr-3 border border-brand-border">
                            <Ionicons name="medical" size={20} color="#ee6c4d" />
                        </View>
                        <View>
                            <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-xl text-brand-accent uppercase tracking-tighter">First Aid AI</Text>
                            <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-[10px] text-brand-muted uppercase tracking-widest">{modelLoading ? 'Initializing Node' : 'Active Link'}</Text>
                        </View>
                        {modelLoading && <ActivityIndicator size="small" color="#ee6c4d" className="ml-auto" />}
                    </View>

                    {/* Alert Message */}
                    <View className="mt-4 p-3 bg-brand-card rounded-xl border border-brand-border flex-row items-start">
                        <Ionicons name="warning" size={18} color="#ee6c4d" className="mr-2" />
                        <Text style={{ fontFamily: 'IBMPlexSans_500Medium' }} className="text-xs text-brand-muted flex-1 ml-2 uppercase tracking-tight">
                            Protocol: Advisories are supplemental. Deploy primary EMS if necessary.
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
                        showsVerticalScrollIndicator={false}
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
                            <ActivityIndicator size="small" color="#ee6c4d" />
                            <Text style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} className="ml-2 text-brand-muted text-[10px] uppercase tracking-widest">Processing Data...</Text>
                        </View>
                    )}

                    {/* Input Area */}
                    <View className="pb-4 pt-2">
                        <View className="flex-row items-end bg-brand-card rounded-3xl px-4 py-2 border border-brand-border">
                            <TextInput
                                style={{ fontFamily: 'IBMPlexSans_500Medium', color: '#ffffff' }}
                                className="flex-1 text-base py-2 max-h-32"
                                placeholder={modelLoading ? "Loading model..." : "Describe the medical situation..."}
                                placeholderTextColor="#444444"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline={true}
                                editable={!modelLoading}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={loading || inputText.trim() === '' || modelLoading}
                                className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                                    (inputText.trim() === '' || modelLoading) ? 'bg-brand-dark' : 'bg-brand-vivid'
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