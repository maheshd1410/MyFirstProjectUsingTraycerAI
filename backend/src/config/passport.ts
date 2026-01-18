import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { OAuthUserProfile } from '../types';

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user profile data
          const userProfile: OAuthUserProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImage: profile.photos?.[0]?.value,
          };

          return done(null, userProfile);
        } catch (error) {
          return done(error as Error);
        }
      }
    ) as any
  );
}

// Configure Apple OAuth Strategy
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY,
        callbackURL: `${process.env.API_URL}/api/auth/apple/callback`,
        scope: ['name', 'email'],
      },
      (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
        try {
          // Extract user profile data
          const userProfile: OAuthUserProfile = {
            id: profile.id,
            email: profile.email || '',
            firstName: profile.name?.firstName || '',
            lastName: profile.name?.lastName || '',
            profileImage: undefined, // Apple doesn't provide profile images
          };

          return done(null, userProfile);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Serialize user for session (not used in JWT auth, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
