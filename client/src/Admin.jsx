import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ImagePlus,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
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
const categoryName = (category) =>
  categories.find((item) => item[0] === category)?.[1] || category;

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [products, setProducts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [settings, setSettings] = useState({ whatsappNumber: "" });
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
        if (config.debugMode && config.debugAdmin) {
          setLogin({
            email: config.debugAdmin.email,
            password: config.debugAdmin.password,
          });
        }
      })
      .catch(() => {});
    api("/auth/me")
      .then(async (session) => {
        setUser(session);
        await loadData();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
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
      setLogin({ email: "", password: "" });
    } catch (error) {
      setError(error.message);
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
  function startNew() {
    setForm(blank);
    setFiles([]);
    setMessage("");
    setError("");
    document
      .querySelector("#formulario")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  function edit(item) {
    setForm({
      ...item,
      specsText: Array.isArray(item.specs) ? item.specs.join("\n") : "",
    });
    setFiles([]);
    setMessage("");
    setError("");
    document
      .querySelector("#formulario")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
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
      setForm({
        ...product,
        specsText: Array.isArray(product.specs) ? product.specs.join("\n") : "",
      });
      if (files.length) {
        const body = new FormData();
        files.forEach((file) => body.append("images", file));
        product = await api(`/admin/products/${product.id}/images`, {
          method: "POST",
          body,
        });
      }
      await loadData();
      setForm({
        ...product,
        specsText: Array.isArray(product.specs) ? product.specs.join("\n") : "",
      });
      setFiles([]);
      const input = document.querySelector("#productImages");
      if (input) input.value = "";
      setMessage("Producto guardado y publicado según el estado elegido.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
  async function removeImage(imageId) {
    if (!confirm("¿Quitar esta foto del producto?")) return;
    try {
      await api(`/admin/images/${imageId}`, { method: "DELETE" });
      const next = form.images.filter((image) => image.id !== imageId);
      setForm((current) => ({ ...current, images: next }));
      await loadData();
    } catch (error) {
      setError(error.message);
    }
  }
  async function archive(item) {
    if (!confirm(`¿Archivar ${item.stockId}? Dejará de verse en el catálogo.`))
      return;
    try {
      await api(`/admin/products/${item.id}`, { method: "DELETE" });
      await loadData();
      setMessage(`${item.stockId} archivado.`);
    } catch (error) {
      setError(error.message);
    }
  }
  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const value = settings.whatsappNumber.replace(/\D/g, "");
      const result = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ whatsappNumber: value }),
      });
      setSettings(result);
      setMessage("Número de WhatsApp guardado. El carrito ya lo utiliza.");
    } catch (error) {
      setError(error.message);
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
              onChange={(event) =>
                setLogin({ ...login, email: event.target.value })
              }
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={login.password}
              onChange={(event) =>
                setLogin({ ...login, password: event.target.value })
              }
            />
          </label>
          {error && (
            <span className="form-error" role="alert">
              {error}
            </span>
          )}
          <button className="button button-gold" type="submit">
            Entrar <ArrowRight size={16} />
          </button>
          <a href="/">Volver al catálogo</a>
        </form>
      </div>
    );

  return (
    <div className="admin-body">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/assets/logo-dorado.png" alt="Saúl Guitars" />
        </a>
        <span className="admin-sidebar-label">PANEL DE CATÁLOGO</span>
        <nav aria-label="Navegación del panel">
          <a className="admin-nav active" href="#resumen">
            <ShoppingBag size={15} /> Resumen
          </a>
          <a className="admin-nav" href="#productos">
            <Search size={15} /> Productos
          </a>
          <a className="admin-nav" href="#formulario">
            <Plus size={15} /> Ficha de producto
          </a>
          <a className="admin-nav" href="#configuracion">
            <Settings size={15} /> Configuración
          </a>
          <a className="admin-nav" href="#mailing">
            <Mail size={15} /> Mailing
          </a>
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
            <span className="eyebrow">SAÚL GUITARS</span>
            <h1>Panel de productos</h1>
          </div>
          <a href="/" className="admin-view-link">
            Ver sitio <ArrowUpRight size={15} />
          </a>
        </header>
        <section
          className="admin-stats"
          id="resumen"
          aria-label="Resumen del catálogo"
        >
          <div>
            <span>PRODUCTOS EN STOCK</span>
            <strong>{products.length}</strong>
            <ShoppingBag size={23} />
          </div>
          <div>
            <span>PUBLICADOS</span>
            <strong>
              {products.filter((item) => item.status === "published").length}
            </strong>
            <Check size={23} />
          </div>
          <div>
            <span>SUSCRIPTORES</span>
            <strong>{subscribers.length}</strong>
            <Mail size={23} />
          </div>
        </section>
        {message && (
          <p className="admin-message" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <section className="admin-panel" id="productos">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">GESTIÓN DE STOCK</span>
              <h2>Productos</h2>
            </div>
            <button className="button button-gold" onClick={startNew}>
              <Plus size={15} /> Agregar producto
            </button>
          </div>
          <div className="admin-list-filter">
            <label>
              <Search size={14} />
              <span className="sr-only">Buscar en el panel</span>
              <input
                type="search"
                placeholder="Buscar por modelo, marca o código"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
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
                      <div className="row-actions">
                        <button
                          onClick={() => edit(item)}
                          aria-label={`Editar ${item.stockId}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => archive(item)}
                          aria-label={`Archivar ${item.stockId}`}
                          disabled={item.status === "archived"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && <p>No hay productos con esos filtros.</p>}
          </div>
        </section>
        <section className="admin-panel form-panel" id="formulario">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">FICHA DE PRODUCTO</span>
              <h2>{form.id ? `Editar ${form.stockId}` : "Agregar producto"}</h2>
            </div>
            <button className="form-reset" onClick={startNew}>
              Nueva ficha <Plus size={14} />
            </button>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              <label>
                Código de stock
                <input
                  required
                  maxLength={40}
                  value={form.stockId}
                  onChange={(event) => update("stockId", event.target.value)}
                  placeholder="SG-029"
                />
              </label>
              <label>
                Marca
                <input
                  required
                  maxLength={80}
                  value={form.brand}
                  onChange={(event) => update("brand", event.target.value)}
                />
              </label>
              <label className="wide-field">
                Modelo
                <input
                  required
                  maxLength={180}
                  value={form.model}
                  onChange={(event) => update("model", event.target.value)}
                />
              </label>
              <label>
                Categoría
                <select
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
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
                  onChange={(event) => update("status", event.target.value)}
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
                  onChange={(event) => update("year", event.target.value)}
                />
              </label>
              <label>
                Color / acabado
                <input
                  maxLength={100}
                  value={form.color}
                  onChange={(event) => update("color", event.target.value)}
                />
              </label>
              <label>
                Número de serie <small>Solo visible en el panel</small>
                <input
                  maxLength={100}
                  value={form.serial}
                  onChange={(event) => update("serial", event.target.value)}
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
                  onChange={(event) => update("cost", event.target.value)}
                />
              </label>
              <label>
                Valor de venta
                <input
                  maxLength={100}
                  value={form.salePrice}
                  onChange={(event) => update("salePrice", event.target.value)}
                />
              </label>
              <label>
                Valor de cierre
                <input
                  maxLength={100}
                  value={form.closePrice}
                  onChange={(event) => update("closePrice", event.target.value)}
                />
              </label>
              <label>
                Ganancia
                <input
                  maxLength={100}
                  value={form.profit}
                  onChange={(event) => update("profit", event.target.value)}
                />
              </label>
              <label className="wide-field">
                Descripción
                <textarea
                  rows={7}
                  maxLength={10000}
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </label>
              <label className="wide-field">
                Características <small>Una por línea</small>
                <textarea
                  rows={5}
                  value={form.specsText}
                  onChange={(event) => update("specsText", event.target.value)}
                />
              </label>
              <label className="wide-field">
                Agregar fotos{" "}
                <small>
                  JPG, PNG o WebP · hasta 8 MB cada una · máximo 8 por carga
                </small>
                <input
                  id="productImages"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => setFiles([...event.target.files])}
                />
              </label>
            </div>
            {form.images?.length > 0 && (
              <div className="admin-gallery">
                {form.images.map((image) => (
                  <div key={image.id}>
                    <img src={image.src} alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label="Quitar foto"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button
                className="button button-gold"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar producto"}{" "}
                <ArrowRight size={15} />
              </button>
              <span role="status">{message}</span>
            </div>
          </form>
        </section>
        <section className="admin-panel" id="configuracion">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">CONTACTO</span>
              <h2>WhatsApp</h2>
            </div>
          </div>
          <p className="admin-help">
            El carrito arma una consulta con todas las piezas elegidas. Cuando
            cargues el número comercial, los mensajes se dirigirán a ese
            WhatsApp.
          </p>
          <form className="settings-form" onSubmit={saveSettings}>
            <label>
              Número con código de país, solo dígitos
              <input
                inputMode="tel"
                placeholder="54911…"
                value={settings.whatsappNumber}
                onChange={(event) =>
                  setSettings({ whatsappNumber: event.target.value })
                }
              />
            </label>
            <button className="button button-gold">
              Guardar número <ArrowRight size={14} />
            </button>
          </form>
        </section>
        <section className="admin-panel" id="mailing">
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
              Descargar CSV <ArrowRight size={14} />
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
        <footer className="admin-footer">
          Saúl Guitars · Hecho por{" "}
          <a href="https://zigodev.com.ar" target="_blank" rel="noreferrer">
            zigodev
          </a>
        </footer>
      </main>
    </div>
  );
}
