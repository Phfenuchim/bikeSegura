import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { api, FeedPost, RouteData } from "./api/client";
import { useRouteSelection } from "./RouteSelectionContext";

export default function FeedScreen() {
  const queryClient = useQueryClient();
  const { setRoute } = useRouteSelection();
  const { data: posts = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: () => api.feedList(),
  });
  const { data: sharedSummary } = useQuery({
    queryKey: ["shared-routes"],
    queryFn: () => api.sharedRoutes(),
  });

  const [content, setContent] = useState("");

  const createMutation = useMutation({
    mutationFn: (text: string) => api.feedCreate(text),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: any) => Alert.alert("Erro", err.message || "Nao foi possivel criar post"),
  });

  const useRouteFromPost = async (post: FeedPost) => {
    try {
      const routes = await api.routes();
      const match = routes.find((r: RouteData) =>
        (post.content || "").toLowerCase().includes((r.name || "").toLowerCase())
      );
      if (match) {
        setRoute(match);
        Alert.alert("Mapa", "Rota enviada para a aba Mapa. Abra o Mapa para usar.");
      } else {
        Alert.alert("Rota", "Nao encontramos rota correspondente.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao buscar rotas");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Feed</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Compartilhe uma atualizacao..."
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => createMutation.mutate(content)}
            disabled={!content.trim() || createMutation.isPending}
          >
            <Text style={styles.buttonText}>{createMutation.isPending ? "Enviando..." : "Publicar"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Publicacoes recentes</Text>
          {isLoading && <Text style={styles.muted}>Carregando...</Text>}
          {posts.map((post) => (
            <View key={post.id} style={styles.post}>
              <Text style={styles.postContent}>{post.content}</Text>
              <Text style={styles.postMeta}>{post.created_at?.slice(0, 16).replace("T", " ")}</Text>
              {post.content?.startsWith("[Rota]") && (
                <TouchableOpacity style={styles.useRoute} onPress={() => useRouteFromPost(post)}>
                  <Text style={styles.useRouteText}>Usar rota no mapa</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!isLoading && posts.length === 0 && <Text style={styles.muted}>Sem posts ainda.</Text>}
        </View>

        {sharedSummary?.shared_routes?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rotas compartilhadas</Text>
            {sharedSummary.shared_routes.map((s: any) => (
              <View key={`shared-${s.id}`} style={styles.sharedCard}>
                <Text style={styles.postContent}>Rota #{s.route_id}</Text>
                {s.note ? <Text style={styles.postMeta}>{s.note}</Text> : null}
                <View style={styles.sharedActions}>
                  <TouchableOpacity
                    style={styles.useRoute}
                    onPress={async () => {
                      try {
                        const routes = await api.routes();
                        const match = routes.find((r: RouteData) => r.id === s.route_id);
                        if (match) {
                          setRoute(match);
                          Alert.alert("Mapa", "Rota enviada para a aba Mapa.");
                        } else {
                          Alert.alert("Rota", "Nao encontramos essa rota.");
                        }
                      } catch (err: any) {
                        Alert.alert("Erro", err.message || "Falha ao buscar rotas");
                      }
                    }}
                  >
                    <Text style={styles.useRouteText}>Usar no mapa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveRoute}
                    onPress={() => api.saveRoute(s.route_id, true).catch((err: any) => Alert.alert("Erro", err.message || "Falha ao salvar"))}
                  >
                    <Text style={styles.saveRouteText}>Salvar rota</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#e2e8f0" },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#e2e8f0" },
  input: {
    minHeight: 60,
    backgroundColor: "#0b1220",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.3)",
    textAlignVertical: "top",
    color: "#e2e8f0",
  },
  button: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  post: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(226,232,240,0.2)" },
  postContent: { color: "#e2e8f0", fontSize: 15 },
  postMeta: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  muted: { color: "#94a3b8" },
  useRoute: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  useRouteText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  sharedCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.2)",
    gap: 4,
  },
  sharedActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  saveRoute: {
    alignSelf: "flex-start",
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveRouteText: { color: "#0b1220", fontWeight: "700", fontSize: 12 },
});
