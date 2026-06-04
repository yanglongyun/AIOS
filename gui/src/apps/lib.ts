// app 前端共用的 fetch 小工具。每个 app 只跟自己的 /apps/<id>/* 打交道。
export async function appFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any).error || `${response.status} ${response.statusText}`);
  }
  return data as T;
}
