# SportSpot 2.0 - Mobile Client Specification

Here we manage the React Native Expo app targeting iOS and Android. This is a client-only shell focusing on high-performance end-user interactions.

## Mobile Architecture & API Rules
- **Tech Stack**: React Native, Expo, TypeScript, NativeWind (Tailwind for React Native) or StyleSheet.
- **Routing**: Expo Router (file-based).
- **Data Layer**: Communicates with the backend strictly via a secure RESTful API exposed by the Next.js application. No direct database access or ORM is permitted here.
- **Back-end API** source code: `..\sport-spot-web\src\app\api`
- **Token Management**: JWT tokens acquired during login/register must be saved locally using `expo-secure-store`. Every request to protected API routes must inject this token into the `Authorization: Bearer <token>` header.
- **Use modular design**: split the app into self-contained components, to avoid complex files with too much code

## Mobile Native UI/UX Guidelines
- **Implement user-fiendly UI**, stack navigation, responsive layout (for tablets/smarphones)
- **Mobile UI Alerts**: ensure all native alerts, confirms and other system dialogs have a fallback for Web (implemented as modal popups)
- **Layout Responsiveness**: Rely entirely on Flexbox and relative dimensions to handle small smartphones as well as larger tablets cleanly. Wrap layouts in `SafeAreaView` components.
- **Native Interactions**: Implement touch-optimized micro-interactions using `Pressable` with customized scale-down feedback on press.
- **Performance Cues**: Use native components like `ActivityIndicator` or skeleton placeholders during network requests. Implement pull-to-refresh (`RefreshControl`) and infinite scrolling on long lists.
- **Design Tokens**: Match the branding, color schemes, and iconography (thin/duotone feel) established by the Web App UI guidelines.

## Mobile Screens (Minimum 5 Required Components)
1. **Auth Screen (`(auth)/login` & `register`)**: Clean, distraction-free unified form handling native keyboard avoidance (`KeyboardAvoidingView`).
2. **Home Dashboard (`(tabs)/index`)**: Visual, card-based hub showing the user's next scheduled workout with a countdown timer, brief health statistics, and a quick-action shortcut to open the schedule tracker.
3. **Schedule Browser (`(tabs)/schedule`)**: A smooth vertical or horizontal timeline list of upcoming sports classes. Includes search and filtering capabilities by workout category.
4. **Class Details View (`screens/ClassDetails`)**: Implements dynamic rendering. Displays class imagery, coach profiles, duration badges, and the 3-bar difficulty level indicator. Features a prominent, sticky "Book Class" button with double-tap confirmation or loading feedback.
5. **Profile Screen (`(tabs)/profile`)**: Displays user details, profile picture, a summarized ledger of total historical bookings, and a secure "Logout" workflow that purges tokens from `expo-secure-store`.