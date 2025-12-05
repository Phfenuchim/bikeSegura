import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { api } from "./api/client";

type Props = {
  onLogin: (token: string) => void;
};

export default function Login(props: Props & { navigation: any }) {
  const { onLogin } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resp = await api.login(email, password);
      if (resp.access_token) {
        onLogin(resp.access_token);
      } else {
        Alert.alert("Erro", "Token não retornado");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BikeSegura</Text>
      <Text style={styles.subtitle}>Acesse sua conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => (props as any).navigation.navigate("Register")}>
        <Text style={styles.linkText}>Não tem conta? Crie uma</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f5fdf8", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#065f46", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#065f46", textAlign: "center", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  button: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkButton: { alignItems: "center", marginTop: 16 },
  linkText: { color: "#059669", fontWeight: "600" },
});
