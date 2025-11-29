import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Home from "./Home";
import Login from "./Login";
import { setAuthToken } from "./api/httpClient";
import MapScreen from "./Map";
import ProfileScreen from "./Profile";
import FeedScreen from "./Feed";
import RoutesScreen from "./Routes";
import { RouteSelectionProvider } from "./RouteSelectionContext";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#0f172a",
        tabBarStyle: { paddingBottom: 6, height: 58, padding: "5%"  },
        padding: "5%",
      }}
    >
      <Tab.Screen
        name="Mapa"
        options={{
          tabBarLabel: "Mapa",
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      >
        {() => <MapScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="Rotas"
        options={{
          tabBarLabel: "Rotas",
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate-outline" size={size} color={color} />,
        }}
      >
        {() => <RoutesScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Comunidade"
        options={{
          tabBarLabel: "Comunidade",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      >
        {() => <FeedScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Perfil"
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const stored = await SecureStore.getItemAsync("auth_token");
      setToken(stored);
      setAuthToken(stored);
      setLoading(false);
    };
    loadToken();
  }, []);

  const handleLogin = async (newToken: string) => {
    await SecureStore.setItemAsync("auth_token", newToken);
    setAuthToken(newToken);
    setToken(newToken);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("auth_token");
    setAuthToken(null);
    setToken(null);
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RouteSelectionProvider>
          <StatusBar style="dark" />
          {loading ? null : (
            <NavigationContainer>
              {token ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Main">
                    {() => <MainTabs onLogout={handleLogout} />}
                  </Stack.Screen>
                </Stack.Navigator>
              ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login">
                    {() => <Login onLogin={handleLogin} />}
                  </Stack.Screen>
                </Stack.Navigator>
              )}
            </NavigationContainer>
          )}
        </RouteSelectionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
