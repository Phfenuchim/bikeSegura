import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Waypoint = {
    latitude: number;
    longitude: number;
    name: string;
};

type Props = {
    origin: Waypoint | null;
    destination: Waypoint | null;
    waypoints: Waypoint[];
    onRemoveWaypoint: (index: number) => void;
    onReorderWaypoint: (fromIndex: number, toIndex: number) => void;
    onReverseRoute: () => void;
    onAddWaypoint: () => void;
    onEditName: (index: number, type: "origin" | "waypoint" | "destination") => void;
};

export function WaypointManager({
    origin,
    destination,
    waypoints,
    onRemoveWaypoint,
    onReorderWaypoint,
    onReverseRoute,
    onAddWaypoint,
    onEditName,
}: Props) {
    const renderPoint = (
        point: Waypoint,
        index: number,
        type: "origin" | "waypoint" | "destination"
    ) => {
        const isFirst = type === "origin";
        const isLast = type === "destination";
        const canMoveUp = type === "waypoint" && index > 0;
        const canMoveDown = type === "waypoint" && index < waypoints.length - 1;

        return (
            <View key={`${type}-${index}`} style={styles.pointContainer}>
                {/* Connection line */}
                {!isFirst && <View style={styles.connectionLine} />}

                <View style={styles.pointRow}>
                    {/* Icon */}
                    <View
                        style={[
                            styles.pointIcon,
                            isFirst && styles.originIcon,
                            isLast && styles.destinationIcon,
                            type === "waypoint" && styles.waypointIcon,
                        ]}
                    >
                        <Ionicons
                            name={isFirst ? "location" : isLast ? "flag" : "ellipse"}
                            size={isFirst || isLast ? 20 : 12}
                            color="#fff"
                        />
                    </View>

                    {/* Name */}
                    <TouchableOpacity
                        style={styles.pointInfo}
                        onPress={() => onEditName(index, type)}
                    >
                        <Text style={styles.pointLabel}>
                            {isFirst ? "Origem" : isLast ? "Destino" : `Parada ${index + 1}`}
                        </Text>
                        <Text style={styles.pointName} numberOfLines={1}>
                            {point.name}
                        </Text>
                    </TouchableOpacity>

                    {/* Actions */}
                    <View style={styles.pointActions}>
                        {type === "waypoint" && (
                            <>
                                {canMoveUp && (
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => onReorderWaypoint(index, index - 1)}
                                    >
                                        <Ionicons name="chevron-up" size={18} color="#64748b" />
                                    </TouchableOpacity>
                                )}
                                {canMoveDown && (
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => onReorderWaypoint(index, index + 1)}
                                    >
                                        <Ionicons name="chevron-down" size={18} color="#64748b" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.removeBtn]}
                                    onPress={() => onRemoveWaypoint(index)}
                                >
                                    <Ionicons name="close" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pontos da Rota</Text>
                <TouchableOpacity style={styles.reverseBtn} onPress={onReverseRoute}>
                    <Ionicons name="swap-vertical" size={20} color="#2563eb" />
                    <Text style={styles.reverseBtnText}>Inverter</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.pointsList} showsVerticalScrollIndicator={false}>
                {origin && renderPoint(origin, 0, "origin")}

                {waypoints.map((wp, idx) => renderPoint(wp, idx, "waypoint"))}

                {destination && renderPoint(destination, 0, "destination")}

                {/* Connection line to last point */}
                {destination && <View style={styles.connectionLine} />}
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={onAddWaypoint}>
                <Ionicons name="add-circle" size={20} color="#2563eb" />
                <Text style={styles.addBtnText}>Adicionar Parada</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
    },
    reverseBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#eff6ff",
        borderRadius: 8,
    },
    reverseBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2563eb",
    },
    pointsList: {
        maxHeight: 400,
        paddingHorizontal: 16,
    },
    pointContainer: {
        position: "relative",
    },
    connectionLine: {
        position: "absolute",
        left: 19,
        top: 0,
        width: 2,
        height: "100%",
        backgroundColor: "#cbd5e1",
    },
    pointRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        zIndex: 1,
    },
    pointIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    originIcon: {
        backgroundColor: "#10b981",
    },
    waypointIcon: {
        backgroundColor: "#f59e0b",
    },
    destinationIcon: {
        backgroundColor: "#ef4444",
    },
    pointInfo: {
        flex: 1,
    },
    pointLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 2,
    },
    pointName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
    },
    pointActions: {
        flexDirection: "row",
        gap: 4,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    removeBtn: {
        backgroundColor: "#fee2e2",
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    addBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2563eb",
    },
});
