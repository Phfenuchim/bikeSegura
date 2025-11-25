import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api/client";

type MapSummary = {
  incidents?: {
    highlights: Array<{ title: string; severity: string; lat: number; lng: number }>;
    counts: { total: number; danger: number; warning: number; info?: number };
  };
  routes?: Array<{ id: number; name: string }>;
  events?: Array<{ id: number; name: string; status: string; start_date: string }>;
  sos?: Array<{ id: number; lat: number; lng: number; status: string }>;
};

type Props = { onLogout: () => void; goToMap: () => void };

export default function Home({ onLogout, goToMap }: Props) {
  const { data, isLoading, refetch } = useQuery<MapSummary>({
    queryKey: ["map-summary"],
    queryFn: () => api.mapSummary(),
  });

  const counts = data?.incidents?.counts || { total: 0, danger: 0, warning: 0, info: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>BikeSegura</Text>
        <Text style={styles.subtitle}>Alertas ao vivo e rotas confiaveis</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do mapa</Text>
          {isLoading && <Text style={styles.muted}>Carregando...</Text>}
          <Text style={styles.muted}>Total: {counts.total}</Text>
          <Text style={styles.muted}>Perigo: {counts.danger}</Text>
          <Text style={styles.muted}>Avisos: {counts.warning}</Text>
          <TouchableOpacity style={styles.button} onPress={() => refetch()}>
            <Text style={styles.buttonText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Incidentes recentes</Text>
          {data?.incidents?.highlights?.slice(0, 5).map((item, idx) => (
            <Text key={idx} style={styles.listItem}>
              • [{item.severity}] {item.title}
            </Text>
          ))}
          {!data?.incidents?.highlights?.length && !isLoading && (
            <Text style={styles.muted}>Nenhum alerta carregado.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rotas recentes</Text>
          {data?.routes?.slice(0, 3).map((r) => (
            <Text key={r.id} style={styles.listItem}>
              • {r.name}
            </Text>
          ))}
          {!data?.routes?.length && <Text style={styles.muted}>Nenhuma rota carregada.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eventos</Text>
          {data?.events?.slice(0, 3).map((e) => (
            <Text key={e.id} style={styles.listItem}>
              • [{e.status}] {e.name}
            </Text>
          ))}
          {!data?.events?.length && <Text style={styles.muted}>Nenhum evento carregado.</Text>}
        </View>

        <TouchableOpacity style={styles.mapButton} onPress={goToMap}>
          <Text style={styles.mapButtonText}>Abrir mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fdf8" },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#065f46" },
  subtitle: { fontSize: 16, color: "#065f46" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  muted: { color: "#64748b" },
  button: {
    marginTop: 8,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  listItem: { color: "#0f172a" },
  mapButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  mapButtonText: { color: "#fff", fontWeight: "700" },
  logout: {
    marginTop: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
});
