import { serverRedirect } from '@/lib/server-redirect';

export default function CalendarPage() {
  serverRedirect('/events');
}
