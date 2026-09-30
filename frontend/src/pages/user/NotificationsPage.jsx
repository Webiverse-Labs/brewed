import { useState } from "react";
import { CircleCheck } from "lucide-react";
import toast from "react-hot-toast";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import NotificationItem from "../../components/user/NotificationItem.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";

const tabs = [
  { value: "all", label: "All" },
  { value: "cafe_update", label: "Café Updates" },
  { value: "system", label: "System" },
];

function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const { user, updateUser } = useAuth();
  const { data, loading, error, reload, setData } = useApi(
    filter === "all" ? "/notifications" : `/notifications?type=${filter}`,
  );
  const notifications = data?.notifications ?? [];

  //keep the list and the navbar dot in step with the server's unread count
  const applyRead = (isRead, unread) => {
    setData((d) => d && { ...d, notifications: d.notifications.map((n) => (isRead(n) ? { ...n, read: true } : n)) });
    updateUser({ unreadNotifications: unread });
  };

  const markAllRead = async () => {
    try {
      const { data: res } = await api.patch("/notifications/read-all");
      applyRead(() => true, res.unread);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const markRead = async (id) => {
    if (notifications.find((n) => n.id === id)?.read) return;
    try {
      const { data: res } = await api.patch(`/notifications/${id}/read`);
      applyRead((n) => n.id === id, res.unread);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Page width="narrow">
      <PageTitle
        title="Notifications"
        action={
          <Button
            variant="accentSoft"
            size="sm"
            shape="pill"
            onClick={markAllRead}
            disabled={!user.unreadNotifications}
            className="mt-1"
          >
            <CircleCheck size={15} /> Mark all as read
          </Button>
        }
      />
      <FilterTabs tabs={tabs} value={filter} onChange={setFilter} label="Filter notifications" className="-mt-2 mb-6" />

      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : notifications.length === 0 ? (
        <EmptyState>You're all caught up.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationItem notification={n} onRead={markRead} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export default NotificationsPage;
