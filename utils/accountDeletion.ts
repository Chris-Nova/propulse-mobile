import { Fetch } from '@/utils/api';

// What the account owns, so the person can see what deleting it costs.
export interface DeletionPreview {
  owned_projects: { id: string; name: string; members: { id: string; name: string; email: string; role: string }[] }[];
  member_projects: { id: string; name: string }[];
  deletion_grace_days: number;
}

// GET /users/delete-account
export const getDeletionPreview = async (): Promise<{ data: DeletionPreview | null; message: string }> => {
  const { success, data, message } = await Fetch({ path: '/users/delete-account' });
  return { data: success && data ? (data as DeletionPreview) : null, message };
};

// POST /users/delete-account { password }. Soft-deletes the account (a grace period applies)
// and signs out every session. Accounts with a password must send it; the server answers
// `incorrect_current_password` when it is missing or wrong.
export const requestAccountDeletion = async (password: string) => {
  const { success, message, code } = await Fetch({
    path: '/users/delete-account',
    method: 'POST',
    body: { password },
  });
  return { success, message, code };
};
