import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FeedScreen } from "./FeedScreen";
import { EventsScreen } from "./EventsScreen";

export function ComunidadeScreen() {
    const [activeTab, setActiveTab] = useState<"feed" | "events">("feed");

    return (
        <SafeAreaView style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "feed" && styles.tabActive]}
                    onPress={() => setActiveTab("feed")}
                >
                    <Ionicons
                        name="chatbubbles"
                        size={20}
                        color={activeTab === "feed" ? "#2563eb" : "#64748b"}
                    />
                    <Text style={[styles.tabText, activeTab === "feed" && styles.tabTextActive]}>
                        Feed
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === "events" && styles.tabActive]}
                    onPress={() => setActiveTab("events")}
                >
                    <Ionicons
                        name="calendar"
                        size={20}
                        color={activeTab === "events" ? "#2563eb" : "#64748b"}
                    />
                    <Text style={[styles.tabText, activeTab === "events" && styles.tabTextActive]}>
                        Eventos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === "feed" ? <FeedScreen /> : <EventsScreen />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: "#2563eb",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    tabTextActive: {
        color: "#2563eb",
    },
});
