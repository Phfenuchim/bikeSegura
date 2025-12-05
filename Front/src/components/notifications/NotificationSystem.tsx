import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function NotificationSystem() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts-notifications'],
    queryFn: () => base44.entities.SOSAlert.filter({ status: 'ativo' }, '-created_date'),
    refetchInterval: 15000,
    enabled: !!user?.notification_preferences?.sos_alerts,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-notifications'],
    queryFn: () => base44.entities.Incident.filter({ status: 'ativo' }, '-created_date'),
    refetchInterval: 30000,
    enabled: !!user?.notification_preferences?.incident_alerts,
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events-notifications'],
    queryFn: async () => {
      const allEvents = await base44.entities.RouteEvent.filter({ status: 'agendado' });
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      return allEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate > now && eventDate <= oneHourFromNow &&
               event.participants?.some(p => p.user_email === user?.email);
      });
    },
    refetchInterval: 300000,
    enabled: !!user?.notification_preferences?.event_reminders,
  });

  useEffect(() => {
    if (!user || !navigator.geolocation) return;

    const checkProximityAlerts = async (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const prefs = user.notification_preferences || {};

      if (prefs.sos_alerts && sosAlerts.length > 0) {
        const sosRadius = prefs.sos_radius_km || 5;
        const nearbySOS = sosAlerts.filter(sos => {
          const distance = calculateDistance(userLat, userLon, sos.latitude, sos.longitude);
          return distance <= sosRadius;
        });

        if (nearbySOS.length > 0 && "Notification" in window && Notification.permission === "granted") {
          nearbySOS.forEach(sos => {
            const distance = calculateDistance(userLat, userLon, sos.latitude, sos.longitude);
            new Notification("🚨 Alerta SOS Próximo!", {
              body: `${sos.user_name || 'Ciclista'} precisa de ajuda a ${distance.toFixed(1)}km de você!`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: `sos-${sos.id}`,
              requireInteraction: true,
            });
          });
        }
      }

      if (prefs.incident_alerts && incidents.length > 0) {
        const incidentRadius = prefs.incident_radius_km || 2;
        const nearbyIncidents = incidents.filter(incident => {
          const distance = calculateDistance(userLat, userLon, incident.latitude, incident.longitude);
          return distance <= incidentRadius;
        });

        if (nearbyIncidents.length > 0 && "Notification" in window && Notification.permission === "granted") {
          nearbyIncidents.slice(0, 1).forEach(incident => {
            const distance = calculateDistance(userLat, userLon, incident.latitude, incident.longitude);
            new Notification("⚠️ Incidente Próximo", {
              body: `${incident.type} detectado a ${(distance * 1000).toFixed(0)}m`,
              icon: "/favicon.ico",
              tag: `incident-${incident.id}`,
            });
          });
        }
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      checkProximityAlerts,
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, sosAlerts, incidents]);

  useEffect(() => {
    if (!user?.notification_preferences?.event_reminders || upcomingEvents.length === 0) return;

    if ("Notification" in window && Notification.permission === "granted") {
      upcomingEvents.forEach(event => {
        new Notification("📅 Evento em Breve!", {
          body: `O evento "${event.name}" começa em menos de 1 hora!`,
          icon: "/favicon.ico",
          tag: `event-${event.id}`,
        });
      });
    }
  }, [upcomingEvents, user]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
