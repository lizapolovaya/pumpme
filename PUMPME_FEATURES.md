# PumpMe Features

This file summarizes the features implemented in the codebase as of the current snapshot.

## Core App

- Next.js 16 App Router application with a dark, performance-oriented UI.
- Mobile-first layout with a persistent bottom navigation on the main app screens.
- Shared app shell with header, navigation, and route-aware active state.
- Progressive Web App support via manifest, service worker registration, and icons.
- Authentication flow built around Google sign-in through Supabase Auth.
- Two backend storage drivers:
  - SQLite for local and default development use
  - Supabase for hosted or remote storage

## Today Dashboard

The `/` route is the main dashboard.

- Readiness score card with a circular progress visualization.
- Readiness headline and summary text.
- Planned workout summary with estimated duration and target volume.
- Nutrition summary with calorie, protein, carbohydrate, and fat targets.
- Inline nutrition editing with save and cancel flow.
- Weekly discipline view showing recent session activity.
- Consistency streak display based on the week’s workout activity.
- Start Workout entry point for the current day.
- Pulls dashboard data from the bootstrap API so the screen can render a complete daily snapshot.

## Workouts

The `/workouts` route is the workout editor.

- Loads a workout session for a selected date.
- Supports today’s session as well as past or future dates.
- Can activate a scheduled session on mount when requested.
- Lets the user add exercises to a session.
- Lets the user rename exercises.
- Lets the user remove exercises.
- Lets the user add, update, and remove sets.
- Supports weight, reps, and RPE entry per set.
- Tracks session status changes, including active and completed states.
- Shows estimated burn and total volume summary cards.
- Supports finishing a workout session.
- Supports realtime sync from database changes.
- Invalidates related dashboard, calendar, and progress data after mutations.

## Calendar

The `/calendar` route is the session calendar and day browser.

- Month grid view with logged workout indicators.
- Navigation to previous month, next month, and current month.
- Query-driven month selection through `year`, `month`, and `date` parameters.
- Day selection that preserves the selected date in the URL.
- Monthly summary metrics such as active days and logged sessions.
- Session detail sidebar for the selected day.
- Shows session title, status, duration, volume, and exercise breakdown.
- Supports reopening a workout from a past day.
- Supports rerunning a previous session into a new workout session.
- Visual day intensity markers based on session volume.
- Current-month and out-of-month grid handling for a full calendar layout.

## Progress

The `/progress` route is the analytics and coaching dashboard.

- AI Coach Analysis card.
- Optional OpenAI-generated coaching copy, with heuristic fallback when unavailable.
- Weekly volume trend with hover or tap detail behavior.
- Estimated 1RM widget for a selected lift.
- Real lift selection sourced from workout history.
- Lift-specific 1RM trend chart.
- Next-session load targets labeled `Light`, `Moderate`, and `Heavy`.
- Load targets derived from the current estimated 1RM and rounded to gym-friendly increments.
- Charts and summaries update when the selected lift changes.
- Displays recovery score and readiness context.
- Displays average RPE and its interpretation.
- Links the analytics back to practical training decisions rather than passive tracking.

## Profile

The `/profile` route is the account and settings hub.

- Edit profile identity and training profile fields.
- Edit age, height, weight, desired weight, gym sessions per week, primary goal, and biological sex.
- Save profile changes through the API.
- Nutrition target editor tied to the profile and nutrition system.
- Activity sync controls and status.
- Google connection status and health sync connection management.
- Links to Help and Privacy screens.
- Logout support.

## Login and Auth

- Dedicated `/login` screen for Google sign-in.
- Supabase auth callback route.
- Sign-out route.
- Google OAuth flow with health access scopes configured for daily step sync.

## Help and Privacy

- `/help` page with short usage guidance for the main screens.
- `/privacy` page describing what data the app stores and how Google sync works.

## Backend and Data

- Typed backend service layer under `lib/server/backend`.
- Repository abstraction with SQLite and Supabase implementations.
- Bootstrap APIs that compose multiple data domains into one screen-friendly payload.
- Workout templates and template-based session creation.
- Profile data and preferences persistence.
- Nutrition day totals and editable macro targets.
- Activity day sync and daily step totals.
- Readiness day tracking.
- Progress analytics and lift/volume trend aggregation.
- Calendar month/day APIs.
- Optional realtime updates through Supabase Realtime.
- Optional Google Health API sync for activity data.
- Optional OpenAI-powered progress coaching.

## Notes

- The codebase is opinionated toward workout logging, training consistency, and progress review.
- The feature set is centered on a single authenticated user account, not a multi-user social layer.
- The UI intentionally uses a dark, high-contrast visual system with dense cards and strong typography.
