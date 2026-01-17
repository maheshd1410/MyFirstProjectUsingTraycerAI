declare namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    EXPO_PUBLIC_API_BASE_URL: string;
    EXPO_PUBLIC_API_TIMEOUT: string;
    
    // Stripe Configuration
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    
    // Firebase Configuration
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    EXPO_PUBLIC_FIREBASE_APP_ID: string;
    
    // App Metadata
    APP_NAME: string;
    APP_VERSION: string;
  }
}
