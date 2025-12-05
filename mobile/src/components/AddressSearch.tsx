import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SearchResult = {
    latitude: number;
    longitude: number;
    name: string;
    distance?: number; // Distance in km
};

type Props = {
    onSelect: (result: SearchResult) => void;
    placeholder?: string;
    userLocation?: { latitude: number; longitude: number } | null;
};

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
}

export function AddressSearch({ onSelect, placeholder = "Buscar endereço...", userLocation }: Props) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=br`
            );
            const data = await response.json();

            const parsed: SearchResult[] = data.map((item: any) => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);

                let distance: number | undefined;
                if (userLocation) {
                    distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        lat,
                        lon
                    );
                }

                return {
                    latitude: lat,
                    longitude: lon,
                    name: item.display_name,
                    distance,
                };
            });

            // Sort by distance if available
            if (userLocation) {
                parsed.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            setResults(parsed);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="search" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {results.length > 0 && (
                <FlatList
                    data={results}
                    style={styles.resultsList}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.resultItem}
                            onPress={() => {
                                onSelect(item);
                                setResults([]);
                                setQuery("");
                            }}
                        >
                            <Ionicons name="location" size={20} color="#2563eb" />
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultText} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                {item.distance !== undefined && (
                                    <Text style={styles.distanceText}>
                                        📍 {formatDistance(item.distance)} de você
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: "row",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: "#2563eb",
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    resultsList: {
        maxHeight: 200,
        marginTop: 8,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    resultInfo: {
        flex: 1,
    },
    resultText: {
        fontSize: 13,
        color: "#334155",
        marginBottom: 4,
    },
    distanceText: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "500",
    },
});
