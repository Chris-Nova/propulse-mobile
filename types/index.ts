
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  avatar?: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  profile_completed: boolean;
  is_first_login: boolean;
  auth_method: string;
  date_joined: string;
  has_password: boolean;
  google_user: boolean;
  password?: string;
  confirm_password?: string;
  otp?: string;
}

// Core types re-exported from web - removing web-only imports
// This file mirrors the web types/index.ts but strips Next.js, AntD, and browser deps

export type AuthTypes = 'signIn' | 'signUp' | 'verifyEmail' | 'passwordReset' | 'forgotPassword' | 'companyProfileSetup';
export type ProjectStatus = 'pending' | 'incomplete' | 'completed';
export type PlanNames = 'enterprise' | 'basic' | 'pro';
export type AsyncActionTargets = keyof AsyncActionsState;
export type ChatTypes = 'direct-message' | 'room';
export type BaseObject = Record<string, any>;
export type Ordering = 'asc' | 'desc';

export enum IndustryModes {
  ENGINEERING = 'engineering',
  EDUCATION = 'education',
  STANDARD = 'standard',
  MEDICAL = 'medical',
  LEGAL = 'legal'
}

export enum MemberRoles {
  COLLABORATOR = 'collaborator',
  CLIENT = 'client',
  ADMIN = 'admin'
}

export enum ChatFilters {
  DIRECT_MESSAGE = 'direct_message',
  UNREAD = 'unread',
  ROOM = 'room',
  ALL = 'all'
}

export enum ModalTypes {
  DELETE_PROJECT_WARNING = 'delete_project_warning',
  DELETE_MESSAGE_WARNING = 'delete_message_warning',
  DELETE_MEMBER_WARNING = 'delete_member_warning',
  DELETE_CHAT_WARNING = 'delete_chat_warning',
  SEND_INVITE_MESSAGE = 'send_invite_message',
  DOCUMENT_PREVIEW = 'document_preview',
  CREATE_NEW_CHAT = 'create_new_chat',
  SUBSCRIPTION = 'subscription',
  PLAN_UPGRADE = 'plan_upgrade',
  MILESTONES = 'milestones'
}

export enum PlanFeatures {
  ONBOARDING_AND_DATA_MIGRATION = 'onboarding_and_data_migration',
  MENTIONS_AND_NOTIFICATIONS = 'mentions_and_notifications',
  CLIENT_APPROVAL_WORKFLOW = 'client_approval_workflow',
  ROLE_BASED_PERMISSIONS = 'role_based_permissions',
  CLIENT_PROJECT_VIEW = 'client_project_view',
  MILESTONE_TRACKING = 'milestone_tracking',
  ACTIVE_PROJECTS = 'active_projects',
  TEAM_CHAT = 'team_chat',
  STORAGE = 'storage',
  USERS = 'users'
}

export interface AsyncAction {
  pending: boolean;
  success: boolean;
  message: string;
}

export interface AsyncActionsState {
  resendVerificationEmail: AsyncAction;
  updateSubscriptionPlan: AsyncAction;
  addTeamMemberToProject: AsyncAction;
  fetchSubscriptionQuota: AsyncAction;
  fetchSubscriptionPlans: AsyncAction;
  sendPasswordResetEmail: AsyncAction;
  fetchProjectDocuments: AsyncAction;
  createCompanyProfile: AsyncAction;
  updateCompanyProfile: AsyncAction;
  fetchCompanyProfile: AsyncAction;
  createPaymentIntent: AsyncAction;
  createSubscription: AsyncAction;
  activateFreeTrial: AsyncAction;
  sendInviteMessage: AsyncAction;
  updateUserProfile: AsyncAction;
  fetchSubscription: AsyncAction;
  createSetupIntent: AsyncAction;
  resendTeamInvite: AsyncAction;
  fetchUserByEmail: AsyncAction;
  fetchUserProfile: AsyncAction;
  revokeTeamInvite: AsyncAction;
  fetchTeamInvites: AsyncAction;
  deleteTeamMember: AsyncAction;
  acceptTeamInvite: AsyncAction;
  fetchTeamMembers: AsyncAction;
  updateTeamInvite: AsyncAction;
  updateTeamMember: AsyncAction;
  fetchTeamMember: AsyncAction;
  fetchTeamInvite: AsyncAction;
  sendTeamInvite: AsyncAction;
  changePassword: AsyncAction;
  fetchDocuments: AsyncAction;
  fetchAnalytics: AsyncAction;
  fetchMessages: AsyncAction;
  updateProject: AsyncAction;
  resetPassword: AsyncAction;
  deleteProject: AsyncAction;
  deleteMessage: AsyncAction;
  createProject: AsyncAction;
  fetchProjects: AsyncAction;
  updateMessage: AsyncAction;
  socialSignIn: AsyncAction;
  fetchProject: AsyncAction;
  sendMessage: AsyncAction;
  verifyEmail: AsyncAction;
  createChat: AsyncAction;
  fetchChats: AsyncAction;
  deleteChat: AsyncAction;
  signIn: AsyncAction;
  signUp: AsyncAction;
}

export interface EndAsyncAction {
  feedbackType?: FeedbackState['feedbackType'];
  feedbackDuration?: FeedbackState['duration'];
  message?: AsyncAction['message'];
  success: AsyncAction['success'];
  target: AsyncActionTargets;
}

export interface FeedbackState {
  type: 'secondary' | 'warning' | 'primary' | 'success' | 'loading' | 'error' | 'info';
  feedbackType: 'notification' | 'alert' | 'inline' | 'modal';
  placement: string;
  duration: number;
  message: string;
  target?: string;
  show?: boolean;
  title?: string;
  key?: string;
  actions: {
    secondaryFunction?: string;
    primaryFunction?: string;
    secondaryText?: string;
    secondaryUrl?: string;
    primaryText?: string;
    primaryUrl?: string;
  };
}

export interface AuthState {
  isSigningOut: boolean;
  query: string;
  model: any;
  invite?: { email: string; id: string };
}

export interface Milestone {
  enable_feedback: boolean;
  is_completed: boolean;
  completed_at?: string;
  assigned_to?: string;
  assigned_at?: string;
  created_at?: string;
  start_date?: string;
  subtasks: Subtask[];
  end_date?: string;
  comment?: string;
  progress: number;
  name: string;
  id: string;
}

export interface Subtask {
  status: 'pending' | 'completed';
  completed_at?: string;
  assigned_to?: string;
  created_at?: string;
  title: string;
  id: number;
}

export interface TeamMember {
  project_name: string;
  project_uuid: string;
  user_email: string;
  user_name: string;
  is_owner: boolean;
  joined_at: string;
  role: MemberRoles;
  user_id: string;
  id: string;
}

export interface TeamInvite {
  status: 'pending' | 'accepted' | 'cancelled' | 'rejected';
  is_existing_user?: boolean;
  expires_in_days: number;
  project_company: string;
  inviter_email: string;
  project_name: string;
  inviter_name: string;
  is_expired: boolean;
  can_accept: boolean;
  project_id: string;
  created_at: string;
  expires_at: string;
  role: MemberRoles;
  email: string;
  id: string;
}

export interface File {
  status: 'uploading' | 'uploaded' | 'pending' | 'failed';
  created_at: string;
  is_owner?: boolean;
  mime_type: string;
  name: string;
  size: number;
  url: string;
  id: string;
}

export interface Mention {
  text: string;
  id: string;
}

// Web positions the @mention popover with a DOMRect anchored to the caret.
// RN has no DOMRect, so we anchor with a measured x/y/width/height instead.
export interface MentionPopover {
  anchorRect?: { x: number; y: number; width: number; height: number };
  userId: string;
}

export interface MarkMessagesAsRead {
  messageIds: string[];
  chatId: string;
}

export interface Project {
  milestones: Milestone[];
  members: TeamMember[];
  status: ProjectStatus;
  client_email: string;
  start_date?: string;
  client_name: string;
  owner_email: string;
  owner_name: string;
  files: File[];
  end_date?: string;
  progress: number;
  name: string;
  id: string;
  permissions?: {
    can_update_milestone: boolean;
    can_update_subtasks: boolean;
    can_send_invite: boolean;
    can_delete: boolean;
    can_edit: boolean;
    can_view: boolean;
  };
}

export interface ProjectState {
  milestoneModel: Milestone;
  isUploadingFiles: boolean;
  projects: Project[];
  project?: Project;
  model: Project;
}

export interface ChatParticipant {
  avatar?: string;
  email: string;
  name: string;
  id: string;
}

export interface ChatMessage {
  status: 'pending' | 'delivered' | 'sent' | 'read';
  mentions: Array<Mention>;
  voice_note?: File;
  is_deleted: boolean;
  files?: File[];
  edited_at?: string;
  created_at: string;
  member_id: string;
  temp_id?: string;
  text?: string;
  id: string;
  reply_to?: {
    files?: Array<File>;
    sender_name: string;
    message_id: string;
    member_id: string;
    text?: string;
  };
}

export interface Chat {
  participants: ChatParticipant[];
  created_by?: ChatParticipant;
  messages: ChatMessage[];
  last_message?: ChatMessage;
  unread_count?: number;
  is_deleted: boolean;
  created_at?: string;
  temp_id?: string;
  id: string;
  room?: { avatar?: string; name: string; project_id?: string };
}

export interface ChatState {
  activeChatsFilter: ChatFilters;
  teamMembersListOrder: Ordering;
  suggestedMembers: TeamMember[];
  editedMessage?: ChatMessage;
  activeChatId?: string;
  showChats: boolean;
  isRecording: boolean;
  teamMembers: TeamMember[];
  chats: Record<string, Chat>;
  media: Document[];
  count: number;
  mention: MentionPopover;
  message: ChatMessage;
  model: Chat;
  pagination: {
    messages: { has_more: boolean; cursor?: string };
    chat: { has_more: boolean; cursor?: string };
  };
}

export interface TeamState {
  members: TeamMember[];
  invites: TeamInvite[];
  inviteModel: InviteModel;
  member?: TeamMember;
  invite?: TeamInvite;
}

export interface InviteModel {
  role?: MemberRoles;
  project?: string;
  email: string;
}

export interface PlanFeature {
  in_development?: boolean;
  supported?: boolean;
  text: string;
}

export interface Plan {
  display_name: 'Enterprise' | 'Basic' | 'Pro';
  features: Record<PlanFeatures, PlanFeature>;
  billing_unit: 'per_company' | 'per_seat';
  name: PlanNames;
  price: number;
  id: string;
}

export interface Subscription {
  status: 'trialing' | 'active' | 'cancelled' | 'inactive';
  is_trial_expired: boolean;
  cancelled_at?: string;
  start_date: string;
  is_trial: boolean;
  end_date: string;
  plan?: Plan;
  id?: string;
}

export interface PlanQuota {
  storage: { allocated: number | 'unlimited'; used: number };
  active_projects: {
    allocated: number | 'unlimited';
    monthly_usage: number;
    is_monthly: boolean;
    used: number;
  };
  users: { admin: { allocated: number | 'unlimited'; used: number } };
}

export interface AccountState {
  subscription: Subscription;
  plans: Plan[];
  quota: PlanQuota;
  user?: any;
  model: any;
}

export interface AnalyticItem {
  value: number;
  rate: number;
}

export interface Analytic {
  average_completion_time: AnalyticItem;
  completed_milestones: AnalyticItem;
  pending_projects: AnalyticItem;
  active_projects: AnalyticItem;
  overdue_tasks: AnalyticItem;
  team_members: AnalyticItem;
  monthly_project_status: any[];
  all_projects: {
    average_completion_percentage: number;
    incomplete_percentage: number;
    completion_percentage: number;
    incomplete: number;
    completed: number;
    total: number;
  };
  team_performance: {
    leaderboard: Array<{ progress: number; name: string }>;
    milestone_completion: any;
  };
  client_engagement: any;
}

export interface AnalyticsState {
  activeChartMonthIndex?: number;
  analytics: Analytic;
}

export interface Document {
  file_size_formatted: string;
  date_uploaded: string;
  document_name: string;
  project_name?: string;
  description: string;
  created_at: string;
  mime_type: string;
  file_size: number;
  file_url: string;
  status: string;
  type: string;
  id: string;
}

export interface DocumentState {
  documents: Document[];
}

export interface Company {
  company_username: string;
  company_name: string;
  industry: string;
  avatar?: string;
  id: string;
}

export interface CompanyModel {
  industry?: string;
  username: string;
  logo?: string;
  name: string;
}

export interface CompanyState {
  model: CompanyModel;
  company?: Company;
}

export interface AppState {
  industryMode: IndustryModes;
  theme: 'light' | 'dark';
  isSystemTheme: boolean;
}

export interface ModalState {
  target: ModalTypes | '';
  isLoading: boolean;
  data: BaseObject;
}

export interface UpdateMessage {
  message: Partial<ChatMessage>;
  defaultToId?: boolean;
  chatId: string;
}
