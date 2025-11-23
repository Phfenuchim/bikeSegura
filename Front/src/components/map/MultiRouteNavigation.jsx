import React, { useState, useEffect } from "react";
import RouteNavigation from "./RouteNavigation";
import RouteQueue from "./RouteQueue";

export default function MultiRouteNavigation({
  routes,
  onClose,
  currentPosition,
  onRouteRecalculated,
  onCenterMap
}) {
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [activeRoutes, setActiveRoutes] = useState(routes);

  useEffect(() => {
    setActiveRoutes(routes);
  }, [routes]);

  const handleRouteComplete = () => {
    if (currentRouteIndex < activeRoutes.length - 1) {
      setCurrentRouteIndex(currentRouteIndex + 1);
      setRouteProgress(0);
    } else {
      // Todas as rotas concluídas
      onClose();
    }
  };

  const handleUpdateProgress = (progress) => {
    setRouteProgress(progress);
  };

  const handleRouteRecalculated = (newRoute, isSecondary) => {
    const updatedRoutes = [...activeRoutes];
    updatedRoutes[currentRouteIndex] = newRoute;
    setActiveRoutes(updatedRoutes);
    
    if (onRouteRecalculated) {
      onRouteRecalculated(newRoute, isSecondary);
    }
  };

  const currentRoute = activeRoutes[currentRouteIndex];

  return (
    <>
      <RouteQueue
        routes={activeRoutes}
        currentRouteIndex={currentRouteIndex}
        currentRouteProgress={routeProgress}
      />

      <RouteNavigation
        route={currentRoute}
        onClose={onClose}
        currentPosition={currentPosition}
        onRouteRecalculated={handleRouteRecalculated}
        onRouteComplete={handleRouteComplete}
        onProgressUpdate={handleUpdateProgress}
        onCenterMap={onCenterMap}
      />
    </>
  );
}