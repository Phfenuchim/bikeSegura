import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NavigationRoute } from "../services/routing";

type Props = {
    route: NavigationRoute;
    incidentsNearby?: number;
    supportPointsCount?: number;
};

export function RouteStats({ route, incidentsNearby = 0, supportPointsCount = 0 }: Props) {
    const formatDistance = (meters: number) => {
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
        return `${Math.round(meters)} m`;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.round(seconds / 60);
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            return `${hrs}h ${m}min`;
        }
        return `${mins} min`;
    };

    const renderStars = (score: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Ionicons
                key={i}
                name={i < score ? "star" : "star-outline"}
                size={16}
                color="#f59e0b"
            />
        ));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Estatísticas da Rota</Text>

            <View style={styles.grid}>
                {/* Distance */}
                <View style={styles.statCard}>
                    <Ionicons name="navigate" size={24} color="#2563eb" />
                    <Text style={styles.statValue}>{formatDistance(route.distance)}</Text>
                    <Text style={styles.statLabel}>Distância</Text>
                </View>

                {/* Duration */}
                <View style={styles.statCard}>
                    <Ionicons name="time" size={24} color="#10b981" />
                    <Text style={styles.statValue}>{formatTime(route.duration)}</Text>
                    <Text style={styles.statLabel}>Tempo Est.</Text>
                </View>

                {/* Safety Score */}
                {route.safetyScore && (
                    <View style={styles.statCard}>
                        <View style={styles.stars}>
                            {renderStars(route.safetyScore)}
                        </View>
                        <Text style={styles.statLabel}>Segurança</Text>
                    </View>
                )}

                {/* Support Points */}
                {supportPointsCount > 0 && (
                    <View style={styles.statCard}>
                        <Ionicons name="business" size={24} color="#8b5cf6" />
                        <Text style={styles.statValue}>{supportPointsCount}</Text>
                        <Text style={styles.statLabel}>Pt. Apoio</Text>
                    </View>
                )}

                {/* Incidents */}
                {incidentsNearby > 0 && (
                    <View style={[styles.statCard, styles.warningCard]}>
                        <Ionicons name="warning" size={24} color="#f59e0b" />
                        <Text style={styles.statValue}>{incidentsNearby}</Text>
                        <Text style={styles.statLabel}>Incidentes</Text>
                    </View>
                )}

                {/* Steps */}
                <View style={styles.statCard}>
                    <Ionicons name="list" size={24} color="#64748b" />
                    <Text style={styles.statValue}>{route.steps?.length || 0}</Text>
                    <Text style={styles.statLabel}>Instruções</Text>
                </View>
            </View>

            {/* Elevation (if available) */}
            {route.elevation && (
                <View style={styles.elevationCard}>
                    <Ionicons name="trending-up" size={20} color="#ef4444" />
                    <Text style={styles.elevationText}>
                        Desnível: <Text style={styles.elevationValue}>+{route.elevation}m</Text>
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 16,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: "30%",
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        gap: 8,
    },
    warningCard: {
        backgroundColor: "#fffbeb",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    statLabel: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "500",
        textAlign: "center",
    },
    stars: {
        flexDirection: "row",
        gap: 2,
    },
    elevationCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: "#fef2f2",
        borderRadius: 8,
    },
    elevationText: {
        fontSize: 14,
        color: "#64748b",
    },
    elevationValue: {
        fontWeight: "700",
        color: "#ef4444",
    },
});
