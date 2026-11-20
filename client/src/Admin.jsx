import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  ImagePlus,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { api } from "./api.js";

const categories = [
  ["electricas", "Eléctricas"],
  ["acusticas", "Acústicas"],
  ["amplificadores", "Amplificadores"],
  ["pedales", "Pedales"],
  ["bajos", "Bajos"],
  ["merch", "Merch"],
];
const blank = {
  stockId: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  serial: "",
  cost: "",
  salePrice: "",
  closePrice: "",
  profit: "",
  category: "electricas",
  description: "",
  specsText: "",
  status: "published",
  images: [],
};
const routes = {
  "/admin": "resumen",
  "/admin/productos": "productos",
  "/admin/configuracion": "configuracion",
  "/admin/mailing": "mailing",
};
const titles = {
  resumen: ["Resumen", "Estado general del catálogo"],
  productos: ["Productos", "Inventario y publicación"],
  configuracion: ["Configuración", "Preferencias del catálogo"],
  mailing: ["Mailing", "Suscriptores y novedades"],
};
const categoryName = (value) =>
  categories.find(([key]) => key === value)?.[1] || value;
const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

function ProductFields({ form, update }) {
  return (
    <div className="form-grid">
      <label>
        Código de stock
        <input
          required
          maxLength={40}
          value={form.stockId}
          onChange={(e) => update("stockId", e.target.value)}
          placeholder="SG-029"
        />
      </label>
      <label>
        Marca
        <input
          required
          maxLength={80}
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
        />
      </label>
      <label className="wide-field">
        Modelo
        <input
          required
          maxLength={180}
          value={form.model}
          onChange={(e) => update("model", e.target.value)}
        />
      </label>
      <label>
        Categoría
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
        >
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Estado
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
          <option value="archived">Archivado</option>
        </select>
      </label>
      <label>
        Año
        <input
          maxLength={20}
          value={form.year}
          onChange={(e) => update("year", e.target.value)}
        />
      </label>
      <label>
        Color / acabado
        <input
          maxLength={100}
          value={form.color}
          onChange={(e) => update("color", e.target.value)}
        />
      </label>
      <label>
        Número de serie <small>Solo visible en el panel</small>
        <input
          maxLength={100}
          value={form.serial}
          onChange={(e) => update("serial", e.target.value)}
        />
      </label>
      <div className="wide-field internal-heading">
        DATOS INTERNOS · NO VISIBLES EN EL CATÁLOGO
      </div>
      <label>
        Costo
        <input
          maxLength={100}
          value={form.cost}
          onChange={(e) => update("cost", e.target.value)}
        />
      </label>
      <label>
        Valor de venta
        <input
          maxLength={100}
          value={form.salePrice}
          onChange={(e) => update("salePrice", e.target.value)}
        />
      </label>
      <label>
        Valor de cierre
        <input
          maxLength={100}
          value={form.closePrice}
          onChange={(e) => update("closePrice", e.target.value)}
        />
      </label>
      <label>
        Ganancia
        <input
          maxLength={100}
          value={form.profit}
          onChange={(e) => update("profit", e.target.value)}
        />
      </label>
      <label className="wide-field">
        Descripción
        <textarea
          rows={6}
          maxLength={10000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>
      <label className="wide-field">
        Características <small>Una por línea</small>
        <textarea
          rows={4}
          value={form.specsText}
          onChange={(e) => update("specsText", e.target.value)}
        />
      </label>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [products, setProducts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [settings, setSettings] = useState({ whatsappNumber: "" });
  const [form, setForm] = useState(blank);
  const [pendingImages, setPendingImages] = useState([]);
  const [coverChoice, setCoverChoice] = useState(null);
  const [modal, setModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState(routes[location.pathname] || "resumen");

  const visible = useMemo(
    () =>
      products.filter(
        (item) =>
          (category === "all" || item.category === category) &&
          `${item.stockId} ${item.brand} ${item.model}`
            .toLocaleLowerCase("es")
            .includes(search.toLocaleLowerCase("es")),
      ),
    [products, category, search],
  );

  async function loadData() {
    const [items, config, mailing] = await Promise.all([
      api("/admin/products"),
      api("/admin/settings"),
      api("/admin/subscribers"),
    ]);
    setProducts(items);
    setSettings(config);
    setSubscribers(mailing);
  }

  useEffect(() => {
    api("/config")
      .then((config) => {
        if (config.debugMode && config.debugAdmin) setLogin(config.debugAdmin);
      })
      .catch(() => {});
    api("/auth/me")
      .then(async (session) => {
        setUser(session);
        await loadData();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    const sync = () => setView(routes[location.pathname] || "resumen");
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (!modal) return undefined;
    const escape = (event) => {
      if (event.key === "Escape" && !saving) closeModal();
    };
    document.body.classList.add("modal-open");
    addEventListener("keydown", escape);
    return () => {
      document.body.classList.remove("modal-open");
      removeEventListener("keydown", escape);
    };
  }, [modal, saving]);

  function navigate(path) {
    history.pushState({}, "", path);
    setView(routes[path]);
    setMessage("");
    setError("");
    scrollTo({ top: 0, behavior: "smooth" });
  }
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function clearPending() {
    setPendingImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  }
  function openNew() {
    clearPending();
    setForm({ ...blank, images: [] });
    setCoverChoice(null);
    setError("");
    setModal(true);
  }
  function edit(item) {
    clearPending();
    setForm({
      ...item,
      images: [...item.images],
      specsText: Array.isArray(item.specs) ? item.specs.join("\n") : "",
    });
    setCoverChoice(item.images[0]?.id || null);
    setError("");
    setModal(true);
  }
  function closeModal() {
    if (saving) return;
    clearPending();
    setModal(false);
    setError("");
  }

  function addFiles(fileList) {
    const files = [...fileList];
    const valid = files
      .filter(
        (file) =>
          ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
          file.size <= 8 * 1024 * 1024,
      )
      .slice(0, Math.max(0, 8 - pendingImages.length));
    setError(
      valid.length === files.length
        ? ""
        : "Algunas fotos no se agregaron. Usá JPG, PNG o WebP de hasta 8 MB (máximo 8 por carga).",
    );
    const next = valid.map((file) => ({
      file,
      key: fileKey(file),
      preview: URL.createObjectURL(file),
    }));
    setPendingImages((current) => [...current, ...next]);
    if (!coverChoice && next[0]) setCoverChoice(`pending:${next[0].key}`);
  }

  function removePending(key) {
    setPendingImages((current) => {
      const target = current.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.key !== key);
    });
    if (coverChoice === `pending:${key}`)
      setCoverChoice(form.images[0]?.id || null);
  }

  async function signIn(event) {
    event.preventDefault();
    setError("");
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(login),
      });
      setUser(session);
      await loadData();
    } catch (caught) {
      setError(caught.message);
    }
  }
  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setProducts([]);
    }
  }

  async function removeImage(id) {
    if (!confirm("¿Quitar esta foto del producto?")) return;
    try {
      await api(`/admin/images/${id}`, { method: "DELETE" });
      setForm((current) => ({
        ...current,
        images: current.images.filter((image) => image.id !== id),
      }));
      if (coverChoice === id)
        setCoverChoice(
          form.images.find((image) => image.id !== id)?.id || null,
        );
      await loadData();
    } catch (caught) {
      setError(caught.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        stockId: form.stockId.trim().toUpperCase(),
        brand: form.brand,
        model: form.model,
        year: form.year,
        color: form.color,
        serial: form.serial,
        cost: form.cost,
        salePrice: form.salePrice,
        closePrice: form.closePrice,
        profit: form.profit,
        category: form.category,
        description: form.description,
        specs: form.specsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        status: form.status,
      };
      let product = await api(
        form.id ? `/admin/products/${form.id}` : "/admin/products",
        { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      const originalIds = new Set(product.images.map((image) => image.id));
      if (pendingImages.length) {
        const body = new FormData();
        pendingImages.forEach((item) => body.append("images", item.file));
        product = await api(`/admin/products/${product.id}/images`, {
          method: "POST",
          body,
        });
      }
      if (product.images.length) {
        const existing = form.images
          .map((image) => image.id)
          .filter((id) => product.images.some((image) => image.id === id));
        const uploaded = product.images.filter(
          (image) => !originalIds.has(image.id),
        );
        let chosen = coverChoice;
        if (String(chosen).startsWith("pending:")) {
          const index = pendingImages.findIndex(
            (item) => item.key === String(chosen).slice(8),
          );
          chosen = uploaded[index]?.id;
        }
        const imageIds = [...existing, ...uploaded.map((image) => image.id)];
        if (chosen && imageIds.includes(chosen)) {
          imageIds.splice(imageIds.indexOf(chosen), 1);
          imageIds.unshift(chosen);
        }
        product = await api(`/admin/products/${product.id}/images/order`, {
          method: "PUT",
          body: JSON.stringify({ imageIds }),
        });
      }
      clearPending();
      await loadData();
      setModal(false);
      setMessage(`${product.stockId} guardado correctamente.`);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  async function archive(item) {
    if (!confirm(`¿Archivar ${item.stockId}? Dejará de verse en el catálogo.`))
      return;
    try {
      await api(`/admin/products/${item.id}`, { method: "DELETE" });
      await loadData();
      setMessage(`${item.stockId} archivado.`);
    } catch (caught) {
      setError(caught.message);
    }
  }
  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    try {
      const value = settings.whatsappNumber.replace(/\D/g, "");
      const result = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ whatsappNumber: value }),
      });
      setSettings(result);
      setMessage("Número de WhatsApp guardado. El carrito ya lo utiliza.");
    } catch (caught) {
      setError(caught.message);
    }
  }

  function exportSubscribers() {
    const rows = [
      ["email", "fecha"],
      ...subscribers.map((item) => [
        item.email,
        new Date(item.createdAt).toISOString().slice(0, 10),
      ]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "saul-guitars-suscriptores.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="admin-loading">Cargando panel…</div>;
  if (!user)
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={signIn}>
          <img src="/assets/logo-dorado.png" alt="Saúl Guitars" />
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Ingresá al panel.</h1>
          <p>Gestioná las piezas, fotos y datos del catálogo.</p>
          {login.email && login.password && (
            <span className="debug-login-note">Modo debug activo</span>
          )}
          <label>
            Correo
            <input
              type="email"
              required
              autoComplete="username"
              value={login.email}
              onChange={(e) => setLogin({ ...login, email: e.target.value })}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
            />
          </label>
          {error && (
            <span className="form-error" role="alert">
              {error}
            </span>
          )}
          <button className="button button-gold">
            Entrar <ArrowRight size={16} />
          </button>
          <a href="/">Volver al catálogo</a>
        </form>
      </div>
    );

  const nav = [
    ["/admin", "resumen", LayoutDashboard, "Resumen"],
    ["/admin/productos", "productos", ShoppingBag, "Productos"],
    ["/admin/configuracion", "configuracion", Settings, "Configuración"],
    ["/admin/mailing", "mailing", Mail, "Mailing"],
  ];
  return (
    <div className="admin-body">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/assets/logo-dorado.png" alt="Saúl Guitars" />
        </a>
        <span className="admin-sidebar-label">PANEL DE CATÁLOGO</span>
        <nav aria-label="Navegación del panel">
          {nav.map(([path, key, Icon, label]) => (
            <a
              key={key}
              className={`admin-nav ${view === key ? "active" : ""}`}
              aria-current={view === key ? "page" : undefined}
              href={path}
              onClick={(e) => {
                e.preventDefault();
                navigate(path);
              }}
            >
              <Icon size={15} /> {label}
            </a>
          ))}
          <a className="admin-nav" href="/">
            <ArrowUpRight size={15} /> Ver catálogo
          </a>
        </nav>
        <div className="admin-sidebar-footer">
          {user.email}
          <button onClick={signOut}>
            <LogOut size={13} /> Salir
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">{titles[view][0]}</span>
            <h1>{titles[view][1]}</h1>
          </div>
          <a href="/" className="admin-view-link">
            Ver sitio <ArrowUpRight size={15} />
          </a>
        </header>
        {message && (
          <p className="admin-message" role="status">
            <Check size={16} /> {message}
          </p>
        )}
        {error && !modal && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {view === "resumen" && (
          <section className="admin-page" aria-label="Resumen del catálogo">
            <div className="admin-stats">
              <div>
                <span>PRODUCTOS EN STOCK</span>
                <strong>{products.length}</strong>
                <ShoppingBag size={23} />
              </div>
              <div>
                <span>PUBLICADOS</span>
                <strong>
                  {
                    products.filter((item) => item.status === "published")
                      .length
                  }
                </strong>
                <Check size={23} />
              </div>
              <div>
                <span>SUSCRIPTORES</span>
                <strong>{subscribers.length}</strong>
                <Mail size={23} />
              </div>
            </div>
            <div className="dashboard-grid">
              <article className="admin-panel dashboard-card">
                <span className="eyebrow">ACCESO RÁPIDO</span>
                <h2>Gestioná el inventario</h2>
                <p>
                  Publicá nuevas piezas, actualizá datos y elegí la foto de
                  portada de cada producto.
                </p>
                <button
                  className="button button-gold"
                  onClick={() => navigate("/admin/productos")}
                >
                  Ver productos <ArrowRight size={15} />
                </button>
              </article>
              <article className="admin-panel dashboard-card dark">
                <Images size={28} />
                <h2>Galerías claras y ordenadas</h2>
                <p>
                  Cada ficha permite cargar miniaturas y destacar una portada
                  para el catálogo.
                </p>
              </article>
            </div>
          </section>
        )}

        {view === "productos" && (
          <section className="admin-page admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">GESTIÓN DE STOCK</span>
                <h2>Todos los productos</h2>
              </div>
              <button className="button button-gold" onClick={openNew}>
                <Plus size={15} /> Agregar producto
              </button>
            </div>
            <div className="admin-list-filter">
              <label>
                <Search size={14} />
                <span className="sr-only">Buscar</span>
                <input
                  type="search"
                  placeholder="Buscar por modelo, marca o código"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Filtrar por categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCTO</th>
                    <th>CATEGORÍA</th>
                    <th>AÑO</th>
                    <th>ESTADO</th>
                    <th>FOTOS</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="product-cell">
                          {item.images[0] ? (
                            <img src={item.images[0].src} alt="" />
                          ) : (
                            <div className="admin-no-photo">
                              <ImagePlus size={19} />
                            </div>
                          )}
                          <div>
                            <strong>
                              {item.brand} {item.model}
                            </strong>
                            <small>{item.stockId}</small>
                          </div>
                        </div>
                      </td>
                      <td>{categoryName(item.category)}</td>
                      <td>{item.year || "—"}</td>
                      <td>
                        <span className={`status-pill ${item.status}`}>
                          {item.status === "published"
                            ? "Publicado"
                            : item.status === "draft"
                              ? "Borrador"
                              : "Archivado"}
                        </span>
                      </td>
                      <td>
                        <span className="photo-count">
                          <Images size={14} /> {item.images.length}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => edit(item)}
                            aria-label={`Editar ${item.stockId}`}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => archive(item)}
                            aria-label={`Archivar ${item.stockId}`}
                            disabled={item.status === "archived"}
                            title="Archivar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length && (
                <p className="empty-state">
                  No hay productos con esos filtros.
                </p>
              )}
            </div>
          </section>
        )}

        {view === "configuracion" && (
          <section className="admin-page admin-panel settings-page">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">CONTACTO</span>
                <h2>WhatsApp del comercio</h2>
              </div>
            </div>
            <p className="admin-help">
              El carrito arma una consulta con todas las piezas elegidas. Cargá
              el número comercial para recibir los mensajes.
            </p>
            <form className="settings-form" onSubmit={saveSettings}>
              <label>
                Número con código de país, solo dígitos
                <input
                  inputMode="tel"
                  placeholder="54911…"
                  value={settings.whatsappNumber}
                  onChange={(e) =>
                    setSettings({ whatsappNumber: e.target.value })
                  }
                />
              </label>
              <button className="button button-gold">
                Guardar número <ArrowRight size={14} />
              </button>
            </form>
          </section>
        )}
        {view === "mailing" && (
          <section className="admin-page admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">NOVEDADES</span>
                <h2>Suscriptores</h2>
              </div>
              <button
                className="form-reset"
                onClick={exportSubscribers}
                disabled={!subscribers.length}
              >
                <Download size={14} /> Descargar CSV
              </button>
            </div>
            <div className="subscriber-list">
              {subscribers.length ? (
                subscribers.map((item) => (
                  <div key={item.id}>
                    <span>{item.email}</span>
                    <small>
                      {new Date(item.createdAt).toLocaleDateString("es-AR")}
                    </small>
                  </div>
                ))
              ) : (
                <p>Todavía no hay suscriptores.</p>
              )}
            </div>
          </section>
        )}
        <footer className="admin-footer">
          Saúl Guitars · Hecho por{" "}
          <a
            href="https://zigodev.com.ar"
            target="_blank"
            rel="noopener noreferrer"
          >
            zigodev
          </a>
        </footer>
      </main>

      {modal && (
        <div
          className="product-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
          >
            <header className="product-modal-header">
              <div>
                <span className="eyebrow">FICHA DE PRODUCTO</span>
                <h2 id="product-title">
                  {form.id ? `Editar ${form.stockId}` : "Agregar producto"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar modal"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </header>
            <form className="product-form" onSubmit={save}>
              <div className="product-modal-content">
                {error && (
                  <p className="form-error modal-error" role="alert">
                    {error}
                  </p>
                )}
                <ProductFields form={form} update={update} />
                <div className="image-manager">
                  <div className="image-manager-heading">
                    <div>
                      <span className="eyebrow">GALERÍA</span>
                      <h3>Fotos del producto</h3>
                    </div>
                    <span className="image-counter">
                      {form.images.length + pendingImages.length} fotos
                    </span>
                  </div>
                  <p>
                    Elegí una miniatura como portada. Esa será la primera imagen
                    del catálogo.
                  </p>
                  <label
                    className={`image-dropzone ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      addFiles(e.dataTransfer.files);
                    }}
                  >
                    <UploadCloud size={28} />
                    <strong>Arrastrá las fotos o elegilas</strong>
                    <span>
                      JPG, PNG o WebP · hasta 8 MB · máximo 8 por carga
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {(form.images.length > 0 || pendingImages.length > 0) && (
                    <div className="admin-gallery">
                      {form.images.map((image) => (
                        <GalleryItem
                          key={image.id}
                          src={image.src}
                          cover={coverChoice === image.id}
                          onCover={() => setCoverChoice(image.id)}
                          onRemove={() => removeImage(image.id)}
                        />
                      ))}
                      {pendingImages.map((item) => (
                        <GalleryItem
                          key={item.key}
                          src={item.preview}
                          isNew
                          cover={coverChoice === `pending:${item.key}`}
                          onCover={() => setCoverChoice(`pending:${item.key}`)}
                          onRemove={() => removePending(item.key)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <footer className="product-modal-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button className="button button-gold" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar producto"}{" "}
                  <ArrowRight size={15} />
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function GalleryItem({ src, cover, isNew = false, onCover, onRemove }) {
  return (
    <article className={`gallery-item ${cover ? "is-cover" : ""}`}>
      <div className="gallery-thumb">
        <img src={src} alt="Miniatura del producto" />
        {isNew && <span className="new-badge">Nueva</span>}
        {cover && (
          <span className="cover-badge">
            <Star size={11} fill="currentColor" /> Portada
          </span>
        )}
        <button
          className="gallery-remove"
          type="button"
          onClick={onRemove}
          aria-label="Quitar foto"
        >
          <X size={14} />
        </button>
      </div>
      <button
        className="cover-action"
        type="button"
        disabled={cover}
        onClick={onCover}
      >
        <Star size={13} />
        {cover
          ? isNew
            ? "Será la portada"
            : "Portada actual"
          : "Usar de portada"}
      </button>
    </article>
  );
}
