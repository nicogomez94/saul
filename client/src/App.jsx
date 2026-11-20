import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Guitar,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { api } from "./api.js";

const categories = [
  ["all", "Todos"],
  ["electricas", "Eléctricas"],
  ["acusticas", "Acústicas"],
  ["amplificadores", "Amplificadores"],
  ["pedales", "Pedales"],
  ["bajos", "Bajos"],
  ["merch", "Merch"],
];
const labelFor = (value) =>
  categories.find((item) => item[0] === value)?.[1] || value;
const productTitle = (product) => `${product.brand} ${product.model}`;

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".fade-in")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });
}

function ProductDialog({ product, onClose, onAdd }) {
  const ref = useRef(null);
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    if (!product) return;
    setPhoto(0);
    ref.current?.showModal();
    const preloaders = (product.images || []).map((image) => {
      const preloader = new Image();
      preloader.decoding = "async";
      preloader.src = image.src;
      return preloader;
    });
    return () => preloaders.forEach((preloader) => (preloader.src = ""));
  }, [product]);
  if (!product) return null;
  const photos = product.images || [];
  return (
    <dialog
      ref={ref}
      className="product-dialog"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current.close();
      }}
    >
      <button
        className="dialog-close"
        onClick={() => ref.current.close()}
        aria-label="Cerrar detalle"
      >
        <X size={18} />
      </button>
      <div className="dialog-layout">
        <div className="dialog-media">
          <div className="dialog-photo">
            {photos.length ? (
              <img
                src={photos[photo]?.src}
                alt={`${productTitle(product)}, foto ${photo + 1}`}
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="product-placeholder">
                <Guitar size={46} />
                <span>Fotografía pendiente</span>
              </div>
            )}
            {photos.length > 1 && (
              <div className="photo-controls">
                <button
                  onClick={() =>
                    setPhoto((photo - 1 + photos.length) % photos.length)
                  }
                  aria-label="Foto anterior"
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  {photo + 1} / {photos.length}
                </span>
                <button
                  onClick={() => setPhoto((photo + 1) % photos.length)}
                  aria-label="Foto siguiente"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="dialog-thumbnails" aria-label="Galería de fotos">
              {photos.map((image, index) => (
                <button
                  key={image.id || image.src}
                  className={photo === index ? "active" : ""}
                  onClick={() => setPhoto(index)}
                  aria-label={`Ver foto ${index + 1} de ${productTitle(product)}`}
                  aria-pressed={photo === index}
                >
                  <img
                    src={image.src}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dialog-copy">
          <span className="product-overline">
            {product.stockId} · {labelFor(product.category)}{" "}
            {product.year && `· ${product.year}`}
          </span>
          <h2>{productTitle(product)}</h2>
          <span className="dialog-color">
            {product.color || "Acabado a consultar"}
          </span>
          {product.description ? (
            product.description
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p>Consultanos para conocer los detalles de esta pieza.</p>
          )}
          {product.specs?.length > 0 && (
            <div className="dialog-specs">
              <span>CARACTERÍSTICAS</span>
              <ul>
                {product.specs.map((spec, index) => (
                  <li key={index}>{spec}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="button button-gold"
            onClick={() => {
              onAdd(product.stockId);
              ref.current.close();
            }}
          >
            Agregar a mi selección <Plus size={15} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [config, setConfig] = useState({ whatsappNumber: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("saul_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [email, setEmail] = useState("");
  const [mailingMessage, setMailingMessage] = useState("");
  useReveal();
  useEffect(() => {
    Promise.all([api("/products"), api("/config")])
      .then(([items, settings]) => {
        setProducts(items);
        setConfig(settings);
        setCart((current) =>
          current.filter((id) =>
            items.some((product) => product.stockId === id),
          ),
        );
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(
    () => localStorage.setItem("saul_cart", JSON.stringify(cart)),
    [cart],
  );
  useEffect(() => {
    if (!cartOpen) return;
    const close = (event) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [cartOpen]);
  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand))].sort(),
    [products],
  );
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const text =
          `${product.stockId} ${product.brand} ${product.model} ${product.year} ${product.color}`.toLocaleLowerCase(
            "es",
          );
        return (
          (category === "all" || product.category === category) &&
          (!brand || product.brand === brand) &&
          text.includes(query.toLocaleLowerCase("es"))
        );
      }),
    [products, category, brand, query],
  );
  const cartProducts = cart
    .map((id) => products.find((product) => product.stockId === id))
    .filter(Boolean);
  const addToCart = (id) => {
    setCart((current) => (current.includes(id) ? current : [...current, id]));
    setCartOpen(true);
  };
  const setCategoryAndClose = (value) => {
    setCategory(value);
    setMenuOpen(false);
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  };
  const whatsappText = [
    "Hola, Saúl Guitars. Quiero consultar por estas piezas:",
    ...cartProducts.map(
      (product, index) =>
        `${index + 1}. ${product.stockId} — ${productTitle(product)}${product.year ? ` (${product.year})` : ""}`,
    ),
    "¿Me pueden confirmar disponibilidad y precio?",
  ].join("\n");
  const whatsappUrl = `https://api.whatsapp.com/send?${config.whatsappNumber ? `phone=${encodeURIComponent(config.whatsappNumber)}&` : ""}text=${encodeURIComponent(whatsappText)}`;

  async function subscribe(event) {
    event.preventDefault();
    setMailingMessage("");
    try {
      const result = await api("/subscribers", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMailingMessage(result.message);
      setEmail("");
    } catch (error) {
      setMailingMessage(error.message);
    }
  }

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <button
        className="mobile-menu-button"
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {menuOpen && (
        <button
          className="menu-scrim open"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${menuOpen ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <a className="brand" href="#inicio" onClick={() => setMenuOpen(false)}>
          <img src="/assets/logo-dorado.png" alt="Saúl Guitars" />
        </a>
        <span className="sidebar-caption">BUENOS AIRES · ARGENTINA</span>
        <div className="sidebar-rule" />
        <nav className="side-nav">
          <a
            className="nav-link active"
            href="#inicio"
            onClick={() => setMenuOpen(false)}
          >
            Inicio <ArrowUpRight size={13} />
          </a>
          <div className="nav-group">
            <span className="nav-heading">CATÁLOGO</span>
          </div>
          {categories.slice(1).map(([value, label]) => (
            <button
              key={value}
              className="nav-link"
              onClick={() => setCategoryAndClose(value)}
            >
              {label === "Eléctricas" || label === "Acústicas"
                ? `Guitarras ${label.toLowerCase()}`
                : label}
              <ArrowRight size={13} />
            </button>
          ))}
          <div className="nav-group">
            <span className="nav-heading">SAÚL GUITARS</span>
          </div>
          <a
            className="nav-link"
            href="#nosotros"
            onClick={() => setMenuOpen(false)}
          >
            Nuestra selección <ArrowRight size={13} />
          </a>
          <a
            className="nav-link"
            href="#contacto"
            onClick={() => setMenuOpen(false)}
          >
            Contacto <ArrowRight size={13} />
          </a>
        </nav>
        <div className="sidebar-bottom">
          <a
            href="https://www.instagram.com/saulguitars/"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={14} /> @saulguitars
          </a>
          <span>Instrumentos para tocar toda la vida.</span>
        </div>
      </aside>
      <div className="page-shell">
        <div className="announcement">
          <span>UNA COLECCIÓN ELEGIDA CON OÍDO Y CRITERIO</span>
          <span>BUENOS AIRES · ARGENTINA</span>
        </div>
        <main id="contenido">
          <section className="hero" id="inicio">
            <div className="hero-copy fade-in">
              <div className="eyebrow">
                <span className="eyebrow-line" /> SAÚL GUITARS
              </div>
              <h1>
                Guitarras que <em>dejan huella.</em>
              </h1>
              <p>
                Instrumentos únicos, carácter auténtico. Una selección para
                quienes saben que una gran guitarra se siente desde el primer
                acorde.
              </p>
              <div className="hero-actions">
                <a className="button button-gold" href="#catalogo">
                  Explorar catálogo <ArrowRight size={15} />
                </a>
                <button className="text-link" onClick={() => setCartOpen(true)}>
                  Mi selección ({cart.length}) <ShoppingBag size={14} />
                </button>
              </div>
              <div className="hero-footnote">
                <span>PIEZAS SELECCIONADAS</span>
                <span>CONSULTAS PERSONALIZADAS</span>
              </div>
            </div>
            <div className="hero-visual fade-in">
              <img
                src="/assets/hero.jpg"
                alt="Detalle de una guitarra Saúl Guitars"
              />
              <div className="hero-image-label">
                <span>EL SONIDO TIENE HISTORIA</span>
                <ArrowRight size={15} />
              </div>
            </div>
          </section>
          <section className="intro-band fade-in" id="nosotros">
            <span className="eyebrow">LA SELECCIÓN</span>
            <p>
              Hay instrumentos que se miran.{" "}
              <em>Y otros que te llaman a tocarlos.</em>
            </p>
            <span className="intro-band-side">
              Curaduría, pasión y buen sonido.
            </span>
          </section>
          <section className="catalog-section" id="catalogo">
            <div className="section-heading fade-in">
              <div>
                <span className="eyebrow">EXPLORÁ EL STOCK</span>
                <h2>
                  El catálogo<span className="gold-dot">.</span>
                </h2>
              </div>
              <p>
                Encontrá tu próximo instrumento. Sumá las piezas que te gustan y
                consultanos por WhatsApp.
              </p>
            </div>
            <div className="catalog-toolbar fade-in">
              <div
                className="filter-chips"
                role="group"
                aria-label="Filtrar por categoría"
              >
                {categories.map(([value, label]) => (
                  <button
                    key={value}
                    className={`filter-chip ${category === value ? "selected" : ""}`}
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="filter-controls">
                <label className="search-field">
                  <Search size={14} />
                  <span className="sr-only">Buscar producto</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="search"
                    placeholder="Buscar modelo o marca"
                  />
                </label>
                <label className="select-field">
                  <span className="sr-only">Filtrar marca</span>
                  <select
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                  >
                    <option value="">Todas las marcas</option>
                    {brands.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="catalog-meta">
              <span>
                {visible.length} {visible.length === 1 ? "PIEZA" : "PIEZAS"} EN
                ESTA SELECCIÓN
              </span>
              <span>PRECIO Y DISPONIBILIDAD A CONSULTAR</span>
            </div>
            {error && (
              <div className="empty-state">
                <p>{error}</p>
              </div>
            )}
            {loading ? (
              <div className="empty-state">
                <p>Cargando catálogo…</p>
              </div>
            ) : (
              <div className="product-grid">
                {visible.map((product) => (
                  <article
                    key={product.id}
                    className="product-card fade-in visible"
                  >
                    <button
                      className="product-image"
                      onClick={() => setSelected(product)}
                      aria-label={`Ver detalle de ${productTitle(product)}`}
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].src}
                          alt={productTitle(product)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="product-placeholder">
                          <Guitar size={42} />
                          <span>FOTOGRAFÍA PENDIENTE</span>
                        </div>
                      )}
                      <span className="product-tag">{product.stockId}</span>
                    </button>
                    <div className="product-info">
                      <div className="product-overline">
                        {labelFor(product.category)}{" "}
                        {product.year && `· ${product.year}`}
                      </div>
                      <h3>{productTitle(product)}</h3>
                      <button
                        className="detail-link"
                        onClick={() => setSelected(product)}
                      >
                        Ver detalles <ArrowRight size={12} />
                      </button>
                      <div className="product-bottom">
                        <span>{product.color || "Consultar detalles"}</span>
                        <button onClick={() => addToCart(product.stockId)}>
                          {cart.includes(product.stockId) ? (
                            <Check size={13} />
                          ) : (
                            <Plus size={13} />
                          )}
                          {cart.includes(product.stockId)
                            ? "En selección"
                            : "Agregar"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {!loading && !error && !visible.length && (
              <div className="empty-state">
                <Guitar size={35} />
                <h3>No encontramos piezas con esos filtros.</h3>
                <p>
                  Probá con otra categoría o escribinos por el instrumento que
                  estás buscando.
                </p>
              </div>
            )}
          </section>
          <section className="editorial-section fade-in">
            <div className="editorial-photo">
              <img
                src="/assets/gold-detail.jpg"
                alt="Detalle de guitarra Fender dorada"
                loading="lazy"
              />
            </div>
            <div className="editorial-copy">
              <span className="eyebrow">MÁS QUE UN INSTRUMENTO</span>
              <h2>El próximo capítulo empieza en tus manos.</h2>
              <p>
                Desde una Stratocaster con historia hasta ese amplificador que
                siempre quisiste probar. Descubrí una colección pensada para
                músicos, coleccionistas y amantes del sonido.
              </p>
              <a href="#catalogo" className="text-link">
                Explorar las piezas <ArrowRight size={14} />
              </a>
            </div>
          </section>
          <section className="contact-section fade-in" id="contacto">
            <div className="contact-top">
              <div>
                <span className="eyebrow">HABLEMOS DE GUITARRAS</span>
                <h2>
                  ¿Encontraste <em>la indicada?</em>
                </h2>
              </div>
              <p>
                Armá tu selección y mandanos la consulta por WhatsApp. Te
                respondemos personalmente con los detalles.
              </p>
            </div>
            <div className="contact-grid">
              <button
                className="contact-card"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={21} />
                <span>TU SELECCIÓN</span>
                <strong>
                  {cart.length} {cart.length === 1 ? "pieza" : "piezas"}
                </strong>
                <ArrowUpRight size={13} />
              </button>
              <a className="contact-card" href="mailto:guitarssaul@gmail.com">
                <Mail size={21} />
                <span>ESCRIBINOS</span>
                <strong>guitarssaul@gmail.com</strong>
                <ArrowUpRight size={13} />
              </a>
              <a
                className="contact-card"
                href="https://www.instagram.com/saulguitars/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={21} />
                <span>SEGUINOS</span>
                <strong>@saulguitars</strong>
                <ArrowUpRight size={13} />
              </a>
            </div>
            <div className="map-wrap">
              <iframe
                title="Mapa de referencia de Buenos Aires"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-58.471%2C-34.648%2C-58.367%2C-34.564&layer=mapnik"
                loading="lazy"
              />
              <span>
                <MapPin size={12} /> Buenos Aires · coordinamos visitas por
                mensaje
              </span>
            </div>
            <div className="mailing">
              <div>
                <span className="eyebrow">NOVEDADES</span>
                <h3>Enterate de lo que llega.</h3>
              </div>
              <form onSubmit={subscribe}>
                <label className="sr-only" htmlFor="mailingEmail">
                  Tu correo electrónico
                </label>
                <input
                  id="mailingEmail"
                  type="email"
                  required
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button type="submit">
                  Anotarme <ArrowRight size={14} />
                </button>
                <span className="mailing-message" role="status">
                  {mailingMessage}
                </span>
              </form>
            </div>
          </section>
        </main>
        <footer className="site-footer">
          <div className="footer-main">
            <img src="/assets/logo-dorado.png" alt="Saúl Guitars" />
            <span>Instrumentos con historia. Buenos Aires, Argentina.</span>
            <a href="/admin">Administración</a>
          </div>
          <div className="footer-credit">
            Hecho por{" "}
            <a href="https://zigodev.com.ar" target="_blank" rel="noreferrer">
              zigodev
            </a>
          </div>
        </footer>
      </div>
      <button
        className="cart-fab"
        onClick={() => setCartOpen(true)}
        aria-label={`Abrir selección, ${cart.length} piezas`}
      >
        <ShoppingBag size={20} />
        {cart.length > 0 && <span>{cart.length}</span>}
      </button>
      {cartOpen && (
        <div className="cart-overlay">
          <button
            className="cart-backdrop"
            onClick={() => setCartOpen(false)}
            aria-label="Cerrar selección"
          />
          <aside className="cart-drawer" aria-label="Tu selección">
            <div className="cart-header">
              <div>
                <span className="eyebrow">SAÚL GUITARS</span>
                <h2>
                  Tu selección<span className="gold-dot">.</span>
                </h2>
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <p className="cart-intro">
              Elegí tus instrumentos y enviá una sola consulta. Te confirmamos
              precio y disponibilidad.
            </p>
            <div className="cart-items">
              {cartProducts.length ? (
                cartProducts.map((product) => (
                  <div key={product.stockId} className="cart-item">
                    {product.images?.[0] ? (
                      <img src={product.images[0].src} alt="" />
                    ) : (
                      <div className="cart-no-photo">
                        <Guitar size={24} />
                      </div>
                    )}
                    <div>
                      <small>{product.stockId}</small>
                      <strong>{productTitle(product)}</strong>
                      <span>{product.color || labelFor(product.category)}</span>
                    </div>
                    <button
                      onClick={() =>
                        setCart((current) =>
                          current.filter((id) => id !== product.stockId),
                        )
                      }
                      aria-label={`Quitar ${productTitle(product)}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="cart-empty">
                  <ShoppingBag size={32} />
                  <p>Todavía no agregaste piezas.</p>
                  <button
                    className="button button-gold"
                    onClick={() => setCartOpen(false)}
                  >
                    Explorar catálogo <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            {cartProducts.length > 0 && (
              <div className="cart-footer">
                <span>
                  {cartProducts.length}{" "}
                  {cartProducts.length === 1
                    ? "pieza seleccionada"
                    : "piezas seleccionadas"}
                </span>
                <a
                  className="button button-gold"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar consulta por WhatsApp <ArrowUpRight size={16} />
                </a>
                {!config.whatsappNumber && (
                  <small>
                    El número comercial está pendiente. WhatsApp te dejará
                    elegir el destinatario.
                  </small>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
      <ProductDialog
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={addToCart}
      />
    </>
  );
}
