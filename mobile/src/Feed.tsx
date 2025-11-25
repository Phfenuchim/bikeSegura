import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { api, FeedPost } from "./api/client";

export default function FeedScreen() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: () => api.feedList(),
  });

  const [content, setContent] = useState("");

  const createMutation = useMutation({
    mutationFn: (text: string) => api.feedCreate(text),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: any) => Alert.alert("Erro", err.message || "Não foi possível criar post"),
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Feed</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Compartilhe uma atualização..."
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => createMutation.mutate(content)}
            disabled={!content.trim() || createMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {createMutation.isPending ? "Enviando..." : "Publicar"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Publicações recentes</Text>
          {isLoading && <Text style={styles.muted}>Carregando...</Text>}
          {posts.map((post) => (
            <View key={post.id} style={styles.post}>
              <Text style={styles.postContent}>{post.content}</Text>
              <Text style={styles.postMeta}>
                {post.created_at?.slice(0, 16).replace("T", " ")}
              </Text>
            </View>
          ))}
          {!isLoading && posts.length === 0 && <Text style={styles.muted}>Sem posts ainda.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  input: {
    minHeight: 60,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    textAlignVertical: "top",
  },
  button: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  post: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  postContent: { color: "#0f172a", fontSize: 15 },
  postMeta: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  muted: { color: "#94a3b8" },
});
