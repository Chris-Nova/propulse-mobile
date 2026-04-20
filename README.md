# Propulse Mobile

React Native (Expo) app for iOS & Android — translated from the Propulse AI web app.

## Tech Stack

| Web | Mobile |
|-----|--------|
| Next.js (App Router) | Expo Router |
| NextAuth.js | expo-secure-store + JWT |
| Ant Design | Custom React Native components |
| twin.macro / styled-components | StyleSheet API |
| ApexCharts | react-native-chart-kit |
| Socket.io (via web) | Native WebSocket |
| Stripe.js (web) | @stripe/stripe-react-native |
| next/image | expo-image |
| localStorage | @react-native-async-storage |
| Redux Toolkit | Redux Toolkit (same) |

## Project Structure

```
propulse-mobile/
├── app/                    # Expo Router pages (file-based)
│   ├── _layout.tsx         # Root with Redux Provider
│   ├── index.tsx           # Auth redirect
│   ├── (auth)/             # Unauthenticated screens
│   │   ├── index.tsx       # Sign In
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   ├── verify-email.tsx
│   │   └── password-reset.tsx
│   └── (app)/              # Authenticated (tab navigator)
│       ├── _layout.tsx     # Bottom tab bar
│       ├── dashboard/
│       ├── projects/[projectId]/
│       ├── teams/
│       ├── messages/[chatId]/
│       ├── analytics/
│       └── account/
├── components/             # Feature components
├── store/
│   ├── index.ts            # Redux store
│   ├── reducers/           # All state slices
│   └── slices/             # Async thunks / business logic
├── utils/
│   ├── api.ts              # Fetch utility (token from SecureStore)
│   └── storage.ts          # SecureStore + AsyncStorage wrappers
├── constants/
│   └── theme.ts            # Colors, sizes, shadows
└── types/index.ts          # Shared TypeScript types
```

## Setup

### 1. Install dependencies

```bash
cd propulse-mobile
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Run the app

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Key Migration Notes

### Authentication
- **Web**: NextAuth.js handles sessions via cookies
- **Mobile**: JWT tokens stored securely in `expo-secure-store`. The `TokenStorage` utility handles all token read/write. A global sign-out callback is registered in `utils/api.ts` to handle 401 errors.

### Navigation
- **Web**: `next/navigation` (`useRouter`, `redirect`)
- **Mobile**: `expo-router` (`router.push`, `router.replace`). File-based routing matches Next.js conventions.

### Styling
- **Web**: `twin.macro` + Tailwind CSS classes
- **Mobile**: React Native `StyleSheet.create()` with the centralized theme in `constants/theme.ts`

### Real-time Chat
- WebSocket connects via `store/slices/chat.ts → connectSocket()`
- Dispatched on mount in the Messages screen, disconnected on unmount

### Stripe Billing
- Wrapped with `<StripeProvider publishableKey={...}>` in the Account screen
- Use `@stripe/stripe-react-native` hooks for payment sheets

### Redux Store
- All reducers are compatible between web and mobile (no browser APIs)
- Slices in `store/slices/` replace Next.js-specific logic (removed `redirect()`, `getSession()`)

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

Install EAS CLI first: `npm install -g eas-cli` and configure `eas.json`.
