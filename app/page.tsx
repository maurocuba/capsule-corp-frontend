"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, api, type Producto, type ProductoInput } from "@/lib/api";

type EstadoApi = "conectando" | "conectada" | "error";

const FORM_VACIO = { nombre: "", categoria: "", precio: "", stock: "" };

// Ícono por categoría; las categorías nuevas usan el de "General"
const ICONOS: Record<string, string> = {
  "Esferas del Dragón": "🐉",
  Curación: "🌱",
  Tecnología: "📡",
  Cápsulas: "💊",
  Transporte: "☁️",
  Armas: "🥢",
  Vestimenta: "🥋",
  Entrenamiento: "🏋️",
  General: "📦",
};

const STOCK_BAJO = 3;

const zenis = (n: number) =>
  `${n.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Ƶ`;

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estadoApi, setEstadoApi] = useState<EstadoApi>("conectando");
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");

  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const mostrarAviso = (tipo: "ok" | "error", texto: string) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 3500);
  };

  const cargar = useCallback(async () => {
    try {
      setProductos(await api.listar());
      setEstadoApi("conectada");
    } catch {
      setEstadoApi("error");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(productos.map((p) => p.categoria))).sort()],
    [productos]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (categoria === "Todas" || p.categoria === categoria) &&
        (!q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q))
    );
  }, [productos, busqueda, categoria]);

  const stats = useMemo(
    () => ({
      productos: productos.length,
      unidades: productos.reduce((s, p) => s + p.stock, 0),
      valor: productos.reduce((s, p) => s + p.precio * p.stock, 0),
      agotados: productos.filter((p) => p.stock === 0).length,
    }),
    [productos]
  );

  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    try {
      await accion();
      mostrarAviso("ok", mensaje);
      await cargar();
      return true;
    } catch (err) {
      mostrarAviso("error", err instanceof Error ? err.message : "Algo salió mal");
      return false;
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const datos: ProductoInput = {
      nombre: form.nombre,
      categoria: form.categoria.trim() || "General",
      precio: form.precio === "" ? 0 : Number(form.precio),
      stock: form.stock === "" ? 0 : Number(form.stock),
    };
    setGuardando(true);
    const ok = editandoId
      ? await ejecutar(() => api.actualizar(editandoId, datos), "Producto actualizado")
      : await ejecutar(() => api.crear(datos), "Producto guardado en una cápsula 💊");
    setGuardando(false);
    if (ok) cancelarEdicion();
  };

  const editar = (p: Producto) => {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
  };

  const cambiarStock = (p: Producto, delta: number) => {
    const stock = p.stock + delta;
    if (stock < 0) return;
    ejecutar(() => api.actualizar(p.id, { stock }), `Stock de "${p.nombre}": ${stock}`);
  };

  const eliminar = (p: Producto) => {
    if (confirm(`¿Eliminar "${p.nombre}" del inventario?`)) {
      ejecutar(() => api.eliminar(p.id), "Producto eliminado");
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-inner">
              🐉
            </span>
            <div>
              <h1 className="text-xl font-extrabold leading-tight tracking-tight">Capsule Corp</h1>
              <p className="text-xs font-medium text-orange-50">Inventario oficial de objetos de Dragon Ball</p>
            </div>
          </div>
          <a
            href={`${API_URL}/api/health`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/30 backdrop-blur"
            title={API_URL}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                estadoApi === "conectada"
                  ? "bg-emerald-300"
                  : estadoApi === "error"
                    ? "bg-red-300"
                    : "animate-pulse bg-yellow-200"
              }`}
            />
            {estadoApi === "conectada"
              ? "API conectada"
              : estadoApi === "error"
                ? "API sin conexión"
                : "Conectando con la API…"}
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Resumen del inventario */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { etiqueta: "Productos", valor: stats.productos, color: "text-slate-900 dark:text-slate-100" },
            { etiqueta: "Unidades", valor: stats.unidades, color: "text-blue-600 dark:text-blue-400" },
            {
              etiqueta: "Valor total",
              valor: `${stats.valor.toLocaleString("es-BO", { notation: "compact", maximumFractionDigits: 1 })} Ƶ`,
              color: "text-orange-600 dark:text-orange-400",
            },
            { etiqueta: "Agotados", valor: stats.agotados, color: "text-red-600 dark:text-red-400" },
          ].map((s) => (
            <div
              key={s.etiqueta}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.etiqueta}</p>
              <p className={`mt-1 truncate text-2xl font-bold tabular-nums lg:text-3xl ${s.color}`}>
                {cargando ? "–" : s.valor}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Formulario crear / editar */}
          <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold">{editandoId ? "Editar producto" : "Nuevo producto"}</h2>
            <form onSubmit={guardar} className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-medium">
                Nombre *
                <input
                  className={`${inputClass} mt-1`}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Esfera de 7 estrellas"
                  maxLength={100}
                  required
                />
              </label>
              <label className="text-sm font-medium">
                Categoría
                <input
                  className={`${inputClass} mt-1`}
                  list="categorias"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej. Esferas del Dragón"
                  maxLength={50}
                />
                <datalist id="categorias">
                  {Object.keys(ICONOS).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">
                  Precio (Ƶ)
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    placeholder="1500"
                  />
                </label>
                <label className="text-sm font-medium">
                  Stock
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    min={0}
                    step={1}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                  />
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="h-11 flex-1 rounded-lg bg-orange-500 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Agregar al inventario"}
                </button>
                {editandoId && (
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Inventario */}
          <section>
            <input
              className={`${inputClass} sm:max-w-sm`}
              placeholder="Buscar producto o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    categoria === c
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {c !== "Todas" && `${ICONOS[c] ?? ICONOS.General} `}
                  {c}
                </button>
              ))}
            </div>

            {cargando ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
                <p className="font-medium">Buscando las esferas… 🔍</p>
                <p className="mt-1">
                  El backend gratuito de Render se duerme tras unos minutos sin uso; la primera carga puede tardar
                  hasta un minuto.
                </p>
              </div>
            ) : estadoApi === "error" && productos.length === 0 ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                No se pudo conectar con la API.{" "}
                <button onClick={cargar} className="font-semibold underline">
                  Reintentar
                </button>
              </div>
            ) : visibles.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
                No hay productos que coincidan.
              </p>
            ) : (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {visibles.map((p) => (
                  <li
                    key={p.id}
                    className={`flex flex-col rounded-xl border bg-white p-4 dark:bg-slate-900 ${
                      editandoId === p.id
                        ? "border-orange-500 ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-orange-50 text-2xl dark:bg-orange-950/40">
                        {ICONOS[p.categoria] ?? ICONOS.General}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">{p.nombre}</h3>
                        <p className="text-xs text-slate-500">{p.categoria}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.stock === 0
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : p.stock <= STOCK_BAJO
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {p.stock === 0 ? "Agotado" : p.stock <= STOCK_BAJO ? "Pocas unidades" : "En stock"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Precio</p>
                        <p className="font-bold tabular-nums text-orange-600 dark:text-orange-400">{zenis(p.precio)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cambiarStock(p, -1)}
                          disabled={p.stock === 0}
                          aria-label="Quitar una unidad"
                          className="h-8 w-8 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-semibold tabular-nums">{p.stock}</span>
                        <button
                          onClick={() => cambiarStock(p, 1)}
                          aria-label="Agregar una unidad"
                          className="h-8 w-8 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                      <button
                        onClick={() => editar(p)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminar(p)}
                        className="rounded-lg px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
        Next.js en Firebase Hosting · API Express + PostgreSQL en Render
      </footer>

      {aviso && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            aviso.tipo === "ok" ? "bg-slate-900 dark:bg-slate-700" : "bg-red-600"
          }`}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
