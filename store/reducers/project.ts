import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectState, Milestone } from '@/types';

const milestoneModel: Milestone = {
  enable_feedback: false,
  is_completed: false,
  subtasks: [],
  progress: 0,
  name: '',
  id: '',
};

const projectModel: Project = {
  status: 'pending',
  client_email: '',
  client_name: '',
  owner_email: '',
  owner_name: '',
  milestones: [],
  progress: 0,
  members: [],
  files: [],
  name: '',
  id: '',
};

const initialState: ProjectState = {
  isUploadingFiles: false,
  model: projectModel,
  project: undefined,
  milestoneModel,
  projects: [],
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    updateMilestoneModel: (state, action: PayloadAction<Partial<Milestone>>) => {
      state.milestoneModel = { ...state.milestoneModel, ...action.payload };
    },
    updateProjectModel: (state, action: PayloadAction<Partial<Project>>) => {
      state.model = { ...state.model, ...action.payload };
    },
    setProject: (state, action: PayloadAction<Project | undefined>) => {
      state.project = action.payload;
    },
    setProjectModel: (state, action: PayloadAction<Project>) => {
      state.model = action.payload;
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setModelFiles: (state, action: PayloadAction<Project['files']>) => {
      state.model.files = action.payload;
    },
    setIsUploadingFiles: (state, action: PayloadAction<boolean>) => {
      state.isUploadingFiles = action.payload;
    },
    resetProjectModel: (state) => {
      state.model = projectModel;
    },
    resetMilestoneModel: (state) => {
      state.milestoneModel = milestoneModel;
    },
  },
});

export const {
  updateMilestoneModel,
  resetMilestoneModel,
  setIsUploadingFiles,
  updateProjectModel,
  resetProjectModel,
  setProjectModel,
  setModelFiles,
  setProjects,
  setProject,
} = projectSlice.actions;

export default projectSlice.reducer;
