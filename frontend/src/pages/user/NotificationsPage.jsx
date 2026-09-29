import { useState } from "react";
import { CircleCheck } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import NotificationItem from "../../components/user/NotificationItem.jsx";
import { notifications } from "../../data/mock.js";

const tabs = [
  { value: "all", label: "All" },
  { value: "cafe_update", label: "Café Updates" },
  { value: "system", label: "System" },
];

function NotificationsPage() {
  // TODO(api): GET /api/notifications?type=, PATCH /api/notifications/read-all
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState("all");

  const shown = filter === "all" ? items : items.filter((n) => n.type === filter);
  const hasUnread = items.some((n) => !n.read);

  const markAllRead = () => setItems((all) => all.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setItems((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <Page width="narrow">
      <PageTitle
        title="Notifications"
        action={
          <Button variant="accentSoft" size="sm" shape="pill" onClick={markAllRead} disabled={!hasUnread} className="mt-1">
            <CircleCheck size={15} /> Mark all as read
          </Button>
        }
      />
      <FilterTabs tabs={tabs} value={filter} onChange={setFilter} label="Filter notifications" className="-mt-2 mb-6" />

      {shown.length === 0 ? (
        <EmptyState>You're all caught up.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((n) => (
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
