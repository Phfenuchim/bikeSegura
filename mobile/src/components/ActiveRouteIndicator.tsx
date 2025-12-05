import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    routeName: string;
    distance: string;
    timeRemaining: string;
    progress: number; // 0-100
    isNavigating: boolean;
    onExpand: () => void;
    onPause: () => void;
};

export function ActiveRouteIndicator({
    routeName,
    distance,
    timeRemaining,
    progress,
    isNavigating,
    onExpand,
    onPause,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            onExpand();
        }
    };

    if (!isNavigating) return null;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpand}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="navigate" size={20} color="#2563eb" />
                </View>

                <View style={styles.info}>
                    <Text style={styles.routeName} numberOfLines={1}>
                        {routeName}
                    </Text>
                    <View style={styles.stats}>
                        <Text style={styles.stat}>{distance}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.stat}>{timeRemaining}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onPause();
                        }}
                    >
                        <Ionicons name="pause" size={18} color="#64748b" />
                    </TouchableOpacity>

                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#64748b"
                    />
                </View>
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
    },
    routeName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    stats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    stat: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
    separator: {
        fontSize: 13,
        color: "#cbd5e1",
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    progressContainer: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    progressBar: {
        height: 4,
        backgroundColor: "#e2e8f0",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#10b981",
        borderRadius: 2,
    },
});
