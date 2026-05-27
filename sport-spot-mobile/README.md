# SportSpot Mobile

> Expo Router mobile application for SportSpot members on Android and iOS.

The `sport-spot-mobile` project provides the native mobile experience for SportSpot. It connects to the Next.js backend API, authenticates users with JWT, and gives members a fast way to browse classes, view class details, and manage reservations.

## Key Features

- Native login and registration flow
- JWT-based authenticated API requests
- Expo Router file-based navigation
- Class list and class detail screens
- Lightweight styling theme for consistent mobile UI
- Auto-cache data sync when returning from detail screens
- Android and iOS support through Expo
- Standalone Android APK builds through EAS

## Architecture

```text
Expo Router App
        |
        | fetch + Authorization: Bearer <token>
        v
Next.js REST API
        |
        | Drizzle ORM
        v
Neon PostgreSQL
```

The mobile app does not connect directly to the database. All data access flows through the Next.js backend.

## Critical Navigation UX Polish

### Route Guard in `app/_layout.tsx`

SportSpot uses an Expo Router route-guard architecture inside:

```text
app/_layout.tsx
```

The route guard prevents authenticated users from navigating back into public auth screens such as:

```text
/login
/register
```

This keeps the navigation stack clean after login and avoids confusing states where a logged-in member can return to authentication screens through hardware back gestures, deep links, or manual route changes.

Expected behavior:

- Logged-out users can access `/login` and `/register`.
- Logged-in users are redirected away from `/login` and `/register`.
- Protected app screens remain available only after authentication state is confirmed.

### Focus-Based Data Refresh in `app/classes.tsx`

SportSpot uses `useFocusEffect` combined with `useCallback` inside:

```text
app/classes.tsx
```

This automatically triggers a clean backend re-fetch whenever the user navigates back from a class detail screen.

Example pattern:

```tsx
useFocusEffect(
  useCallback(() => {
    fetchClasses();
  }, [])
);
```

This resolves frozen state issues where the class list could display stale capacity, reservation, or enrollment state after returning from:

```text
app/classes/[slug].tsx
```

The result is a smoother native navigation experience:

- Open class list
- Navigate to class details
- Reserve or cancel a slot
- Press Back
- Class list refreshes automatically

## Folder Structure Guide

```text
sport-spot-mobile/
├── app/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── classes.tsx
│   └── classes/
│       └── [slug].tsx
├── assets/
├── package.json
├── eas.json
└── README.md
```

### Important Routes

| Path | Purpose |
| --- | --- |
| `app/_layout.tsx` | Root layout, navigation shell, auth route guards |
| `app/login.tsx` | Native login screen |
| `app/register.tsx` | Native registration screen |
| `app/classes.tsx` | Mobile class list synced with backend API data |
| `app/classes/[slug].tsx` | Dynamic class detail screen using the class/session slug |

The mobile routing model intentionally mirrors the web application concepts so users get a consistent SportSpot experience across platforms.

## Local Development

### Install dependencies

From the repository root:

```bash
npm install
```

Or from the mobile project directory:

```bash
npm install
```

### Start Expo

From the mobile project:

```bash
npm run start
```

Or from the repository root:

```bash
npm run -w sport-spot-mobile start
```

Expo will open a development interface with options for:

- Expo Go
- Android emulator
- iOS simulator
- Web preview

## Launch with Expo Go

1. Install Expo Go on your Android or iOS device.
2. Start the Expo development server:

```bash
npm run start
```

3. Scan the QR code shown in the terminal or Expo DevTools.
4. Make sure your phone and development machine are on the same network.
5. Configure the API URL so the phone can reach the Next.js backend.

For physical-device testing, avoid `localhost` because it points to the phone itself. Use your computer LAN IP instead:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.10:3000"
```

## Environment Configuration

Recommended mobile environment variable:

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

For Android emulator, you may need:

```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:3000"
```

For a physical device, use your machine IP:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.10:3000"
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Starts the Expo development server |
| `npm run android` | Starts Expo for Android |
| `npm run ios` | Starts Expo for iOS |
| `npm run web` | Starts Expo web preview |
| `npm run build` | Exports the Expo app |
| `npm run lint` | Runs Expo linting |

## Building a Standalone Android APK

SportSpot uses EAS Build to produce installable Android packages.

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
```

### 3. Confirm `eas.json`

The project includes a `preview` build profile configured for internal Android APK distribution:

```json
{
  "cli": {
    "version": ">= 19.1.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

The key setting is:

```json
"android": {
  "buildType": "apk"
}
```

This tells EAS to produce a ready-to-install `.apk` instead of an app bundle.

### 4. Build the APK

From `sport-spot-mobile/`, run:

```bash
eas build --platform android --profile preview
```

### 5. Install the APK

After the build completes, Expo will provide a download link for the APK.

Download the file to an Android device and install it. You may need to allow installation from trusted external sources in Android settings.

## Backend Connectivity Notes

The mobile app depends on the deployed or local Next.js backend API.

Before testing auth or class data:

- Confirm the web app is running.
- Confirm `EXPO_PUBLIC_API_URL` points to the reachable backend.
- Confirm the backend has `DATABASE_URL` and `JWT_SECRET` configured.
- Confirm the Neon database has been migrated and seeded.
