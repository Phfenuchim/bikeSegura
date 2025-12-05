import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type RoutePreferences = {
    routeType: "cycleway" | "bike-lane" | "shared" | "fastest";
    avoidSteepHills: boolean;
    avoidIncidents: boolean;
    avoidHighTraffic: boolean;
    priority: "shortest" | "fastest" | "safest" | "with-support";
};

type Props = {
    visible: boolean;
    onClose: () => void;
    preferences: RoutePreferences;
    onSave: (prefs: RoutePreferences) => void;
};

export function RoutePreferencesModal({ visible, onClose, preferences, onSave }: Props) {
    const [localPrefs, setLocalPrefs] = useState<RoutePreferences>(preferences);

    const handleSave = () => {
        onSave(localPrefs);
        onClose();
    };

    const routeTypes = [
        { value: "cycleway", label: "Ciclovias Dedicadas", icon: "bicycle", desc: "Apenas ciclovias separadas" },
        { value: "bike-lane", label: "Ciclofaixas", icon: "trail-sign", desc: "Ciclofaixas e ciclovias" },
        { value: "shared", label: "Ruas Compartilhadas", icon: "car", desc: "Inclui ruas com baixo tráfego" },
        { value: "fastest", label: "Mais Rápido", icon: "flash", desc: "Qualquer tipo de via" },
    ] as const;

    const priorities = [
        { value: "shortest", label: "Mais Curta", icon: "resize", desc: "Menor distância" },
        { value: "fastest", label: "Mais Rápida", icon: "speedometer", desc: "Menor tempo" },
        { value: "safest", label: "Mais Segura", icon: "shield-checkmark", desc: "Menos incidentes" },
        { value: "with-support", label: "Com Apoio", icon: "business", desc: "Passa por pontos de apoio" },
    ] as const;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Preferências de Rota</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Route Type */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tipo de Via</Text>
                            {routeTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.option,
                                        localPrefs.routeType === type.value && styles.optionSelected,
                                    ]}
                                    onPress={() => setLocalPrefs({ ...localPrefs, routeType: type.value })}
                                >
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            localPrefs.routeType === type.value && styles.optionIconSelected,
                                        ]}
                                    >
                                        <Ionicons
                                            name={type.icon as any}
                                            size={20}
                                            color={localPrefs.routeType === type.value ? "#2563eb" : "#64748b"}
                                        />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                localPrefs.routeType === type.value && styles.optionLabelSelected,
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                        <Text style={styles.optionDesc}>{type.desc}</Text>
                                    </View>
                                    {localPrefs.routeType === type.value && (
                                        <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Avoid */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Evitar</Text>

                            <View style={styles.toggleRow}>
                                <View style={styles.toggleLabel}>
                                    <Ionicons name="trending-up" size={20} color="#64748b" />
                                    <Text style={styles.toggleText}>Subidas Íngremes</Text>
                                </View>
                                <Switch
                                    value={localPrefs.avoidSteepHills}
                                    onValueChange={(val) => setLocalPrefs({ ...localPrefs, avoidSteepHills: val })}
                                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                                    thumbColor={localPrefs.avoidSteepHills ? "#2563eb" : "#f1f5f9"}
                                />
                            </View>

                            <View style={styles.toggleRow}>
                                <View style={styles.toggleLabel}>
                                    <Ionicons name="warning" size={20} color="#64748b" />
                                    <Text style={styles.toggleText}>Áreas com Incidentes</Text>
                                </View>
                                <Switch
                                    value={localPrefs.avoidIncidents}
                                    onValueChange={(val) => setLocalPrefs({ ...localPrefs, avoidIncidents: val })}
                                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                                    thumbColor={localPrefs.avoidIncidents ? "#2563eb" : "#f1f5f9"}
                                />
                            </View>

                            <View style={styles.toggleRow}>
                                <View style={styles.toggleLabel}>
                                    <Ionicons name="car" size={20} color="#64748b" />
                                    <Text style={styles.toggleText}>Ruas de Alto Tráfego</Text>
                                </View>
                                <Switch
                                    value={localPrefs.avoidHighTraffic}
                                    onValueChange={(val) => setLocalPrefs({ ...localPrefs, avoidHighTraffic: val })}
                                    trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                                    thumbColor={localPrefs.avoidHighTraffic ? "#2563eb" : "#f1f5f9"}
                                />
                            </View>
                        </View>

                        {/* Priority */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Prioridade</Text>
                            {priorities.map((priority) => (
                                <TouchableOpacity
                                    key={priority.value}
                                    style={[
                                        styles.option,
                                        localPrefs.priority === priority.value && styles.optionSelected,
                                    ]}
                                    onPress={() => setLocalPrefs({ ...localPrefs, priority: priority.value })}
                                >
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            localPrefs.priority === priority.value && styles.optionIconSelected,
                                        ]}
                                    >
                                        <Ionicons
                                            name={priority.icon as any}
                                            size={20}
                                            color={localPrefs.priority === priority.value ? "#2563eb" : "#64748b"}
                                        />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                localPrefs.priority === priority.value && styles.optionLabelSelected,
                                            ]}
                                        >
                                            {priority.label}
                                        </Text>
                                        <Text style={styles.optionDesc}>{priority.desc}</Text>
                                    </View>
                                    {localPrefs.priority === priority.value && (
                                        <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Salvar Preferências</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        marginBottom: 8,
        gap: 12,
    },
    optionSelected: {
        backgroundColor: "#eff6ff",
        borderWidth: 2,
        borderColor: "#2563eb",
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    optionIconSelected: {
        backgroundColor: "#dbeafe",
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 2,
    },
    optionLabelSelected: {
        color: "#1e40af",
    },
    optionDesc: {
        fontSize: 13,
        color: "#94a3b8",
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        marginBottom: 8,
    },
    toggleLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    toggleText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#475569",
    },
    footer: {
        flexDirection: "row",
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    saveBtn: {
        flex: 2,
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: "#2563eb",
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
