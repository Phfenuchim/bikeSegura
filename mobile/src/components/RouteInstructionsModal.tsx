import { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteStep } from "../services/routing";

type Props = {
    visible: boolean;
    onClose: () => void;
    steps: RouteStep[];
    currentStepIndex: number;
};

export function RouteInstructionsModal({ visible, onClose, steps, currentStepIndex }: Props) {
    const getStepIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            "turn-left": "arrow-back",
            "turn-right": "arrow-forward",
            "turn-sharp-left": "return-up-back",
            "turn-sharp-right": "return-up-forward",
            "turn-slight-left": "arrow-back",
            "turn-slight-right": "arrow-forward",
            "straight": "arrow-up",
            "uturn": "return-down-back",
            "roundabout": "sync",
            "arrive": "flag",
            "depart": "play",
        };

        return iconMap[type] || "navigate";
    };

    const formatDistance = (meters: number): string => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Instruções da Rota</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={steps}
                        keyExtractor={(_, index) => `step-${index}`}
                        renderItem={({ item, index }) => {
                            const isCurrent = index === currentStepIndex;
                            const isPassed = index < currentStepIndex;

                            return (
                                <View
                                    style={[
                                        styles.stepItem,
                                        isCurrent && styles.stepItemCurrent,
                                        isPassed && styles.stepItemPassed,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.stepNumber,
                                            isCurrent && styles.stepNumberCurrent,
                                            isPassed && styles.stepNumberPassed,
                                        ]}
                                    >
                                        {isPassed ? (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        ) : (
                                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                                        )}
                                    </View>

                                    <View style={styles.stepIconContainer}>
                                        <Ionicons
                                            name={getStepIcon(item.type)}
                                            size={24}
                                            color={isCurrent ? "#2563eb" : isPassed ? "#94a3b8" : "#64748b"}
                                        />
                                    </View>

                                    <View style={styles.stepContent}>
                                        <Text
                                            style={[
                                                styles.stepInstruction,
                                                isCurrent && styles.stepInstructionCurrent,
                                                isPassed && styles.stepInstructionPassed,
                                            ]}
                                        >
                                            {item.instruction}
                                        </Text>
                                        <Text style={styles.stepDistance}>{formatDistance(item.distance)}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                    />
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
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    stepItemCurrent: {
        backgroundColor: "#eff6ff",
        borderWidth: 2,
        borderColor: "#2563eb",
    },
    stepItemPassed: {
        backgroundColor: "#f1f5f9",
        opacity: 0.7,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#cbd5e1",
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberCurrent: {
        backgroundColor: "#2563eb",
    },
    stepNumberPassed: {
        backgroundColor: "#10b981",
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
    },
    stepIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    stepContent: {
        flex: 1,
    },
    stepInstruction: {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 4,
    },
    stepInstructionCurrent: {
        color: "#1e40af",
        fontWeight: "700",
    },
    stepInstructionPassed: {
        color: "#94a3b8",
    },
    stepDistance: {
        fontSize: 12,
        color: "#94a3b8",
    },
});
