import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Linking, Image, TextInput } from 'react-native';
import { auth, db, storage } from '../../config/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { logOut, UserProfile, MedicalDocument } from '../../services/authService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { startCrashDetection, stopCrashDetection } from '../../services/crashDetection';
import DriveModeOverlay from '../../components/DriveModeOverlay';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedicalDocument } from '../../services/documentService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Monochrome Corporate Dashboard (Stable Version)
 * Pure Black/Orange aesthetic with zero dynamic Tailwind opacities.
 */
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDriveModeActive, setIsDriveModeActive] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedAllergens, setEditedAllergens] = useState('');
  const [editedMedications, setEditedMedications] = useState('');

  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Profile Listener
    const profileRef = doc(db, "userDetails", user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setEditedAllergens(data.allergens || '');
        setEditedMedications(data.medications || '');
      }
      setLoading(false);
    }, (err) => {
      console.error("Profile sync error:", err);
      setLoading(false);
    });

    // 2. Alert History Listener
    const alertsRef = collection(db, "userDetails", user.uid, "Alerts");
    const q = query(alertsRef, orderBy("timestamp", "desc"), limit(5));
    const unsubAlerts = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Alerts sync error:", err);
    });

    return () => {
      unsubProfile();
      unsubAlerts();
      stopCrashDetection();
    };
  }, []);

  const toggleDriveMode = () => {
    if (!isDriveModeActive) {
      setIsDriveModeActive(true);
      startCrashDetection(() => {
        setIsDriveModeActive(false);
        stopCrashDetection();
        router.push('/crash-alarm');
      });
    } else {
      setIsDriveModeActive(false);
      stopCrashDetection();
    }
  };

  const handleUpdatePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) return;
      setUploadingPhoto(true);
      
      const user = auth.currentUser!;
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const photoRef = ref(storage, `profile_pictures/${user.uid}`);
      
      await uploadBytes(photoRef, blob);
      const url = await getDownloadURL(photoRef);
      
      await updateDoc(doc(db, "userDetails", user.uid), { photoURL: url });
      Alert.alert("Success", "Profile updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveMedicalInfo = async () => {
    try {
      const user = auth.currentUser!;
      await updateDoc(doc(db, "userDetails", user.uid), {
        allergens: editedAllergens,
        medications: editedMedications
      });
      setIsEditing(false);
      Alert.alert("Success", "Records saved.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      if (result.canceled) return;

      setUploadingDoc(true);
      const asset = result.assets[0];
      const res = await uploadMedicalDocument(auth.currentUser!.uid, asset.uri, asset.name, asset.mimeType || '');
      
      if (!res.success) throw new Error(res.error);
      Alert.alert("Success", "Added to vault.");
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-brand-dark">
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 40 }} className="px-8 pb-24">
          
          {/* Header: Identity */}
          <View className="flex-row items-center mb-16">
            <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.8} className="relative">
              {profile?.photoURL ? (
                <Image 
                  source={{ uri: profile.photoURL }} 
                  className="w-24 h-24 rounded-[32px] border-2 border-brand-border" 
                />
              ) : (
                <LinearGradient 
                  colors={['#111111', '#222222']} 
                  className="w-24 h-24 rounded-[32px] border-2 border-brand-border items-center justify-center"
                >
                  <Ionicons name="person-outline" size={40} color="#777777" />
                </LinearGradient>
              )}
              {uploadingPhoto && (
                <View className="absolute inset-0 bg-black/50 rounded-[32px] items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <View className="ml-6 flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text 
                  style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                  className="text-3xl text-brand-accent tracking-tighter"
                >
                  {profile?.name}
                </Text>
                <View className="px-3 py-1 bg-brand-card border border-brand-vivid rounded-lg">
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                    className="text-brand-vivid text-sm"
                  >
                    {profile?.bloodGroup || '--'}
                  </Text>
                </View>
              </View>
              <Text 
                style={{ fontFamily: 'IBMPlexSans_500Medium' }} 
                className="text-brand-muted text-base"
              >
                {profile?.email}
              </Text>
            </View>
          </View>

          {/* Operational Status: Drive Mode */}
          <View className="mb-12">
            <Text 
              style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
              className="text-[11px] text-brand-muted uppercase tracking-[4px] mb-5 px-1"
            >
              Operational Status
            </Text>
            <TouchableOpacity 
              onPress={toggleDriveMode}
              activeOpacity={0.9}
              className={`rounded-[28px] p-6 border ${isDriveModeActive ? 'bg-brand-vivid border-brand-vivid' : 'bg-brand-card border-brand-border'} flex-row items-center justify-between`}
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={24} color={isDriveModeActive ? 'white' : '#ee6c4d'} />
                <View className="ml-5">
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                    className={`text-base ${isDriveModeActive ? 'text-white' : 'text-brand-accent'}`}
                  >
                    DRIVE MODE
                  </Text>
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} 
                    className={`text-[10px] ${isDriveModeActive ? 'text-white' : 'text-brand-muted'} tracking-wider`}
                  >
                    {isDriveModeActive ? 'CRASH DETECTION ENABLED' : 'MONITORING STANDBY'}
                  </Text>
                </View>
              </View>
              <Ionicons name={isDriveModeActive ? 'radio-outline' : 'power-outline'} size={20} color={isDriveModeActive ? 'white' : '#777777'} />
            </TouchableOpacity>
          </View>

          {/* Registry: History */}
          <View className="mb-12">
            <Text 
              style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
              className="text-[11px] text-brand-muted uppercase tracking-[4px] mb-5 px-1"
            >
              Incident Registry
            </Text>
            <View className="bg-brand-card rounded-[28px] border border-brand-border overflow-hidden">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <View key={alert.id} className={`p-5 flex-row items-center justify-between ${idx !== alerts.length - 1 ? 'border-b border-brand-border' : ''}`}>
                    <View className="flex-row items-center">
                      <View className={`w-1.5 h-10 rounded-full ${alert.severity === 'high' ? 'bg-brand-vivid' : 'bg-brand-muted'} mr-5`} />
                      <View>
                        <Text 
                          style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                          className="text-brand-accent text-sm uppercase tracking-tight"
                        >
                          {alert.severity} SEVERITY
                        </Text>
                        <Text 
                          style={{ fontFamily: 'IBMPlexSans_500Medium' }} 
                          className="text-brand-muted text-[11px] mt-0.5"
                        >
                          {alert.timestamp?.seconds ? new Date(alert.timestamp.seconds * 1000).toLocaleDateString() : 'PROCESSING'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#333333" />
                  </View>
                ))
              ) : (
                <View className="p-10 items-center">
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_500Medium' }} 
                    className="text-brand-muted text-xs italic tracking-widest"
                  >
                    NO INCIDENTS RECORDED
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Secure Vault: Horizontal Scroll */}
          <View className="mb-12">
            <View className="flex-row items-center justify-between mb-5 px-1">
              <Text 
                style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                className="text-[11px] text-brand-muted uppercase tracking-[4px]"
              >
                Secure Vault
              </Text>
              <TouchableOpacity onPress={handleAddDocument} className="bg-brand-vivid/10 px-3 py-1.5 rounded-lg">
                <Text style={{ fontFamily: 'IBMPlexSans_700Bold' }} className="text-brand-vivid text-[10px] uppercase">Add Record</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                onPress={handleAddDocument}
                disabled={uploadingDoc}
                activeOpacity={0.8}
                className="w-36 h-36 bg-brand-card rounded-[40px] border-2 border-dashed border-brand-border items-center justify-center mr-5"
              >
                {uploadingDoc ? (
                  <ActivityIndicator size="small" color="#ee6c4d" />
                ) : (
                  <>
                    <Ionicons name="add" size={32} color="#ee6c4d" />
                    <Text 
                      style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                      className="text-brand-muted text-[10px] uppercase tracking-widest mt-1"
                    >
                      New File
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {profile?.documents?.map((doc) => (
                <TouchableOpacity 
                  key={doc.id}
                  onPress={() => Linking.openURL(doc.url)}
                  activeOpacity={0.8}
                  className="w-36 h-36 bg-brand-card rounded-[40px] border border-brand-border p-5 items-center justify-center mr-5"
                >
                  <View className="bg-brand-dark w-14 h-14 rounded-2xl items-center justify-center mb-3">
                    <Ionicons 
                      name={doc.type.includes('pdf') ? 'document-text-outline' : 'image-outline'} 
                      size={28} 
                      color="#ffffff" 
                    />
                  </View>
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} 
                    className="text-brand-accent text-[11px] text-center" 
                    numberOfLines={2}
                  >
                    {doc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Medical Records: Editable */}
          <View className="mb-20">
            <View className="flex-row items-center justify-between mb-5 px-1">
              <Text 
                style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                className="text-[11px] text-brand-muted uppercase tracking-[4px]"
              >
                Medical Records
              </Text>
              <TouchableOpacity onPress={() => isEditing ? saveMedicalInfo() : setIsEditing(true)}>
                <Text 
                  style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                  className="text-brand-vivid text-[11px] uppercase tracking-widest"
                >
                  {isEditing ? 'COMMIT' : 'EDIT'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-5">
              <View className="bg-brand-card p-6 rounded-[28px] border border-brand-border">
                <Text 
                  style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                  className="text-[10px] text-brand-muted uppercase tracking-widest mb-3 italic"
                >
                  Known Allergens
                </Text>
                {isEditing ? (
                  <TextInput 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold', color: '#ffffff' }}
                    className="text-lg border-b border-brand-border pb-2" 
                    value={editedAllergens} 
                    onChangeText={setEditedAllergens} 
                    autoFocus 
                  />
                ) : (
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} 
                    className="text-brand-accent text-lg"
                  >
                    {profile?.allergens || 'NONE'}
                  </Text>
                )}
              </View>

              <View className="bg-brand-card p-6 rounded-[28px] border border-brand-border">
                <Text 
                  style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
                  className="text-[10px] text-brand-muted uppercase tracking-widest mb-3 italic"
                >
                  Active Medications
                </Text>
                {isEditing ? (
                  <TextInput 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold', color: '#ffffff' }}
                    className="text-lg border-b border-brand-border pb-2" 
                    value={editedMedications} 
                    onChangeText={setEditedMedications} 
                  />
                ) : (
                  <Text 
                    style={{ fontFamily: 'IBMPlexSans_600SemiBold' }} 
                    className="text-brand-accent text-lg"
                  >
                    {profile?.medications || 'NONE'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Sign Out: Minimal */}
          <TouchableOpacity 
            onPress={() => logOut().then(() => router.replace('/'))} 
            className="items-center pb-16"
          >
            <Text 
              style={{ fontFamily: 'IBMPlexSans_700Bold' }} 
              className="text-brand-vivid text-[12px] uppercase tracking-[6px]"
            >
              Sign Out
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {isDriveModeActive && <DriveModeOverlay onExit={toggleDriveMode} />}
    </View>
  );
}
