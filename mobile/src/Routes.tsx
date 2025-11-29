import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";
import { useRouteSelection } from "./RouteSelectionContext";

type RouteData = {
  id: number;
  name: string;
  description?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance_km?: number;
};

export default function RoutesScreen() {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { setRoute } = useRouteSelection();

  const { data: routes = [], isLoading, refetch } = useQuery<RouteData[]>({
    queryKey: ["routes-list"],
    queryFn: () => api.routes(),
  });

  const { data: savedServer = [] } = useQuery<RouteData[]>({
    queryKey: ["routes-saved"],
    queryFn: () => api.savedRoutes(),
    staleTime: 1000 * 30,
  });

  const { data: searchResults = [] } = useQuery<RouteData[]>({
    queryKey: ["routes-search", search],
    queryFn: () => api.routesSearch(search),
    enabled: search.trim().length > 1,
  });

  const publishMutation = useMutation({
    mutationFn: (payload: { id: number; name: string }) => api.shareRoute(payload.id, payload.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      Alert.alert("Ok", "Rota compartilhada na comunidade");
    },
    onError: (err: any) => Alert.alert("Erro", err.message || "Nao foi possivel publicar a rota"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id: number; save: boolean }) => api.saveRoute(payload.id, payload.save),
    onSuccess: (_, variables) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (variables.save) next.add(variables.id);
        else next.delete(variables.id);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["routes-saved"] });
    },
    onError: (err: any) => Alert.alert("Erro", err.message || "Falha ao salvar rota"),
  });

  const baseSaved = useMemo(() => new Set(savedServer.map((r) => r.id)), [savedServer]);
  const savedMerged = useMemo(() => {
    const merged = new Set<number>([...baseSaved, ...savedIds]);
    return merged;
  }, [baseSaved, savedIds]);

  const savedList = useMemo(
    () => routes.filter((r) => savedMerged.has(r.id)).concat(savedServer.filter((r) => !routes.find((rr) => rr.id == r.id && savedMerged.has(rr.id)))),
    [routes, savedServer, savedMerged]
  );

  const displayedRoutes = search.trim().length > 1 ? searchResults : routes;

  const toggleSave = (id: number) => {
    const isSaved = savedMerged.has(id);
    saveMutation.mutate({ id, save: !isSaved });
  };

  const handlePublish = (r: RouteData) => publishMutation.mutate({ id: r.id, name: r.name || "Rota" });

  const handleNavigate = (r: RouteData) => {
    setRoute(r);
    Alert.alert("Mapa", "Rota enviada para a aba Mapa. Abra o Mapa para centralizar e planejar.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rotas</Text>
            <Text style={styles.subtitle}>Salve, publique e use rotas da comunidade.</Text>
          </View>
          <TouchableOpacity style={styles.refresh} onPress={() => refetch()}>
            <Text style={styles.refreshText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Buscar rota por nome..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />

        {isLoading && <Text style={styles.muted}>Carregando...</Text>}
        {!displayedRoutes.length && !isLoading && <Text style={styles.muted}>Nenhuma rota disponivel.</Text>}

        {savedList.length > 0 && (
          <View style={styles.savedCard}>
            <Text style={styles.cardTitle}>Rotas salvas</Text>
            {savedList.map((r) => (
              <View key={`saved-${r.id}`} style={styles.savedRow}>
                <Text style={styles.savedName}>{r.name || "Rota"}</Text>
                <View style={styles.savedActions}>
                  <TouchableOpacity onPress={() => handleNavigate(r)}>
                    <Text style={styles.link}>Navegar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handlePublish(r)} disabled={publishMutation.isPending}>
                    <Text style={styles.link}>Publicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {displayedRoutes.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.cardTitle}>{r.name || "Rota"}</Text>
            {r.description ? <Text style={styles.cardSubtitle}>{r.description}</Text> : null}
            <Text style={styles.cardMeta}>
              Inicio: {r.start_lat.toFixed(3)}, {r.start_lng.toFixed(3)}
            </Text>
            <Text style={styles.cardMeta}>
              Fim: {r.end_lat.toFixed(3)}, {r.end_lng.toFixed(3)}
            </Text>
            <Text style={styles.cardMeta}>
              Distancia: {r.distance_km ? `${r.distance_km.toFixed(1)} km` : "--"}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => toggleSave(r.id)}>
                <Text style={styles.secondaryText}>{savedIds.has(r.id) ? "Remover" : "Salvar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => handleNavigate(r)}>
                <Text style={styles.secondaryText}>Navegar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, publishMutation.isPending && { opacity: 0.6 }]}
                onPress={() => handlePublish(r)}
                disabled={publishMutation.isPending}
              >
                <Text style={styles.primaryText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  scroll: { padding: 16, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#e2e8f0" },
  subtitle: { color: "#94a3b8", marginTop: 4 },
  search: {
    marginTop: 8,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    color: "#e2e8f0",
  },
  refresh: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  muted: { color: "#94a3b8" },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  cardTitle: { fontWeight: "700", color: "#e2e8f0", fontSize: 16 },
  cardSubtitle: { color: "#cbd5e1", fontSize: 13 },
  cardMeta: { color: "#94a3b8", fontSize: 12 },
  actions: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  savedCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    gap: 8,
  },
  savedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  savedName: { color: "#e2e8f0", fontWeight: "700" },
  savedActions: { flexDirection: "row", gap: 12 },
  link: { color: "#60a5fa", fontWeight: "700" },
});
