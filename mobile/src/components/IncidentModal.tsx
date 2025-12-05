import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from "react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, type: string) => Promise<void>;
    types: string[];
};

export function IncidentModal({ visible, onClose, onSubmit, types }: Props) {
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [selectedType, setSelectedType] = React.useState(types[0] || "");
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async () => {
        if (!title) return;
        setLoading(true);
        await onSubmit(title, description, selectedType);
        setLoading(false);
        setTitle("");
        setDescription("");
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Reportar Incidente</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Título"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="Descrição"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />

                    <Text style={styles.label}>Tipo:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {types.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Text style={[styles.typeText, selectedType === type && { color: "#fff" }]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                            <Text style={styles.btnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.btnConfirm]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.btnText, { color: "#fff" }]}>Enviar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, textAlign: "center" },
    input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12 },
    label: { fontWeight: "600", marginBottom: 8, color: "#0f172a" },
    typeScroll: { marginBottom: 12 },
    typeChip: { backgroundColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
    typeChipActive: { backgroundColor: "#2563eb" },
    typeText: { fontWeight: "600", color: "#334155" },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
    btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
    btnCancel: { backgroundColor: "#e2e8f0" },
    btnConfirm: { backgroundColor: "#2563eb" },
    btnText: { fontWeight: "700", color: "#334155" },
});
