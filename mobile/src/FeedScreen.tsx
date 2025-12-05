import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFeed } from "./modules/feed/useFeed";

export function FeedScreen() {
    const { posts, isLoading, refresh, createPost, isCreating } = useFeed();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        await createPost(newPostContent);
        setNewPostContent("");
        setShowCreateModal(false);
    };

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Agora";
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
        return `${Math.floor(diffMins / 1440)}d atrás`;
    };

    return (
        <View style={styles.container}>
            {/* Posts List */}
            {isLoading && posts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Carregando feed...</Text>
                </View>
            ) : posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
                    <Text style={styles.emptyText}>Seja o primeiro a compartilhar!</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.postCard}>
                            <View style={styles.postHeader}>
                                <View style={styles.userAvatar}>
                                    <Ionicons name="person" size={20} color="#64748b" />
                                </View>
                                <View style={styles.postMeta}>
                                    <Text style={styles.userName}>Usuário #{item.user_id || "Anônimo"}</Text>
                                    <Text style={styles.postTime}>{formatDate(item.created_at)}</Text>
                                </View>
                            </View>
                            <Text style={styles.postContent}>{item.content}</Text>
                            <View style={styles.postActions}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="heart-outline" size={20} color="#64748b" />
                                    <Text style={styles.actionText}>Curtir</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
                                    <Text style={styles.actionText}>Comentar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Create Post Modal */}
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
                                <Text style={styles.modalTitle}>Novo Post</Text>
                                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.textInput}
                                placeholder="O que você quer compartilhar?"
                                value={newPostContent}
                                onChangeText={setNewPostContent}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                autoFocus
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, (!newPostContent.trim() || isCreating) && styles.submitBtnDisabled]}
                                onPress={handleCreatePost}
                                disabled={!newPostContent.trim() || isCreating}
                            >
                                {isCreating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Publicar</Text>
                                )}
                            </TouchableOpacity>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0f172a",
    },
    createBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
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
    postCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    postMeta: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0f172a",
    },
    postTime: {
        fontSize: 12,
        color: "#94a3b8",
    },
    postContent: {
        fontSize: 14,
        color: "#334155",
        lineHeight: 20,
    },
    postActions: {
        flexDirection: "row",
        gap: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
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
        minHeight: 300,
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
    textInput: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: "#0f172a",
        minHeight: 120,
        marginBottom: 20,
    },
    submitBtn: {
        backgroundColor: "#2563eb",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
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
