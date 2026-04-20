import { GetMessageProps, Messages } from '@/types';

const genericAuthErrorMessages = {
  Configuration: `There was a problem when trying to authenticate. Please contact us if this error persists.`,
  Default: `An unknown error occurred!`,
  Verification: `Invalid Access Token`,
  AccessDenied: `Access denied.`
};

const genericErrorMessages = {
  unauthorized_request: 'Sorry, you are not authorised to perform this action.',
  otp_already_used: 'This OTP has already been used. Please request a new one.',
  otp_too_many_attempts: 'Too many invalid attempts. Please try again later.',
  validation_error: 'Invalid data received. Check your inputs and try again',
  request_failed: 'Sorry, we could not process your request.',
  products_not_found: 'Subscription products not found',
  product_not_found: 'Subscription product not found',
  already_subscribed: 'Subscription already exists',
  server_error: 'Server error'
};

export const messages: Messages = {
  resendVerificationEmail: {
    email_already_verified: 'You have successfully verified your account with <b>ProPulse</b>. You can now login to set up your company profile.',
    ...genericErrorMessages
  },
  updateSubscriptionPlan: {
    subscription_update_failed: 'An error occurred while updating your subscription.',
    subscription_updated: 'Subscription updated successful!',
    ...genericErrorMessages
  },
  sendPasswordResetEmail: {
    password_reset_otp_sent: 'Password reset OTP has been sent successfully.',
    ...genericErrorMessages
  },
  updateCompanyProfile: {
    profile_updated_successful: 'Profile updated successfully',
    ...genericErrorMessages
  },
  createCompanyProfile: {
    company_created: 'Your company profile is ready. <br/> You can now manage projects, invite your team, and get started.',
    company_already_exists: 'You have already set up a company profile.',
    ...genericErrorMessages
  },
  createPaymentIntent: {
    payment_intent_created: 'Payment intent created successfully.',
    ...genericErrorMessages
  },
  fetchCompanyProfile: {
    profile_retrieved_successful: 'Company profile retrieved successfully.',
    ...genericErrorMessages
  },
  createSubscription: {
    missing_subscription_data: 'Invalid subscription request',
    subscription_created: 'Subscription setup successful!',
    ...genericErrorMessages
  },
  activateFreeTrial: {
    missing_subscription_data: 'Invalid subscription request',
    subscription_created: 'Subscription setup successful!',
    ...genericErrorMessages
  },
  fetchSubscription: {
    ...genericErrorMessages
  },
  updateUserProfile: {
    profile_updated_successful: 'Profile updated successfully.',
    ...genericErrorMessages
  },
  createSetupIntent: {
    setup_intent_created: 'Setup intent created successfully.',
    ...genericErrorMessages
  },
  updateTeamMember: {
    team_member_updated: 'Team member updated successfully.',
    ...genericErrorMessages
  },
  fetchUserProfile: {
    ...genericErrorMessages
  },
  sendTeamInvite: {
    team_invite_sent: 'Invite sent! Your team member will receive an email to join.',
    invite_already_pending: 'An invitation is already pending for this email.',
    ...genericErrorMessages
  },
  changePassword: {
    password_changed: 'Password changed successfully.',
    incorrect_current_password: 'Incorrect password.',
    ...genericErrorMessages
  },
  resetPassword: {
    password_reset_confirmed: 'Password reset successfully.',
    otp_invalid: 'Invalid OTP received!',
    ...genericErrorMessages
  },
  verifyEmail: {
    email_verification_successful: 'Your account has been verified! Log in to start collaborating with your team.',
    otp_expired: 'Oops! You have provided an expired OTP. You can request a new OTP instead.',
    otp_invalid: 'Oops! Your provided an invalid OTP.',
    ...genericErrorMessages
  },
  signUp: {
    registration_successful: 'Almost there! Click below to enter the confirmation code sent to your email address.',
    ...genericAuthErrorMessages,
    ...genericErrorMessages
  },
  signIn: {
    email_not_verified: 'Please verify your account to sign in.',
    account_inactive: 'This account has been deactivated.',
    invalid_credentials: 'Invalid credentials supplied!',
    google_token_invalid: 'Invalid token received.',
    verification_failed: 'Verification failed!',
    login_successful: 'Login successful!',
    ...genericAuthErrorMessages,
    ...genericErrorMessages
  }
};

export const getMessage = (props: GetMessageProps) => {
  const { responseCode, resourceType } = props;
  const message = messages[resourceType]?.[responseCode];
  return message ?? 'Unknown error';
};
