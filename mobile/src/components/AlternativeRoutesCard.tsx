import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AlternativeRoute } from "../services/routing";

type Props = {
    routes: AlternativeRoute[];
    selectedIndex: number;
    onSelectRoute: (index: number) => void;
};

export function AlternativeRoutesCard({ routes, selectedIndex, onSelectRoute }: Props) {
    if (routes.length === 0) return null;

    const formatDistance = (meters: number) => {
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
        return `${Math.round(meters)}m`;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.round(seconds / 60);
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            return `${hrs}h${m}min`;
        }
        return `${mins}min`;
    };

    const renderStars = (score: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Ionicons
                key={i}
                name={i < score ? "star" : "star-outline"}
                size={12}
                color="#f59e0b"
            />
        ));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Rotas Alternativas ({routes.length})</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {routes.map((route, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.routeCard,
                            selectedIndex === index && styles.routeCardSelected
                        ]}
                        onPress={() => onSelectRoute(index)}
                    >
                        {/* Icon */}
                        <View style={[
                            styles.iconContainer,
                            selectedIndex === index && styles.iconContainerSelected
                        ]}>
                            <Ionicons
                                name={
                                    route.name === "Rápida" ? "flash" :
                                        route.name === "Segura" ? "shield-checkmark" :
                                            "resize"
                                }
                                size={20}
                                color={selectedIndex === index ? "#2563eb" : "#64748b"}
                            />
                        </View>

                        {/* Name & Description */}
                        <Text style={[
                            styles.routeName,
                            selectedIndex === index && styles.routeNameSelected
                        ]}>
                            {route.name}
                        </Text>
                        <Text style={styles.routeDesc}>{route.description}</Text>

                        {/* Stats */}
                        <View style={styles.stats}>
                            <View style={styles.stat}>
                                <Ionicons name="navigate" size={14} color="#64748b" />
                                <Text style={styles.statText}>{formatDistance(route.distance)}</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="time" size={14} color="#64748b" />
                                <Text style={styles.statText}>{formatTime(route.duration)}</Text>
                            </View>
                        </View>

                        {/* Safety Score */}
                        {route.safetyScore && (
                            <View style={styles.safety}>
                                <View style={styles.stars}>
                                    {renderStars(route.safetyScore)}
                                </View>
                                <Text style={styles.safetyText}>Segurança</Text>
                            </View>
                        )}

                        {/* Selected Badge */}
                        {selectedIndex === index && (
                            <View style={styles.selectedBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                <Text style={styles.selectedText}>Selecionada</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    scrollView: {
        marginHorizontal: -4,
    },
    scrollContent: {
        paddingHorizontal: 4,
        flexDirection: "row",
        gap: 12,
    },
    routeCard: {
        width: 170,
        minHeight: 200,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: "#e2e8f0",
    },
    routeCardSelected: {
        backgroundColor: "#eff6ff",
        borderColor: "#2563eb",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    iconContainerSelected: {
        backgroundColor: "#dbeafe",
    },
    routeName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#475569",
        marginBottom: 4,
    },
    routeNameSelected: {
        color: "#1e40af",
    },
    routeDesc: {
        fontSize: 11,
        color: "#94a3b8",
        marginBottom: 12,
    },
    stats: {
        gap: 6,
        marginBottom: 8,
    },
    stat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748b",
    },
    safety: {
        alignItems: "flex-start",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    stars: {
        flexDirection: "row",
        gap: 2,
        marginBottom: 4,
    },
    safetyText: {
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: "500",
    },
    selectedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#bfdbfe",
    },
    selectedText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#10b981",
    },
});
