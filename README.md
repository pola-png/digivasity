<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Digivasity Web

This is the web app for Digivasity, built with Vite, Appwrite, and a small Socket.IO server for live counselor chat.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set your Appwrite and Gemini environment variables in `.env.local`
3. Run the app:
   `npm run dev`

The Appwrite pieces handle auth, database, and storage. The live counselor chat still uses the custom Node/Express + Socket.IO server in `server.ts`.

## Required environment variables

- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID` default: `digivasitydb`
- `VITE_APPWRITE_USERS_COLLECTION_ID` default: `users`
- `VITE_APPWRITE_NEWS_COLLECTION_ID` default: `news`
- `VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID` default: `notifications`
- `VITE_APPWRITE_STORAGE_BUCKET_ID` default: `digivasity_storage`
- `VITE_APPWRITE_GOOGLE_SUCCESS_URL` optional
- `VITE_APPWRITE_GOOGLE_FAILURE_URL` optional
- `VITE_APPWRITE_VERIFY_URL` required
- `VITE_APPWRITE_RECOVERY_URL` required
- `GEMINI_API_KEY`

## Appwrite collections

Make sure the following collection attributes exist in the `digivasitydb` database:

1. `users` collection: `$id` (row ID), `fullName`, `displayName`, `email`, `credits`, `admi`, `admin`, `whatsapp`, `lastCreditRefresh`, `subscriptionJson`, `pushTokens`, `fcmToken`, `lastPushToken`, `lastPushTokenAt`, `role`, `createdAt`, `pushPreferencesJson`
2. `news` collection: `$id` (row ID), `title`, `summary`, `content`, `publishedAt`, `excerpt`, `category`, `slug`, `imageUrl`, `authorUid`, `date`, `authorName`, `status`, `isFeatured`, `linksJson`, `createdBy`, `updatedAt`
3. `notifications` collection: `$id` (row ID), `title`, `message`, `newsId`, `createdAt`, `type`, `body`, `link`, `createdBy`
4. Storage bucket: `digivasity_storage`

For the `users` collection, make sure the authenticated user can create their own document, and the document-level permissions should allow that same user to read/update/delete their profile record.
Use the Appwrite row ID (`$id`) as the user profile document ID, so the app can safely upsert the row using the auth user ID. Do not add a separate `uid` column unless you also update the app to write it.
For the `news` and `notifications` tables, the app writes only the columns listed above and uses the Appwrite row ID as the document ID. There is no older `uid` field in any table write path.

## Appwrite table permissions

Use these settings so the app works with Appwrite's table/row security model:

1. `users` table
   - Create: `Users`
   - Read/Update/Delete: handled by row permissions
   - Row security: `Enabled`
   - Row permissions created by the app: `read`, `update`, `delete` for the owning user

2. `news` table
   - Create: `Users`
   - Row security: `Enabled`
   - Created rows: `read` for `Any`, `update` and `delete` for the publishing user
   - If you want stricter admin-only publishing, move the create step to a server function or backend route

3. `notifications` table
   - Create: `Users`
   - Row security: `Enabled`
   - Created rows: `read` for `Any` if you want the in-app feed visible broadly, or `Users` if you want only signed-in users to see it
   - `update` and `delete` can stay with the creating user

Important:
- Do not pass document-level `create` permission to `createDocument`. Appwrite only accepts `read`, `update`, `delete`, or `write` for row permissions.
- The table-level `Create` permission is what allows a signed-in user to insert a new row.

## Google OAuth setup

1. In Appwrite Console, enable the Google OAuth provider for your project.
2. Add your web app domain to the Appwrite Web platform list.
3. If Appwrite asks for redirect URLs, use the same URLs you place in `VITE_APPWRITE_GOOGLE_SUCCESS_URL` and `VITE_APPWRITE_GOOGLE_FAILURE_URL`, or leave those env vars empty to use the current app origin automatically.
4. In Google Cloud Console, add this Appwrite OAuth callback URL to the authorized redirect URIs:
   `https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/digivasity`
5. Set `VITE_APPWRITE_VERIFY_URL` and `VITE_APPWRITE_RECOVERY_URL` to your deployed app URLs. Appwrite appends `userId` and `secret` query params to the verification callback URL, and the hostname must already be listed as a Web platform in Appwrite.
