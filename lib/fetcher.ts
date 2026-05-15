export async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ data: T; success: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, data: null as T, error: 'Network error' };
  }
}
