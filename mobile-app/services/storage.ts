/**
 * Auth Storage Service
 *
 * Security Design:
 * - Native (iOS / Android): Uses `expo-secure-store` which stores tokens in the
 *   hardware-backed iOS Keychain and Android KeyStore / EncryptedSharedPreferences.
 * - Web: Uses `sessionStorage` (scoped to browser tab) instead of persistent localStorage
 *   to mitigate cross-tab token scraping and persistent XSS risks.
 * - Note: For dedicated standalone web production apps, httpOnly SameSite cookies
 *   are recommended when deploying to web domains.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'trackintern_access_token';
const REFRESH_TOKEN_KEY = 'trackintern_refresh_token';
const USER_KEY = 'trackintern_user';

const getWebStorage = (): Storage | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.sessionStorage || window.localStorage;
  }
  return null;
};

export const storage = {
  async getAccessToken(): Promise<string | null> {
    try {
      const webStore = getWebStorage();
      if (webStore) {
        return webStore.getItem(ACCESS_TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      const webStore = getWebStorage();
      if (webStore) {
        webStore.setItem(ACCESS_TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving access token:', e);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const webStore = getWebStorage();
      if (webStore) {
        return webStore.getItem(REFRESH_TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      const webStore = getWebStorage();
      if (webStore) {
        webStore.setItem(REFRESH_TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving refresh token:', e);
    }
  },

  async saveAuthData(accessToken: string, refreshToken: string, user: any): Promise<void> {
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
    if (user) {
      const userStr = JSON.stringify(user);
      const webStore = getWebStorage();
      if (webStore) {
        webStore.setItem(USER_KEY, userStr);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userStr);
      }
    }
  },

  async getStoredUser(): Promise<any | null> {
    try {
      const webStore = getWebStorage();
      let userStr: string | null = null;
      if (webStore) {
        userStr = webStore.getItem(USER_KEY);
      } else {
        userStr = await SecureStore.getItemAsync(USER_KEY);
      }
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async clearAuthData(): Promise<void> {
    try {
      const webStore = getWebStorage();
      if (webStore) {
        webStore.removeItem(ACCESS_TOKEN_KEY);
        webStore.removeItem(REFRESH_TOKEN_KEY);
        webStore.removeItem(USER_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.error('Error clearing auth storage:', e);
    }
  },
};
