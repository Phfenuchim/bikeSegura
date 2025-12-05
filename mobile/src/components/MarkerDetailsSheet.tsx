import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MarkerType = "incident" | "sos" | "supportPoint";

type BaseMarkerData = {
    id: number;
    latitude: number;
    longitude: number;
};

type IncidentData = BaseMarkerData & {
    title: string;
    description?: string;
    type?: string;
    severity?: string;
    created_at: string;
    user_id?: number;
};

type SOSData = BaseMarkerData & {
    type?: string;
    message: string;
    created_at: string;
    user_id?: number;
    status?: string;
};

type SupportPointData = BaseMarkerData & {
    name: string;
    type?: string;
    description?: string;
    phone?: string;
    address?: string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    markerType: MarkerType;
    data: IncidentData | SOSData | SupportPointData | null;
    onAddToRoute: (lat: number, lng: number, name: string) => void;
    onNavigate: (lat: number, lng: number) => void;
    onAttendSOS?: (id: number) => void;
};

export function MarkerDetailsSheet({
    visible,
    onClose,
    markerType,
    data,
    onAddToRoute,
    onNavigate,
    onAttendSOS,
}: Props) {
    if (!data) return null;

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        if (markerType === "incident") return "warning";
        if (markerType === "sos") return "alert-circle";
        return "business";
    };

    const getIconColor = () => {
        if (markerType === "incident") return "#f59e0b";
        if (markerType === "sos") return "#ef4444";
        return "#10b981";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays < 7) return `Há ${diffDays} dias`;
        return date.toLocaleDateString("pt-BR");
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const renderIncidentContent = (incident: IncidentData) => (
        <>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
                    <Ionicons name={getIcon()} size={32} color={getIconColor()} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{incident.title}</Text>
                    <Text style={styles.subtitle}>
                        {incident.type || "Incidente"} • {formatDate(incident.created_at)}
                    </Text>
                </View>
            </View>

            {incident.severity && (
                <View style={[styles.badge, styles.severityBadge]}>
                    <Text style={styles.badgeText}>Severidade: {incident.severity}</Text>
                </View>
            )}

            {incident.description && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descrição</Text>
                    <Text style={styles.description}>{incident.description}</Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn]}
                    onPress={() => {
                        onAddToRoute(data.latitude, data.longitude, incident.title);
                        onClose();
                    }}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Adicionar ao Trajeto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={() => {
                        onNavigate(data.latitude, data.longitude);
                        onClose();
                    }}
                >
                    <Ionicons name="navigate" size={20} color="#2563eb" />
                    <Text style={[styles.actionBtnText, { color: "#2563eb" }]}>Navegar</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderSOSContent = (sos: SOSData) => (
        <>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
                    <Ionicons name={getIcon()} size={32} color={getIconColor()} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>SOS - {sos.type || "Emergência"}</Text>
                    <Text style={styles.subtitle}>{formatDate(sos.created_at)}</Text>
                </View>
            </View>

            <View style={[styles.badge, styles.urgentBadge]}>
                <Ionicons name="time" size={16} color="#dc2626" />
                <Text style={[styles.badgeText, { color: "#dc2626" }]}>URGENTE</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mensagem</Text>
                <Text style={styles.description}>{sos.message}</Text>
            </View>

            <View style={styles.actions}>
                {onAttendSOS && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.urgentBtn]}
                        onPress={() => {
                            onAttendSOS(data.id);
                            onClose();
                        }}
                    >
                        <Ionicons name="hand-left" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Atender SOS</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={() => {
                        onNavigate(data.latitude, data.longitude);
                        onClose();
                    }}
                >
                    <Ionicons name="navigate" size={20} color="#2563eb" />
                    <Text style={[styles.actionBtnText, { color: "#2563eb" }]}>Navegar</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderSupportPointContent = (point: SupportPointData) => (
        <>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
                    <Ionicons name={getIcon()} size={32} color={getIconColor()} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{point.name}</Text>
                    <Text style={styles.subtitle}>{point.type || "Ponto de Apoio"}</Text>
                </View>
            </View>

            {point.description && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Serviços</Text>
                    <Text style={styles.description}>{point.description}</Text>
                </View>
            )}

            {point.phone && (
                <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(point.phone!)}>
                    <Ionicons name="call" size={20} color="#2563eb" />
                    <Text style={[styles.infoText, { color: "#2563eb" }]}>{point.phone}</Text>
                </TouchableOpacity>
            )}

            {point.address && (
                <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#64748b" />
                    <Text style={styles.infoText}>{point.address}</Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn]}
                    onPress={() => {
                        onAddToRoute(data.latitude, data.longitude, point.name);
                        onClose();
                    }}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Adicionar ao Trajeto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={() => {
                        onNavigate(data.latitude, data.longitude);
                        onClose();
                    }}
                >
                    <Ionicons name="navigate" size={20} color="#2563eb" />
                    <Text style={[styles.actionBtnText, { color: "#2563eb" }]}>Navegar</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {markerType === "incident" && renderIncidentContent(data as IncidentData)}
                        {markerType === "sos" && renderSOSContent(data as SOSData)}
                        {markerType === "supportPoint" && renderSupportPointContent(data as SupportPointData)}
                    </ScrollView>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Fechar</Text>
                    </TouchableOpacity>
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
    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "#cbd5e1",
        borderRadius: 2,
        alignSelf: "center",
        marginVertical: 12,
    },
    content: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#64748b",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
        gap: 4,
    },
    severityBadge: {
        backgroundColor: "#fef3c7",
    },
    urgentBadge: {
        backgroundColor: "#fee2e2",
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#92400e",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: "#1e293b",
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    infoText: {
        fontSize: 15,
        color: "#1e293b",
        flex: 1,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 20,
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    primaryBtn: {
        backgroundColor: "#10b981",
    },
    secondaryBtn: {
        backgroundColor: "#eff6ff",
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    urgentBtn: {
        backgroundColor: "#ef4444",
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#fff",
    },
    closeBtn: {
        marginTop: 8,
        marginHorizontal: 20,
        paddingVertical: 14,
        alignItems: "center",
    },
    closeBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
});
