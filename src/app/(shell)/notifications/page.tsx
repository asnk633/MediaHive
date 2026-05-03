import NotificationCenterClient from './NotificationCenterClient';

export const metadata = {
  title: 'Notifications | MediaHive',
  description: 'Manage your notifications and alerts.',
};

export default function NotificationPage() {
  return <NotificationCenterClient />;
}
