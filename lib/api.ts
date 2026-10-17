// URL pública del backend. Se toma en el build desde NEXT_PUBLIC_API_URL;
// si no está definida se usa el servicio publicado en Render.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://capsule-corp-api-mc.onrender.com"
).replace(/\/$/, "");

export type Producto = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  createdAt: string;
};

export type ProductoInput = {
  nombre?: string;
  categoria?: string;
  precio?: number;
  stock?: number;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}

export const api = {
  listar: () => request<Producto[]>("/api/productos"),

  obtener: (id: number) => request<Producto>(`/api/productos/${id}`),

  crear: (producto: ProductoInput) =>
    request<Producto>("/api/productos", { method: "POST", body: JSON.stringify(producto) }),

  actualizar: (id: number, producto: ProductoInput) =>
    request<Producto>(`/api/productos/${id}`, { method: "PUT", body: JSON.stringify(producto) }),

  eliminar: (id: number) => request<void>(`/api/productos/${id}`, { method: "DELETE" }),
};
