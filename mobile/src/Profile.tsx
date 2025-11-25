import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { useEffect, useState } from "react";
import { api } from "./api/client";

type Props = { onLogout: () => void };

export default function Profile({ onLogout }: Props) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });

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
    mutationFn: (payload: any) => api.updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
    onError: (err: any) => Alert.alert("Erro", err.message || "Falha ao atualizar perfil"),
  });

  const handleSave = () => {
    updateMutation.mutate({
      full_name: fullName,
      bio,
      avatar_url: avatarUrl,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Perfil</Text>
        {isLoading && <Text style={styles.muted}>Carregando...</Text>}
        {user && (
          <View style={styles.card}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={bio}
              onChangeText={setBio}
              multiline
            />

            <Text style={styles.label}>Avatar URL</Text>
            <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} />

            <TouchableOpacity style={styles.save} onPress={handleSave} disabled={updateMutation.isPending}>
              <Text style={styles.saveText}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { color: "#94a3b8", fontSize: 12 },
  value: { color: "#0f172a", fontSize: 16, fontWeight: "600" },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
  },
  logout: {
    marginTop: 12,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
  muted: { color: "#94a3b8" },
  save: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
