export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.18:3000";

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}
