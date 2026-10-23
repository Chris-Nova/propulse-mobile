import { Dashboard } from '@/components/dashboard/Dashboard';

// No SafeAreaView/background wrapper here: Dashboard paints its own themed
// background and handles the status-bar inset.
export default function DashboardPage() {
  return <Dashboard />;
}
