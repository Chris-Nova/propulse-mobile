import SignIn from '@/components/auth/SignIn';

// No <Screen> wrapper: AuthShell paints the full-bleed background and handles
// scrolling and the keyboard itself.
export default function SignInPage() {
  return <SignIn />;
}
