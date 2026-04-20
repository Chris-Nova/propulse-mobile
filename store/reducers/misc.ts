import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalyticsState, DocumentState, CompanyState, AppState, ModalState, ModalTypes, IndustryModes } from '@/types';

// Analytics
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { analytics: {} } as AnalyticsState,
  reducers: {
    setAnalytics: (state, action: PayloadAction<any>) => {
      state.analytics = action.payload;
    },
    setActiveChartMonthIndex: (state, action: PayloadAction<number | undefined>) => {
      state.activeChartMonthIndex = action.payload;
    },
  },
});
export const { setAnalytics, setActiveChartMonthIndex } = analyticsSlice.actions;
export const analyticsReducer = analyticsSlice.reducer;

// Documents
const documentSlice = createSlice({
  name: 'document',
  initialState: { documents: [] } as DocumentState,
  reducers: {
    setDocuments: (state, action: PayloadAction<any[]>) => {
      state.documents = action.payload;
    },
  },
});
export const { setDocuments } = documentSlice.actions;
export const documentReducer = documentSlice.reducer;

// Company
const companySlice = createSlice({
  name: 'company',
  initialState: { model: { username: '', name: '' }, company: undefined } as CompanyState,
  reducers: {
    setCompany: (state, action: PayloadAction<any>) => {
      state.company = action.payload;
    },
    updateCompanyModel: (state, action: PayloadAction<Partial<CompanyState['model']>>) => {
      state.model = { ...state.model, ...action.payload };
    },
  },
});
export const { setCompany, updateCompanyModel } = companySlice.actions;
export const companyReducer = companySlice.reducer;

// App
const appSlice = createSlice({
  name: 'app',
  initialState: {
    industryMode: 'standard' as IndustryModes,
    theme: 'dark',
    isSystemTheme: true,
  } as AppState,
  reducers: {
    setTheme: (state, action: PayloadAction<AppState['theme']>) => {
      state.theme = action.payload;
    },
    setIndustryMode: (state, action: PayloadAction<IndustryModes>) => {
      state.industryMode = action.payload;
    },
  },
});
export const { setTheme, setIndustryMode } = appSlice.actions;
export const appReducer = appSlice.reducer;

// Modal
const modalSlice = createSlice({
  name: 'modal',
  initialState: { target: '', isLoading: false, data: {} } as ModalState,
  reducers: {
    updateModal: (state, action: PayloadAction<Partial<ModalState>>) => {
      return { ...state, ...action.payload };
    },
    closeModal: (state) => {
      state.target = '';
      state.data = {};
      state.isLoading = false;
    },
  },
});
export const { updateModal, closeModal } = modalSlice.actions;
export const modalReducer = modalSlice.reducer;
