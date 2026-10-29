import { AppDispatch } from '@/store';
import { Fetch } from '@/utils/api';
import { showFeedback } from '@/store/reducers/feedback';
import { fetchTeamInvites, fetchTeamMembers } from '@/store/slices/teams';

// POST /teams/send-invite takes an array of { email, project, role }.
// Existing company members are added directly; everyone else gets an invite email.
export const sendInvites =
  (emails: string[], project: string, role: string) => async (dispatch: AppDispatch) => {
    const { success, message, data } = await Fetch({
      path: '/teams/send-invite',
      method: 'POST',
      body: emails.map((email) => ({ email, project, role })) as any,
    });

    const failed = data?.summary?.failed ?? 0;

    dispatch(showFeedback({
      feedbackType: 'notification',
      type: success ? 'success' : 'error',
      message: message || (success ? 'Invitations sent.' : 'Could not send the invitations.'),
    }));

    if (success && failed) {
      dispatch(showFeedback({
        feedbackType: 'notification',
        type: 'warning',
        message: `Invitation failed for ${failed} of your invitees.`,
      }));
    }

    if (success) {
      dispatch(fetchTeamInvites() as any);
      dispatch(fetchTeamMembers() as any);
    }
    return success;
  };
