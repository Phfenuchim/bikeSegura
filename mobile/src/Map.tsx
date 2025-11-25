import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";

type Incident = { id: number; latitude: number; longitude: number; severity: string; title: string };
type Route = { id: number; start_lat: number; start_lng: number; end_lat: number; end_lng: number; name: string };
type SOS = { id: number; latitude: number; longitude: number; status: string };

type Props = { onLogout: () => void };

export default function MapScreen({ onLogout }: Props) {
  const [region, setRegion] = useState<Region>({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion((prev) => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }));
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setHasLocation(true);

        await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 20 },
          (update) => {
            setCoords({ lat: update.coords.latitude, lng: update.coords.longitude });
          }
        );
      } else {
        setLocError("Permissao de localizacao negada");
      }
    })();
  }, []);

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: () => api.incidents(),
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["routes"],
    queryFn: () => api.routes(),
  });

  const { data: sosAlerts = [] } = useQuery<SOS[]>({
    queryKey: ["sos"],
    queryFn: () => api.sos(),
  });

  const handleQuickIncident = async () => {
    if (!coords) {
      Alert.alert("Localizacao", "Nao foi possivel obter sua posicao");
      return;
    }
    try {
      await api.createIncident({
        title: "Incidente rapido",
        description: "Relato enviado pelo app",
        latitude: coords.lat,
        longitude: coords.lng,
        severity: "warning",
      });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      Alert.alert("Ok", "Incidente reportado");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao criar incidente");
    }
  };

  const handleQuickSOS = async () => {
    if (!coords) {
      Alert.alert("Localizacao", "Nao foi possivel obter sua posicao");
      return;
    }
    try {
      await api.createSOS({
        latitude: coords.lat,
        longitude: coords.lng,
        message: "SOS enviado pelo app",
        status: "open",
      });
      await queryClient.invalidateQueries({ queryKey: ["sos"] });
      Alert.alert("Ok", "SOS enviado");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao enviar SOS");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={hasLocation}
        showsMyLocationButton={false}
      >
        {incidents.map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
            title={inc.title}
            description={inc.severity}
            pinColor={inc.severity === "danger" ? "red" : inc.severity === "warning" ? "orange" : "green"}
          />
        ))}

        {routes.map((r) => (
          <View key={`route-${r.id}`}>
            <Marker
              coordinate={{ latitude: r.start_lat, longitude: r.start_lng }}
              title={`Rota: ${r.name}`}
              description="Inicio"
              pinColor="blue"
            />
            <Marker
              coordinate={{ latitude: r.end_lat, longitude: r.end_lng }}
              title={`Chegada: ${r.name}`}
              description="Destino"
              pinColor="navy"
            />
            <Polyline
              coordinates={[
                { latitude: r.start_lat, longitude: r.start_lng },
                { latitude: r.end_lat, longitude: r.end_lng },
              ]}
              strokeColor="#2563eb"
              strokeWidth={3}
            />
          </View>
        ))}

        {sosAlerts.map((s) => (
          <Marker
            key={`sos-${s.id}`}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title="SOS"
            description={s.status}
            pinColor="purple"
          />
        ))}

        {hasLocation && coords ? (
          <Marker key="me" coordinate={{ latitude: coords.lat, longitude: coords.lng }} title="Voce" pinColor="blue" />
        ) : null}
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.title}>Mapa</Text>
        {locError ? <Text style={styles.error}>{locError}</Text> : null}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              queryClient.invalidateQueries({ queryKey: ["incidents"] });
              queryClient.invalidateQueries({ queryKey: ["routes"] });
              queryClient.invalidateQueries({ queryKey: ["sos"] });
            }}
          >
            <Text style={styles.buttonText}>Recarregar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonAlt}
            onPress={() => {
              if (coords) {
                setRegion((prev) => ({
                  ...prev,
                  latitude: coords.lat,
                  longitude: coords.lng,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                }));
              }
            }}
          >
            <Text style={styles.buttonText}>Centralizar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonAlt} onPress={handleQuickIncident}>
            <Text style={styles.buttonText}>Incidente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonAlt} onPress={handleQuickSOS}>
            <Text style={styles.buttonText}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logout} onPress={onLogout}>
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonAlt: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  logout: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
  error: { color: "#ef4444" },
});
