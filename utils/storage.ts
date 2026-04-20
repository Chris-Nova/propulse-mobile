import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'propulse_access_token';
const USER_KEY = 'propulse_user';
const REFRESH_KEY = 'propulse_refresh_token';

export const TokenStorage = {
  async setToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setUser(user: object) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async getUser<T = any>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};

// Key-value store for non-sensitive data (replaces localStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async set(key: string, value: any) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async get<T = any>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  async clear() {
    await AsyncStorage.clear();
  },
};
