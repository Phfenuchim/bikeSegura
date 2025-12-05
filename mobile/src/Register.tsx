import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { api } from "./api/client";
import { useNavigation } from "@react-navigation/native";

type Props = {
    onLogin: (token: string) => void;
};

export default function Register({ onLogin }: Props) {
    const navigation = useNavigation();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert("Erro", "Preencha todos os campos");
            return;
        }

        setLoading(true);
        try {
            const resp = await api.register(email, password, fullName);
            if (resp.access_token) {
                Alert.alert("Sucesso", "Conta criada com sucesso!", [
                    { text: "OK", onPress: () => onLogin(resp.access_token) }
                ]);
            } else {
                Alert.alert("Erro", "Token não retornado após cadastro");
            }
        } catch (err: any) {
            Alert.alert("Erro", err.message || "Falha no cadastro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.subtitle}>Junte-se ao BikeSegura</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                value={fullName}
                onChangeText={setFullName}
            />

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

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Cadastrar</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
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
    linkButton: { alignItems: "center", marginTop: 12 },
    linkText: { color: "#059669", fontWeight: "600" },
});
