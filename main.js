const grid = document.querySelector('#productGrid');
const categoryFilters = document.querySelector('#categoryFilters');
const brandFilter = document.querySelector('#brandFilter');
const searchInput = document.querySelector('#searchInput');
const emptyState = document.querySelector('#emptyState');
const resultCount = document.querySelector('#resultCount');
const toast = document.querySelector('#toast');
let activeCategory = 'all';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 4500);
}
function initFilters() {
  categoryFilters.innerHTML = SAUL_CATEGORIES.map(([value, label]) => `<button type="button" class="filter-chip ${value === activeCategory ? 'selected' : ''}" data-filter="${value}" aria-pressed="${value === activeCategory}">${label}</button>`).join('');
  categoryFilters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => setCategory(button.dataset.filter)));
  const brands = [...new Set(getSaulProducts().map(product => product.brand).filter(Boolean))].sort();
  brandFilter.innerHTML = '<option value="">Todas las marcas</option>' + brands.map(brand => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join('');
}
function setCategory(value) {
  activeCategory = value;
  categoryFilters.querySelectorAll('button').forEach(button => {
    const selected = button.dataset.filter === value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderProducts();
}
function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  const products = getSaulProducts().filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesBrand = !brandFilter.value || product.brand === brandFilter.value;
    const matchesSearch = `${product.brand} ${product.model} ${product.year} ${product.id} ${product.description || ''}`.toLocaleLowerCase('es').includes(query);
    return matchesCategory && matchesBrand && matchesSearch;
  });
  resultCount.textContent = `${products.length} ${products.length === 1 ? 'PIEZA' : 'PIEZAS'} EN ESTA SELECCIÓN`;
  grid.innerHTML = products.map(product => {
    const title = `${product.brand} ${product.model}`;
    const image = product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}" loading="lazy">` : '<div class="product-placeholder"><i class="fa-solid fa-guitar"></i><span>FOTOGRAFÍA PRÓXIMAMENTE</span></div>';
    const message = encodeURIComponent(`Hola, quiero consultar por ${title} (${product.id}) de Saúl Guitars.`);
    return `<article class="product-card fade-in visible"><div class="product-image">${image}<span class="product-tag">${escapeHtml(product.id)}</span><button type="button" class="quick-view" data-detail="${escapeHtml(product.id)}" aria-label="Ver detalle de ${escapeHtml(title)}"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></div><div class="product-info"><div class="product-overline">${escapeHtml(SAUL_CATEGORIES.find(item => item[0] === product.category)?.[1] || product.category)} ${product.year ? '· ' + escapeHtml(product.year) : ''}</div><h3>${escapeHtml(title)}</h3><button type="button" class="detail-link" data-detail="${escapeHtml(product.id)}">Ver detalles <i class="fa-solid fa-arrow-right"></i></button><div class="product-bottom"><span>${escapeHtml(product.color || 'Consultar detalles')}</span><a href="mailto:guitarssaul@gmail.com?subject=${encodeURIComponent('Consulta ' + product.id)}&body=${message}">Consultar <i class="fa-solid fa-arrow-right"></i></a></div></div></article>`;
  }).join('');
  emptyState.hidden = products.length > 0;
}
const productDialog = document.querySelector('#productDialog');
const dialogContent = document.querySelector('#dialogContent');
grid.addEventListener('click', event => {
  const trigger = event.target.closest('[data-detail]');
  if (!trigger) return;
  const product = getSaulProducts().find(item => item.id === trigger.dataset.detail);
  if (!product) return;
  const title = `${product.brand} ${product.model}`;
  const image = product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}">` : '<div class="product-placeholder"><i class="fa-solid fa-guitar"></i></div>';
  const specs = Array.isArray(product.specs) ? product.specs : [];
  const message = encodeURIComponent(`Hola, quiero consultar por ${title} (${product.id}) de Saúl Guitars.`);
  dialogContent.innerHTML = `<div class="dialog-layout"><div class="dialog-photo">${image}</div><div class="dialog-copy"><span class="product-overline">${escapeHtml(product.id)} · ${escapeHtml(SAUL_CATEGORIES.find(item => item[0] === product.category)?.[1] || product.category)}${product.year ? ' · ' + escapeHtml(product.year) : ''}</span><h2 id="detailTitle">${escapeHtml(title)}</h2><span class="dialog-color">${escapeHtml(product.color || 'Detalles a consultar')}</span><p>${escapeHtml(product.description || 'Consultanos para conocer la historia y los detalles de esta pieza.')}</p>${specs.length ? `<div class="dialog-specs"><span>CARACTERÍSTICAS</span><ul>${specs.map(spec => `<li>${escapeHtml(spec)}</li>`).join('')}</ul></div>` : ''}<a class="button button-gold" href="mailto:guitarssaul@gmail.com?subject=${encodeURIComponent('Consulta ' + product.id)}&body=${message}">Consultar por esta pieza <i class="fa-solid fa-arrow-right"></i></a></div></div>`;
  productDialog.showModal();
});
document.querySelector('#dialogClose').addEventListener('click', () => productDialog.close());
productDialog.addEventListener('click', event => { if (event.target === productDialog) productDialog.close(); });
initFilters();
renderProducts();
brandFilter.addEventListener('change', renderProducts);
searchInput.addEventListener('input', renderProducts);
document.querySelectorAll('[data-category]').forEach(link => link.addEventListener('click', () => setCategory(link.dataset.category)));

const menuToggle = document.querySelector('#menuToggle');
const sidebar = document.querySelector('#sidebar');
const scrim = document.querySelector('#menuScrim');
function closeMenu() {
  sidebar.classList.remove('open');
  scrim.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
}
menuToggle.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
scrim.addEventListener('click', closeMenu);
sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(element => observer.observe(element));

document.querySelector('#mailingForm').addEventListener('submit', event => {
  event.preventDefault();
  const email = document.querySelector('#mailingEmail').value.trim();
  window.location.href = `mailto:guitarssaul@gmail.com?subject=${encodeURIComponent('Quiero recibir novedades de Saúl Guitars')}&body=${encodeURIComponent('Hola, quiero recibir novedades del catálogo. Mi correo es ' + email)}`;
  notify('Se abrió tu correo para enviar la solicitud de novedades.');
});
document.querySelector('#whatsappButton').addEventListener('click', () => notify('El número comercial aún está pendiente. WhatsApp abrirá la opción de compartir tu consulta.'));
