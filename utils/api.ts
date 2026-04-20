import { TokenStorage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.propulse.app';

export interface FetchPayload {
  contentType?: string;
  removeToken?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any>;
  path?: string;
  url?: string;
}

export interface FetchResponse {
  message: string;
  code?: string;
  success: boolean;
  errors?: Record<string, any> | null;
  data?: any;
}

let _signOutCallback: (() => void) | null = null;

export const registerSignOutCallback = (cb: () => void) => {
  _signOutCallback = cb;
};

export const Fetch = async (props: FetchPayload): Promise<FetchResponse> => {
  const {
    contentType = 'application/json',
    removeToken = false,
    body = undefined,
    method = 'GET',
    path,
    url,
  } = props;

  if (!url && !path) throw new Error('One of url or path must be provided');

  const endpoint = url ?? `${API_URL}${path}`;
  console.log('API ENDPOINT:', endpoint, 'API_URL:', API_URL);
  const token = !removeToken ? await TokenStorage.getToken() : null;

  let json: FetchResponse = {
    message: 'An error occurred',
    code: 'unknown_error',
    success: false,
    errors: null,
    data: null,
  };

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'FRONTEND-APP-URL': 'https://app.getpropulse.app',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...(body && !['GET', 'DELETE'].includes(method)
      ? { body: JSON.stringify(body) }
      : {}),
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      const isExpiredToken = ['token_invalid', 'token_not_valid'].includes(
        data?.code
      );
      if (isExpiredToken && _signOutCallback) {
        _signOutCallback();
      }
    }

    json = data as FetchResponse;
  } catch (error: any) {
    json.message = error?.message ?? 'A network error occurred';
  }

  return json;
};
