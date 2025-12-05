import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";
import { useSavedRoutes } from "./modules/routes/useSavedRoutes";
import { useMapData } from "./modules/map/useMapData";

type Props = { onLogout: () => void };

type UserProfile = { full_name?: string; bio?: string; avatar_url?: string; email?: string };

export default function Profile({ onLogout }: Props) {
  const queryClient = useQueryClient();
  const { savedRoutes } = useSavedRoutes();
  const { incidentsList, sosList } = useMapData();
  const { data: user, isLoading } = useQuery<UserProfile>({ queryKey: ["me"], queryFn: () => api.me() });

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserProfile>) => api.updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
    onError: (err: any) => Alert.alert("Erro", err.message || "Falha ao atualizar perfil"),
  });

  const handleSave = () => {
    updateMutation.mutate({ full_name: fullName, bio, avatar_url: avatarUrl });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Seu perfil</Text>
        {isLoading && <Text style={styles.muted}>Carregando...</Text>}

        {user && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              {avatarUrl.trim() ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{fullName ? fullName[0]?.toUpperCase() : user.email?.[0]?.toUpperCase() || "?"}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.value}>{fullName || "Sem nome"}</Text>
                <Text style={styles.muted}>{user.email}</Text>
              </View>
            </View>

            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Seu nome" />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Conte um pouco sobre voce"
            />

            <Text style={styles.label}>Avatar URL</Text>
            <TextInput
              style={styles.input}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://..."
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.save} onPress={handleSave} disabled={updateMutation.isPending}>
              <Text style={styles.saveText}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.metricsCard}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Rotas salvas</Text>
            <Text style={styles.metricValue}>{savedRoutes.length}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Incidentes ativos</Text>
            <Text style={styles.metricValue}>{incidentsList.length}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>SOS ativos</Text>
            <Text style={styles.metricValue}>{sosList.length}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#e2e8f0" },
  cardTitle: { color: "#e2e8f0", fontWeight: "700", fontSize: 16 },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  avatar: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#1e293b" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#e2e8f0", fontWeight: "800", fontSize: 18 },
  label: { color: "#94a3b8", fontSize: 12, marginTop: 6 },
  value: { color: "#e2e8f0", fontSize: 16, fontWeight: "700" },
  input: {
    backgroundColor: "#0b1220",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    color: "#e2e8f0",
  },
  logout: {
    marginTop: 12,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
  muted: { color: "#94a3b8" },
  save: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  metricsCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.15)",
  },
  metricRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: "#94a3b8", fontSize: 12 },
  metricValue: { color: "#e2e8f0", fontWeight: "800", fontSize: 16 },
});
