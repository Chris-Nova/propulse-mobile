import { Fetch } from '@/utils/api';

export interface Activity {
  project_name: string | null;
  project_id: string | null;
  activity_type?: string;
  description: string;
  created_at: string;
  timestamp?: string;
  type?: string;
  id: string;
}

// Recent activity feed (GET /users/recent-activities). Returned directly rather than
// stored in Redux, since only the dashboard shows it.
export const fetchRecentActivities = async (): Promise<Activity[]> => {
  const { success, data } = await Fetch({ path: '/users/recent-activities' });
  return success && Array.isArray(data?.activities) ? data.activities : [];
};
