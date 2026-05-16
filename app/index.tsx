import "../globals.css"
import { Text, View } from "react-native";
import {Link} from "expo-router";

export default function App() {
    return (
        <View className="flex-1 items-center justify-center bg-blue-500">
            <Text className="text-xl font-bold text-white">
                Welcome to RoadSOS!
            </Text>
            <Link href = "/(auth)/signIn" className="mb-2">
                <Text className="text-white underline">Sign in as Citizen</Text>
            </Link>
            <Link href = "/(auth)/helperSignIn" className="mb-2">
                <Text className="text-white underline">Sign in as Helper</Text>
            </Link>
            <Link href = "/(auth)/adminSignIn" className="mb-2">
                <Text className="text-white underline">Sign in as Admin</Text>
            </Link>
            <Link href = "/(auth)/adminSignUp">
                <Text className="text-white underline">Register New Entity (Admin)</Text>
            </Link>

        </View>
    );
}