import { router } from 'expo-router';
import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import {
  setProjects,
  setProject,
  setProjectModel,
  resetProjectModel,
} from '@/store/reducers/project';

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

export const fetchProjects = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchProjects'));
  const { success, message, data } = await Fetch({ path: '/projects/list' });
  dispatch(finishAsyncAction({ target: 'fetchProjects', success, message }) as any);
  if (success) dispatch(setProjects(data ?? []));
};

export const fetchProject = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchProject'));
  const { success, message, data } = await Fetch({ path: `/projects/${projectId}` });
  dispatch(finishAsyncAction({ target: 'fetchProject', success, message }) as any);
  if (success) dispatch(setProject(data));
  return success;
};

export const createProject = () => async (dispatch: AppDispatch) => {
  const { model } = store.getState().project;
  dispatch(startAsyncAction('createProject'));

  const { success, message, data } = await Fetch({
    path: '/projects/create',
    method: 'POST',
    body: model as any,
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'createProject',
    success,
    message,
  }) as any);

  if (success && data) {
    dispatch(resetProjectModel());
    router.replace(`/(app)/projects/${data.id}`);
  }

  return success;
};

export const updateProject = (projectId: string) => async (dispatch: AppDispatch) => {
  const { model } = store.getState().project;
  dispatch(startAsyncAction('updateProject'));

  const { success, message, data } = await Fetch({
    path: `/projects/${projectId}`,
    method: 'PATCH',
    body: model as any,
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'updateProject',
    success,
    message,
  }) as any);

  if (success && data) {
    dispatch(setProject(data));
  }

  return success;
};

export const deleteProject = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('deleteProject'));

  const { success, message } = await Fetch({
    path: `/projects/${projectId}`,
    method: 'DELETE',
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'deleteProject',
    success,
    message,
  }) as any);

  if (success) {
    await dispatch(fetchProjects() as any);
    router.replace('/(app)/projects');
  }

  return success;
};

// ─── Subtask toggle ───────────────────────────────────────
interface UpdateProjectSubtask {
  milestoneId: string;
  subtask: import('@/types').Subtask;
}

const roundNumber = (n: number) => Math.round(n * 100) / 100;

export const updateProjectSubtask = (props: UpdateProjectSubtask) => async (dispatch: AppDispatch) => {
  const { project } = store.getState().project;
  const { milestoneId, subtask } = props;
  if (!project) return;

  let completedProjectSubtasks = 0;
  let totalProjectSubtasks = 0;

  const milestones = project.milestones.map((milestone) => {
    const newMilestone = { ...milestone };

    if (milestone.id === milestoneId) {
      newMilestone.subtasks = milestone.subtasks.map((task) =>
        task.id === subtask.id ? { ...task, ...subtask } : task
      );
    }

    const completed = newMilestone.subtasks.filter((t) => t.status === 'completed').length;
    const total = newMilestone.subtasks.length;
    const progress = total ? roundNumber((completed / total) * 100) : 0;

    if (progress === 100) newMilestone.completed_at = new Date().toISOString();
    newMilestone.is_completed = progress === 100;
    newMilestone.progress = progress;

    completedProjectSubtasks += completed;
    totalProjectSubtasks += total;

    return newMilestone;
  });

  const newProgress = totalProjectSubtasks
    ? roundNumber((completedProjectSubtasks / totalProjectSubtasks) * 100)
    : 0;

  const newProject = {
    ...project,
    milestones,
    progress: newProgress,
    status: newProgress === 100 ? 'completed' : project.status,
  };

  // Optimistic update locally
  dispatch(setProject(newProject));

  // Persist to API
  await dispatch(updateProject(newProject.id) as any);
};
