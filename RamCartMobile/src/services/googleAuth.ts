import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Complete auth session if returning from web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Public Web Client ID matching the website's Google / Firebase configuration
const GOOGLE_WEB_CLIENT_ID = '128549464864-web.apps.googleusercontent.com'; // or web OAuth Client ID

export interface GoogleUser {
  email: string;
  name: string;
  id: string;
  picture?: string;
}

/**
 * Perform Google OAuth authorization using Expo WebBrowser & AuthSession
 */
export async function promptGoogleAuth(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'ramcartmobile',
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params?.access_token) {
      const accessToken = result.params.access_token;
      
      // Fetch Google User Profile info using access token
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const userInfo = await userInfoResponse.json();

      if (userInfo && userInfo.email) {
        return {
          success: true,
          user: {
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            id: userInfo.id,
            picture: userInfo.picture,
          },
        };
      }
    } else if (result.type === 'dismiss' || result.type === 'cancel') {
      return { success: false, error: 'Google sign-in was canceled.' };
    }

    return { success: false, error: 'Failed to authenticate with Google.' };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred during Google authentication.',
    };
  }
}
