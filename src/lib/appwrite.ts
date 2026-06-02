import {
  Client,
  Account,
  Databases,
  Functions,
  Messaging,
  Storage,
  ID,
  Query,
  Permission,
  Role,
  OAuthProvider,
  ExecutionMethod,
} from 'appwrite';
import type { Models } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

export const appwriteIds = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'digivasitydb',
  usersCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
  newsCollectionId: import.meta.env.VITE_APPWRITE_NEWS_COLLECTION_ID || 'news',
  notificationsCollectionId: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications',
  storageBucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'digivasity_storage',
};

const getCurrentUrl = () =>
  typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'http://localhost:5173';

const appUrl = import.meta.env.VITE_APP_URL || getCurrentUrl();
const buildModeRedirectUrl = (mode: 'verifyEmail' | 'resetPassword') => {
  try {
    const url = new URL(appUrl);
    url.searchParams.set('mode', mode);
    return url.toString();
  } catch {
    return `${appUrl}${appUrl.includes('?') ? '&' : '?'}mode=${mode}`;
  }
};

const googleSuccessUrl =
  import.meta.env.VITE_APPWRITE_GOOGLE_SUCCESS_URL ||
  `${getCurrentUrl()}?auth=google`;
const googleFailureUrl =
  import.meta.env.VITE_APPWRITE_GOOGLE_FAILURE_URL ||
  `${getCurrentUrl()}?auth=google-error`;
const verificationRedirectUrl =
  import.meta.env.VITE_APPWRITE_VERIFY_URL ||
  buildModeRedirectUrl('verifyEmail');
const recoveryRedirectUrl =
  import.meta.env.VITE_APPWRITE_RECOVERY_URL ||
  buildModeRedirectUrl('resetPassword');

const client = new Client();

if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);
const functions = new Functions(client);
const messaging = new Messaging(client);
const storage = new Storage(client);

export const NEWS_UPDATES_TOPIC_ID = 'news-updates';
const NEWS_NOTIFIER_FUNCTION_ID =
  import.meta.env.VITE_APPWRITE_NEWS_NOTIFIER_FUNCTION_ID || '';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  phoneNumber: string;
  photoURL: string | null;
  name?: string;
  reload: () => Promise<AppUser | null>;
}

export const auth: { currentUser: AppUser | null } = {
  currentUser: null,
};

type AuthListener = (user: AppUser | null) => void;
const authListeners = new Set<AuthListener>();
let authBootstrapPromise: Promise<AppUser | null> | null = null;

const SYSTEM_ADMIN_EMAILS = [
  'ubyytech2023@gmail.com',
  'olamilekanobetter@gmail.com',
  'ezekielxap@gmail.com',
  'info@digiskiskillsconsult.com',
  'ubong.udoka@digiskiskillsconsult.com',
  'ubongp.udoka@gmail.com',
];

const nowIso = () => new Date().toISOString();
const todayIso = () => nowIso().slice(0, 10);
const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return [];
    }
  }
  return [];
};
const toJsonText = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) return value;
  return JSON.stringify(value ?? []);
};

const getBrowserDeviceId = () => {
  if (typeof window === 'undefined') return ID.unique();

  const storageKey = 'digivasity:web-push-device-id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = ID.unique();
  window.localStorage.setItem(storageKey, next);
  return next;
};

const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase());
};

const toAppUser = (user: Models.User<Models.Preferences>): AppUser => ({
  uid: user.$id,
  email: user.email || '',
  displayName: user.name || user.email || 'Authorized User',
  emailVerified: Boolean(user.emailVerification),
  phoneNumber: user.phone || '',
  photoURL: null,
  name: user.name || '',
  reload: async () => {
    const fresh = await refreshCurrentUser();
    return fresh;
  },
});

const notifyAuthListeners = (user: AppUser | null) => {
  auth.currentUser = user;
  authBootstrapPromise = Promise.resolve(user);
  authListeners.forEach((listener) => listener(user));
};

const bootstrapAuth = async () => {
  if (!authBootstrapPromise) {
    authBootstrapPromise = refreshCurrentUser().catch(() => null);
  }
  return authBootstrapPromise;
};

export const onAuthStateChanged = (callback: AuthListener) => {
  let active = true;
  authListeners.add(callback);

  void (async () => {
    const user = await bootstrapAuth();
    if (active) callback(user);
  })();

  return () => {
    active = false;
    authListeners.delete(callback);
  };
};

export const refreshCurrentUser = async (): Promise<AppUser | null> => {
  if (!endpoint || !projectId) {
    notifyAuthListeners(null);
    return null;
  }

  try {
    const user = await account.get();
    const mapped = toAppUser(user);
    notifyAuthListeners(mapped);
    return mapped;
  } catch {
    notifyAuthListeners(null);
    return null;
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession('current');
  } catch {
    // Ignore logout errors so the UI can still recover locally.
  } finally {
    notifyAuthListeners(null);
  }
};

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName = '',
) => {
  await account.create(ID.unique(), email, password, displayName || email);
  await account.createEmailPasswordSession(email, password);
  const user = await refreshCurrentUser();
  return { user };
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  await account.createEmailPasswordSession(email, password);
  const user = await refreshCurrentUser();
  return { user };
};

export const signInWithGoogle = () => {
  account.createOAuth2Session(OAuthProvider.Google, googleSuccessUrl, googleFailureUrl);
};

export const triggerNewsNotifierFunction = async (params: {
  title: string;
  body?: string;
  newsId?: string;
  slug?: string;
  topic?: string;
}) => {
  if (!NEWS_NOTIFIER_FUNCTION_ID) return null;

  return functions.createExecution({
    functionId: NEWS_NOTIFIER_FUNCTION_ID,
    async: true,
    method: ExecutionMethod.POST,
    body: JSON.stringify({
      title: params.title,
      body: params.body || '',
      newsId: params.newsId || '',
      slug: params.slug || '',
      topic: params.topic || NEWS_UPDATES_TOPIC_ID,
    }),
  });
};

export const ensureNewsUpdatesTopicSubscription = async (identifier: string) => {
  if (!identifier) return null;
  if (!projectId) return null;

  const current = await account.get();
  const targetId = getBrowserDeviceId();
  const existingTarget = current.targets.find((target) => target.$id === targetId && target.providerType === 'push');

  try {
    if (existingTarget) {
      await account.updatePushTarget({
        targetId,
        identifier,
      });
    } else {
      await account.createPushTarget({
        targetId,
        identifier,
      });
    }
  } catch (err) {
    console.warn('Could not create or update the browser push target for news-updates:', err);
    return null;
  }

  try {
    return await messaging.createSubscriber({
      topicId: NEWS_UPDATES_TOPIC_ID,
      subscriberId: `${NEWS_UPDATES_TOPIC_ID}:${targetId}`,
      targetId,
    });
  } catch (err) {
    console.warn('Could not subscribe the browser push target to news-updates:', err);
    return null;
  }
};

export const updateProfile = async (user: AppUser, data: { displayName?: string }) => {
  const name = data.displayName?.trim();
  if (name) {
    await account.updateName(name);
  }

  const fresh = await refreshCurrentUser();
  return fresh || user;
};

export const sendEmailVerification = async (redirectUrl: string) => {
  return account.createEmailVerification({ url: redirectUrl });
};

export const getVerificationRedirectUrl = () => verificationRedirectUrl;

export const verifyEmail = async (userId: string, secret: string) => {
  await account.updateEmailVerification({ userId, secret });
  return refreshCurrentUser();
};

export const sendPasswordResetEmail = async (email: string, redirectUrl: string) => {
  return account.createRecovery(email, redirectUrl);
};

export const getRecoveryRedirectUrl = () => recoveryRedirectUrl;

export const confirmPasswordReset = async (
  userId: string,
  secret: string,
  password: string,
) => {
  await account.updateRecovery(userId, secret, password);
};

export const handleAppwriteError = (error: unknown, operationType: string, path: string | null) => {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    JSON.stringify({
      error: message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        phoneNumber: auth.currentUser?.phoneNumber,
      },
    }),
  );
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type AppwriteDocument = Models.Document;

export const getDocument = async (collectionId: string, documentId: string): Promise<any> => {
  return databases.getDocument(appwriteIds.databaseId, collectionId, documentId) as Promise<any>;
};

export const listDocuments = async (collectionId: string, queries: string[] = []): Promise<any> => {
  return databases.listDocuments(appwriteIds.databaseId, collectionId, queries) as Promise<any>;
};

export const createDocument = async (
  collectionId: string,
  documentId: string,
  data: Record<string, any>,
  permissions: string[] = [],
): Promise<any> => {
  return databases.createDocument(appwriteIds.databaseId, collectionId, documentId, data as any, permissions) as Promise<any>;
};

export const updateDocument = async (
  collectionId: string,
  documentId: string,
  data: Record<string, any>,
  permissions?: string[],
): Promise<any> => {
  return databases.updateDocument(appwriteIds.databaseId, collectionId, documentId, data as any, permissions) as Promise<any>;
};

export const deleteDocument = async (collectionId: string, documentId: string) => {
  return databases.deleteDocument(appwriteIds.databaseId, collectionId, documentId);
};

export const subscribeCollection = <T = any>(
  collectionId: string,
  callback: (documents: T[]) => void,
  queries: string[] = [],
) => {
  const channel = `databases.${appwriteIds.databaseId}.collections.${collectionId}.documents`;

  const load = async () => {
    const response = await listDocuments(collectionId, queries);
    callback(response.documents as T[]);
  };

  void load();

  const unsubscribe = client.subscribe(channel, async () => {
    try {
      const response = await listDocuments(collectionId, queries);
      callback(response.documents as T[]);
    } catch {
      // Ignore realtime refresh errors.
    }
  });

  return () => unsubscribe();
};

export const uploadImageFile = async (file: File) => {
  return storage.createFile(
    appwriteIds.storageBucketId,
    ID.unique(),
    file,
  );
};

export const getFileViewUrl = (fileId: string) => {
  return storage.getFileView(appwriteIds.storageBucketId, fileId);
};

export const getFilePreviewUrl = (fileId: string) => {
  return storage.getFilePreview(appwriteIds.storageBucketId, fileId);
};

export const createUserDocument = async (
  user: AppUser,
  additionalData?: { fullName?: string; whatsapp?: string; pushToken?: string },
) => {
  const userId = user.uid;
  const isAdmin = isAdminEmail(user.email);

  let existing: any = null;
  try {
    existing = await getDocument(appwriteIds.usersCollectionId, userId);
  } catch {
    existing = null;
  }

  const payload = {
    email: user.email || '',
    fullName: additionalData?.fullName || existing?.fullName || user.displayName || '',
    displayName: additionalData?.fullName || existing?.displayName || user.displayName || '',
    whatsapp: additionalData?.whatsapp || existing?.whatsapp || '',
    admi: existing?.admi ?? isAdmin,
    role: existing?.role || (isAdmin ? 'admin' : 'user'),
    admin: existing?.admin ?? isAdmin,
    createdAt: existing?.createdAt || nowIso(),
    credits: existing?.credits ?? 5,
    lastCreditRefresh: existing?.lastCreditRefresh ?? todayIso(),
    subscriptionJson:
      existing?.subscriptionJson ||
      JSON.stringify({
        type: 'none',
        expiresAt: null,
      }),
    pushTokens: additionalData?.pushToken
      ? toJsonText(
          Array.from(
            new Set([
              ...parseJsonArray(existing?.pushTokens),
              additionalData.pushToken,
            ]),
          ),
        )
      : toJsonText(existing?.pushTokens),
    pushPreferencesJson:
      existing?.pushPreferencesJson ||
      JSON.stringify({
        marketing: true,
        transactional: true,
      }),
    fcmToken: additionalData?.pushToken || existing?.fcmToken || '',
    pushToken: additionalData?.pushToken || existing?.pushToken || '',
    lastPushToken: additionalData?.pushToken || existing?.lastPushToken || '',
    lastPushTokenAt: additionalData?.pushToken ? nowIso() : existing?.lastPushTokenAt || '',
    updatedAt: nowIso(),
  };

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  try {
    await updateDocument(appwriteIds.usersCollectionId, userId, payload);
  } catch (updateError) {
    try {
      await createDocument(appwriteIds.usersCollectionId, userId, payload, permissions);
    } catch (createError) {
      throw new Error(
        `Failed to create user profile document for ${userId}. Update error: ${
          updateError instanceof Error ? updateError.message : String(updateError)
        }. Create error: ${createError instanceof Error ? createError.message : String(createError)}`,
      );
    }
  }

  return payload;
};

export const buildNewsPayload = (params: {
  title: string;
  summary?: string;
  excerpt?: string;
  content: string;
  imageUrl?: string | null;
  category?: string;
  slug?: string;
  date?: string;
  createdBy?: string;
  authorUid?: string;
  authorName?: string;
  publishedAt?: string;
  updatedAt?: string;
  status?: string;
  isFeatured?: boolean;
  links?: { name: string; url: string }[];
}) => ({
  title: params.title,
  summary: params.summary || params.excerpt || '',
  excerpt: params.excerpt || params.summary || '',
  content: params.content,
  imageUrl: params.imageUrl || '',
  category: params.category || 'News',
  slug:
    params.slug ||
    params.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  date: params.date || new Date().toLocaleDateString('en-US'),
  createdBy: params.createdBy || '',
  authorUid: params.authorUid || params.createdBy || '',
  authorName: params.authorName || '',
  publishedAt: params.publishedAt || nowIso(),
  updatedAt: params.updatedAt || nowIso(),
  status: params.status || 'published',
  isFeatured: Boolean(params.isFeatured),
  linksJson: JSON.stringify(params.links || []),
});

export const buildNotificationPayload = (params: {
  title: string;
  message?: string;
  body?: string;
  link?: string;
  type?: string;
  newsId?: string;
  createdBy?: string;
}) => ({
  title: params.title,
  message: params.message || params.body || '',
  body: params.body || params.message || '',
  link: params.link || '',
  type: params.type || 'broadcast',
  newsId: params.newsId || '',
  createdBy: params.createdBy || '',
  createdAt: nowIso(),
});

export {
  account,
  databases,
  storage,
  client,
  ID,
  Query,
  Permission,
  Role,
  OAuthProvider,
};
