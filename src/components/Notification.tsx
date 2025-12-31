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
    success: "bg-green-500/20 border-green-500/50 text-green-300",
    error: "bg-red-500/20 border-red-500/50 text-red-300",
    warning: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
    info: "bg-blue-500/20 border-blue-500/50 text-blue-300",
  };

  const Icon = icons[notification.type];
  const colorClass = colors[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${colorClass} border rounded-[12px] p-4 mb-3 backdrop-blur-glass shadow-lg flex items-start gap-3 transition-all duration-300`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">{notification.message}</div>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0"
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
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => handleClose(notification.id)}
        />
      ))}
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
