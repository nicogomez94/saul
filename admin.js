const rows = document.querySelector('#adminRows');
const form = document.querySelector('#productForm');
const imageInput = document.querySelector('#productImage');
const preview = document.querySelector('#imagePreview');
let currentImage = '';
let pendingImage = '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function products() { return getSaulProducts(); }
function saveProducts(items) {
  try {
    localStorage.setItem(SAUL_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    setMessage('No hay espacio en este navegador. Probá con una foto más liviana.', true);
    return false;
  }
}
function setMessage(text, error = false) {
  const message = document.querySelector('#formMessage');
  message.textContent = text;
  message.style.color = error ? '#a04432' : '#58714d';
}
function showPreview(source) {
  preview.innerHTML = source ? `<img src="${escapeHtml(source)}" alt="Vista previa del producto">` : '<i class="fa-regular fa-image"></i><span>Vista previa de la fotografía</span>';
}
function render() {
  const list = products();
  const query = document.querySelector('#adminSearch').value.trim().toLocaleLowerCase('es');
  const category = document.querySelector('#adminCategory').value;
  const visible = list.filter(item => (category === 'all' || item.category === category) && `${item.id} ${item.brand} ${item.model}`.toLocaleLowerCase('es').includes(query));
  rows.innerHTML = visible.map(item => `<tr><td><div class="product-cell">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<div class="admin-no-photo"><i class="fa-solid fa-guitar"></i></div>'}<div><strong>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</strong><small>${escapeHtml(item.id)}</small></div></div></td><td>${escapeHtml(SAUL_CATEGORIES.find(cat => cat[0] === item.category)?.[1] || item.category)}</td><td>${escapeHtml(item.year || '—')}</td><td><span class="status-pill">En catálogo</span></td><td><div class="row-actions"><button type="button" data-edit="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.id)}"><i class="fa-solid fa-pen"></i></button><button type="button" data-delete="${escapeHtml(item.id)}" aria-label="Quitar ${escapeHtml(item.id)}"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('') || '<tr><td colspan="5">No hay productos que coincidan con la búsqueda.</td></tr>';
  document.querySelector('#totalProducts').textContent = list.length;
  document.querySelector('#guitarProducts').textContent = list.filter(item => ['electricas', 'acusticas'].includes(item.category)).length;
  document.querySelector('#categoryCount').textContent = new Set(list.map(item => item.category)).size;
}
function resetForm() {
  form.reset();
  document.querySelector('#editingId').value = '';
  document.querySelector('#productId').disabled = false;
  document.querySelector('#formTitle').textContent = 'Agregar producto';
  currentImage = '';
  pendingImage = '';
  showPreview('');
  setMessage('');
}
function editProduct(id) {
  const item = products().find(product => product.id === id);
  if (!item) return;
  resetForm();
  document.querySelector('#editingId').value = id;
  document.querySelector('#productId').value = item.id;
  document.querySelector('#productId').disabled = true;
  document.querySelector('#productBrand').value = item.brand;
  document.querySelector('#productModel').value = item.model;
  document.querySelector('#productCategory').value = item.category;
  document.querySelector('#productYear').value = item.year;
  document.querySelector('#productColor').value = item.color;
  document.querySelector('#formTitle').textContent = 'Editar producto';
  currentImage = item.image;
  showPreview(currentImage);
  document.querySelector('#formulario').scrollIntoView({ behavior: 'smooth' });
}
const categories = SAUL_CATEGORIES.filter(item => item[0] !== 'all');
document.querySelector('#adminCategory').innerHTML += categories.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
document.querySelector('#productCategory').innerHTML = '<option value="">Elegir categoría</option>' + categories.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
rows.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  const remove = event.target.closest('[data-delete]');
  if (edit) editProduct(edit.dataset.edit);
  if (remove && window.confirm('¿Quitar este producto de la demo?')) {
    if (saveProducts(products().filter(item => item.id !== remove.dataset.delete))) render();
  }
});
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) { pendingImage = ''; showPreview(currentImage); return; }
  if (file.size > 1024 * 1024) { imageInput.value = ''; setMessage('La imagen debe pesar menos de 1 MB.', true); return; }
  const reader = new FileReader();
  reader.onload = () => { pendingImage = String(reader.result); showPreview(pendingImage); };
  reader.readAsDataURL(file);
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const editingId = document.querySelector('#editingId').value;
  const id = (editingId || document.querySelector('#productId').value).trim().toUpperCase();
  const list = products();
  if (!editingId && list.some(item => item.id === id)) { setMessage('Ese código ya existe en la demo.', true); return; }
  const item = {
    id,
    brand: document.querySelector('#productBrand').value.trim(),
    model: document.querySelector('#productModel').value.trim(),
    category: document.querySelector('#productCategory').value,
    year: document.querySelector('#productYear').value.trim(),
    color: document.querySelector('#productColor').value.trim(),
    image: pendingImage || currentImage
  };
  const next = editingId ? list.map(product => product.id === editingId ? item : product) : [item, ...list];
  if (saveProducts(next)) { resetForm(); render(); setMessage('Producto guardado en este navegador. Abrí el catálogo para verlo.'); }
});
document.querySelector('#resetForm').addEventListener('click', resetForm);
document.querySelector('#newProductButton').addEventListener('click', resetForm);
document.querySelector('#adminSearch').addEventListener('input', render);
document.querySelector('#adminCategory').addEventListener('change', render);
render();
