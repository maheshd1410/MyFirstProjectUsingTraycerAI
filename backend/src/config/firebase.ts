import admin from 'firebase-admin';

let firebaseInitialized = false;

export const initializeFirebase = (): void => {
  if (firebaseInitialized) {
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('Firebase Admin SDK credentials not configured. Push notifications will be disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    firebaseInitialized = true;
    console.log('✓ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
};

export const isFirebaseInitialized = (): boolean => {
  return firebaseInitialized;
};

export const getFirebaseAdmin = (): typeof admin => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin SDK is not initialized');
  }
  return admin;
};

// Initialize Firebase on module load
initializeFirebase();

export default admin;
