import { useState } from "react";

export function useMapFilters() {
    const [showIncidents, setShowIncidents] = useState(true);
    const [showSOS, setShowSOS] = useState(true);
    const [showSupport, setShowSupport] = useState(true);

    const toggleIncidents = () => setShowIncidents(prev => !prev);
    const toggleSOS = () => setShowSOS(prev => !prev);
    const toggleSupport = () => setShowSupport(prev => !prev);

    return {
        showIncidents,
        showSOS,
        showSupport,
        toggleIncidents,
        toggleSOS,
        toggleSupport,
    };
}
