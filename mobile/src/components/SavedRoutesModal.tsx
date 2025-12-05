import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

type Route = {
    id: number;
    name: string;
    distance_km?: number;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    routes: Route[];
    onSelect: (routeId: number) => void;
};

export function SavedRoutesModal({ visible, onClose, routes, onSelect }: Props) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rotas Salvas</Text>

                    <ScrollView style={{ maxHeight: 300 }}>
                        {routes.length > 0 ? (
                            routes.map((route) => (
                                <TouchableOpacity
                                    key={route.id}
                                    style={styles.routeItem}
                                    onPress={() => {
                                        onSelect(route.id);
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.routeName}>{route.name}</Text>
                                    <Text style={styles.routeDetail}>
                                        {route.distance_km ? `${route.distance_km.toFixed(1)} km` : "Sem distância"}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Nenhuma rota salva</Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                        <Text style={styles.btnText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, textAlign: "center" },
    routeItem: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 8 },
    routeName: { fontWeight: "700", color: "#0f172a" },
    routeDetail: { fontSize: 12, color: "#64748b" },
    emptyText: { textAlign: "center", color: "#94a3b8", padding: 20 },
    btn: { padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 },
    btnCancel: { backgroundColor: "#e2e8f0" },
    btnText: { fontWeight: "700", color: "#334155" },
});
