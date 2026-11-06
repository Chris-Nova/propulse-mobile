import React, { useState } from 'react';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changePassword } from '@/store/slices/teams';
import { validatePassword } from '@/utils/validators';
import { AuthSheetShell } from '@/components/auth/AuthSheetShell';
import { AuthButton, AuthFieldError, AuthInput } from '@/components/auth/AuthControls';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';

// Change Password for a signed-in user: POST /users/change-password with
// { old_password, new_password, confirm_password } (ChangePasswordSerializer in
// propulse-api). The server's message is shown as a toast by the changePassword thunk.
// Google-only accounts get the server's "no password set" message the same way.
export const ChangePassword = () => {
  const dispatch = useAppDispatch();
  const { pending } = useAppSelector((s) => s.asyncActions.changePassword);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const sameAsCurrent = next.length > 0 && next === current;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    !!current && validatePassword(next).isValid && !sameAsCurrent && !!confirm && !mismatch;

  const onSubmit = async () => {
    const ok = await dispatch(changePassword(current, next) as any);
    if (ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
      router.back();
    }
  };

  return (
    <AuthSheetShell
      title="Change Password"
      intro="Your new password must be different from your current password"
    >
      <AuthInput
        secure
        placeholder="Current Password"
        value={current}
        onChangeText={(v: string) => setCurrent(v)}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      <AuthInput
        secure
        placeholder="New Password"
        value={next}
        onChangeText={(v: string) => setNext(v)}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        invalid={sameAsCurrent}
      />
      {sameAsCurrent && <AuthFieldError>New password must be different from your current one</AuthFieldError>}
      <PasswordRequirements password={next} />
      <AuthInput
        secure
        placeholder="Confirm New Password"
        value={confirm}
        onChangeText={(v: string) => setConfirm(v)}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        invalid={mismatch}
      />
      {mismatch && <AuthFieldError>Passwords don't match</AuthFieldError>}

      <AuthButton
        label="Update Password"
        loading={pending}
        disabled={!canSubmit}
        onPress={onSubmit}
      />
    </AuthSheetShell>
  );
};
