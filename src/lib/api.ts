// Same-origin lewat nginx BFF (docker/nginx/default.conf): /api/* -> Laravel.
// Tidak perlu base URL absolut/CORS — browser selalu memanggil origin yang sama
// dengan yang menyajikan halaman Next.js ini.
const TOKEN_KEY = "medknowledge_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  // FormData (upload file) butuh browser yang set Content-Type + boundary
  // sendiri — jangan di-override manual jadi application/json.
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Terjadi kesalahan pada server.",
      response.status,
      data?.errors,
    );
  }

  return data as T;
}

// M15/M16 — GET /sources/{id}/file mengembalikan byte PDF mentah (bukan JSON),
// jadi tidak bisa lewat apiFetch di atas yang selalu memanggil .json(). Dipakai
// PDF viewer untuk fetch file lewat Bearer token lalu diubah jadi object URL,
// karena <iframe src>/PDF.js getDocument(url) langsung tidak bisa membawa
// header Authorization ke request-nya.
export async function apiFetchBlob(path: string): Promise<Blob> {
  const token = getToken();

  const response = await fetch(`/api${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      data?.message ?? "Gagal memuat berkas.",
      response.status,
      data?.errors,
    );
  }

  return response.blob();
}
