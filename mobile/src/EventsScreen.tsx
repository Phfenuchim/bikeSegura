import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEvents, RouteEvent } from "./modules/events/useEvents";

export function EventsScreen() {
    const { events, isLoading, refresh, createEvent, isCreating } = useEvents();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: "",
        description: "",
        start_date: new Date().toISOString(),
    });

    const handleCreateEvent = async () => {
        if (!newEvent.name.trim()) return;

        await createEvent({
            ...newEvent,
            start_lat: -23.5505,
            start_lng: -46.6333,
            end_lat: -23.5505,
            end_lng: -46.6333,
        });

        setNewEvent({ name: "", description: "", start_date: new Date().toISOString() });
        setShowCreateModal(false);
    };

    const formatEventDate = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const isUpcoming = (dateString: string) => {
        return new Date(dateString) > new Date();
    };

    return (
        <View style={styles.container}>
            {/* Events List */}
            {isLoading && events.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Carregando eventos...</Text>
                </View>
            ) : events.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Nenhum evento</Text>
                    <Text style={styles.emptyText}>Crie um evento ou aguarde novos pedais!</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.eventCard}>
                            <View style={styles.eventHeader}>
                                <View style={[
                                    styles.eventIcon,
                                    isUpcoming(item.start_date) ? styles.eventIconUpcoming : styles.eventIconPast
                                ]}>
                                    <Ionicons
                                        name={isUpcoming(item.start_date) ? "calendar" : "checkmark-circle"}
                                        size={24}
                                        color={isUpcoming(item.start_date) ? "#2563eb" : "#10b981"}
                                    />
                                </View>
                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventName}>{item.name}</Text>
                                    <Text style={styles.eventDate}>{formatEventDate(item.start_date)}</Text>
                                </View>
                                {isUpcoming(item.start_date) && (
                                    <View style={styles.upcomingBadge}>
                                        <Text style={styles.upcomingText}>Próximo</Text>
                                    </View>
                                )}
                            </View>

                            {item.description && (
                                <Text style={styles.eventDescription} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            )}

                            <View style={styles.eventFooter}>
                                <View style={styles.eventStat}>
                                    <Ionicons name="location" size={16} color="#64748b" />
                                    <Text style={styles.statText}>Local definido</Text>
                                </View>
                                <TouchableOpacity style={styles.joinBtn}>
                                    <Text style={styles.joinBtnText}>Participar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Create Event Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowCreateModal(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalContent}
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Novo Evento</Text>
                                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Nome do Evento *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Pedal no Ibirapuera"
                                    value={newEvent.name}
                                    onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
                                    autoFocus
                                />

                                <Text style={styles.label}>Descrição</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Detalhes do evento..."
                                    value={newEvent.description}
                                    onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    style={[styles.submitBtn, (!newEvent.name.trim() || isCreating) && styles.submitBtnDisabled]}
                                    onPress={handleCreateEvent}
                                    disabled={!newEvent.name.trim() || isCreating}
                                >
                                    {isCreating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Criar Evento</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Floating Create Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowCreateModal(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: "#64748b",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#475569",
    },
    emptyText: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    eventCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    eventHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    eventIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    eventIconUpcoming: {
        backgroundColor: "#dbeafe",
    },
    eventIconPast: {
        backgroundColor: "#d1fae5",
    },
    eventInfo: {
        flex: 1,
    },
    eventName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 13,
        color: "#64748b",
    },
    upcomingBadge: {
        backgroundColor: "#fef3c7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    upcomingText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#d97706",
    },
    eventDescription: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 20,
    },
    eventFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    eventStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        fontSize: 13,
        color: "#64748b",
    },
    joinBtn: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#fff",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: "#0f172a",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    textArea: {
        minHeight: 100,
    },
    submitBtn: {
        backgroundColor: "#2563eb",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    submitBtnDisabled: {
        backgroundColor: "#cbd5e1",
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
