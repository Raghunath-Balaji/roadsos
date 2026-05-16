import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { auth, db } from '../../config/firebase';
import { logOut, enrollStaff } from '../../services/authService';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const [entityInfo, setEntityInfo] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Enrollment Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('helper-ambulance');
  const [enrolling, setEnrolling] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let unsubscribeStaff: () => void;

    const initDashboard = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const adminRegSnap = await getDoc(doc(db, "adminRegistry", user.uid));
        if (adminRegSnap.exists()) {
          const { unitId } = adminRegSnap.data();
          
          const entitySnap = await getDoc(doc(db, "hospitals", unitId));
          if (entitySnap.exists()) {
            setEntityInfo(entitySnap.data());
          }

          // Listen to staff collection
          const staffQuery = query(collection(db, "hospitals", unitId, "staff"), orderBy("createdAt", "desc"));
          unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
            const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStaffList(staff);
          });
        }
      } catch (error) {
        console.error("Dashboard Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
    return () => unsubscribeStaff?.();
  }, []);

  const handleEnroll = async () => {
    if (!staffName || !staffEmail || !staffPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setEnrolling(true);
    const result = await enrollStaff(entityInfo.hospitalId, {
      name: staffName,
      email: staffEmail,
      password: staffPassword,
      role: staffRole
    });
    setEnrolling(false);

    if (result.success) {
      Alert.alert("Success", "Staff member enrolled successfully!");
      setModalVisible(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
    } else {
      Alert.alert("Enrollment Failed", result.error || "Unknown error");
    }
  };

  const handleLogOut = async () => {
    const { error } = await logOut();
    if (!error) {
      router.replace('/');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'helper-ambulance': return 'bus';
      case 'helper-doctor': return 'medical';
      case 'helper-police': return 'shield';
      case 'helper-fire': return 'flame';
      default: return 'person';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="p-6 pt-16">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Administrative Portal</Text>
              <Text className="text-3xl font-black text-slate-900">Dashboard</Text>
            </View>
            <TouchableOpacity onPress={handleLogOut} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Entity Info Card */}
          <View className="bg-slate-900 rounded-[40px] p-8 mb-8 shadow-xl shadow-slate-900/20">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1">
                <Text className="text-blue-400 text-[10px] font-black uppercase tracking-[3px] mb-2">Active Entity</Text>
                <Text className="text-white text-3xl font-black leading-tight">{entityInfo?.name || "Organization"}</Text>
              </View>
              <View className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <Text className="text-white font-bold text-[10px] uppercase">{entityInfo?.type || "N/A"}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-white/10 w-full mb-6" />

            <View className="flex-row items-center">
              <View className="bg-white/10 p-3 rounded-2xl mr-4">
                <Ionicons name="finger-print" size={20} color="#60a5fa" />
              </View>
              <View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Unit Identifier</Text>
                <Text className="text-white font-black text-xl tracking-widest">{entityInfo?.hospitalId || "----"}</Text>
              </View>
            </View>
          </View>

          {/* Staff Enrollment Action */}
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="bg-white border border-slate-100 p-6 rounded-[30px] flex-row items-center mb-8 shadow-sm"
          >
            <View className="bg-blue-50 p-4 rounded-2xl mr-4">
              <Ionicons name="person-add" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-lg">Enroll New Staff</Text>
              <Text className="text-slate-400 text-xs">Add professional responders to your unit.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Staff List */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-6 px-2">
              <Text className="text-slate-900 text-xl font-black">Current Staff <Text className="text-slate-300 font-bold">({staffList.length})</Text></Text>
            </View>

            {staffList.length === 0 ? (
              <View className="bg-white border border-slate-100 p-12 rounded-[30px] items-center justify-center">
                <Ionicons name="people-outline" size={48} color="#e2e8f0" />
                <Text className="text-slate-400 font-bold mt-4">No staff members enrolled yet.</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {staffList.map((item) => (
                  <View key={item.id} className="bg-white p-5 rounded-[25px] flex-row items-center border border-slate-100">
                    <View className="bg-slate-50 p-3 rounded-2xl mr-4">
                      <Ionicons name={getRoleIcon(item.role)} size={24} color="#1e293b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-bold">{item.name}</Text>
                      <Text className="text-slate-400 text-xs">{item.email}</Text>
                    </View>
                    <View className="bg-slate-50 px-3 py-1 rounded-full">
                      <Text className="text-[10px] font-bold text-slate-500 uppercase">{item.role.split('-')[1]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Enrollment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-12">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-black text-slate-900">Enroll Staff</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <TextInput
                className="bg-slate-50 p-5 rounded-2xl font-bold"
                placeholder="Staff Full Name"
                value={staffName}
                onChangeText={setStaffName}
              />
              <TextInput
                className="bg-slate-50 p-5 rounded-2xl font-bold"
                placeholder="Staff Email"
                value={staffEmail}
                onChangeText={setStaffEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                className="bg-slate-50 p-5 rounded-2xl font-bold"
                placeholder="Temporary Password"
                value={staffPassword}
                onChangeText={setStaffPassword}
                secureTextEntry
              />
              
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-2">Assign Role</Text>
              <View className="flex-row flex-wrap gap-2">
                {['helper-ambulance', 'helper-doctor', 'helper-police', 'helper-fire'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setStaffRole(role)}
                    className={`px-4 py-2 rounded-full border ${staffRole === role ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`font-bold text-xs capitalize ${staffRole === role ? 'text-white' : 'text-slate-600'}`}>
                      {role.split('-')[1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                onPress={handleEnroll}
                disabled={enrolling}
                className={`mt-6 p-5 rounded-3xl items-center ${enrolling ? 'bg-slate-200' : 'bg-blue-600'}`}
              >
                {enrolling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black uppercase tracking-widest">Complete Enrollment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
