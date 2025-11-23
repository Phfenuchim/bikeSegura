import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Award, MapPin, CheckCircle, Megaphone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const notificationIcons = {
  sos_alert: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  route_incident: { icon: MapPin, color: "text-orange-600", bg: "bg-orange-100" },
  badge_earned: { icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
  sos_resolved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  community_update: { icon: Megaphone, color: "text-blue-600", bg: "bg-blue-100" },
};

const priorityStyles = {
  critica: "border-l-4 border-red-500 bg-red-50",
  alta: "border-l-4 border-orange-500 bg-orange-50",
  media: "border-l-4 border-blue-500",
  baixa: "border-l-4 border-gray-400",
};

export default function NotificationList({ notifications, onMarkAsRead, onClose }) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Nenhuma notificação</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Notificações</h3>
          <Link to={createPageUrl("Configuracoes")} onClick={onClose}>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {notifications.map((notification) => {
            const iconConfig = notificationIcons[notification.type] || notificationIcons.community_update;
            const Icon = iconConfig.icon;

            return (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50' : ''
                } ${priorityStyles[notification.priority] || ''}`}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                  if (notification.action_url) {
                    window.location.href = notification.action_url;
                  }
                  onClose();
                }}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${iconConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(notification.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}