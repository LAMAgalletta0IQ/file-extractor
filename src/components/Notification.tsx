import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "border-green-500/60 text-green-200",
    error: "border-red-500/60 text-red-200",
    warning: "border-yellow-500/60 text-yellow-200",
    info: "border-blue-500/60 text-blue-200",
  };

  const Icon = icons[notification.type];
  const colorClass = colors[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${colorClass} border rounded-xl p-4 mb-3 backdrop-blur-md shadow-2xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-right-5 fade-in`}
      style={{
        backgroundColor: notification.type === 'success' ? 'rgba(34, 197, 94, 0.15)' :
                         notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' :
                         notification.type === 'warning' ? 'rgba(234, 179, 8, 0.15)' :
                         'rgba(59, 130, 246, 0.15)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium leading-relaxed">{notification.message}</div>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition-colors flex-shrink-0 hover:bg-white/10 rounded p-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const showNotification = (event: CustomEvent<Omit<Notification, "id">>) => {
      const id = Math.random().toString(36).substring(7);
      setNotifications((prev) => [...prev, { ...event.detail, id }]);
    };

    const hideNotification = (event: CustomEvent<string>) => {
      setNotifications((prev) => prev.filter((n) => n.id !== event.detail));
    };

    window.addEventListener(
      "show-notification",
      showNotification as EventListener
    );
    window.addEventListener(
      "hide-notification",
      hideNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "show-notification",
        showNotification as EventListener
      );
      window.removeEventListener(
        "hide-notification",
        hideNotification as EventListener
      );
    };
  }, []);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className="flex flex-col-reverse pointer-events-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => handleClose(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function showNotification(
  message: string,
  type: NotificationType = "info"
) {
  const event = new CustomEvent("show-notification", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}
