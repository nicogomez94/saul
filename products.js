// Muestra tomada de Stock.xlsx. Las imágenes de los modelos sin carpeta identificada
// son fotografías de la colección entregada y se usan como referencia visual.
window.SAUL_PRODUCTS = [
  { id: 'SG-001', brand: 'Fender', model: "Stratocaster Ltd '61 Relic", year: '2020', color: 'Sparkle Gold', category: 'electricas', image: 'assets/strat-gold.jpg', featured: true },
  { id: 'SG-002', brand: 'Fender', model: 'Telecaster Deluxe', year: '1978', color: 'Natural', category: 'electricas', image: '' },
  { id: 'SG-008', brand: 'Fender', model: 'Stratocaster Hardtail', year: '1976', color: 'Natural', category: 'electricas', image: 'assets/strat-natural.jpg' },
  { id: 'SG-010', brand: 'Fender', model: 'Acústica CC-60SCE', year: '2021', color: 'Natural', category: 'acusticas', image: '' },
  { id: 'SG-011', brand: 'Taylor', model: 'Acústica 214e-g', year: '', color: 'Natural', category: 'acusticas', image: '' },
  { id: 'SG-013', brand: 'Gibson', model: 'Firebird', year: '1994', color: 'Sunburst', category: 'electricas', image: 'assets/firebird.jpg' },
  { id: 'SG-015', brand: 'Gibson', model: 'SG 64 Murphy Lab Light Aged', year: '', color: 'Vintage Cherry', category: 'electricas', image: 'assets/gibson-sg.jpg' },
  { id: 'SG-018', brand: 'Fender', model: 'Amp Pro Jr', year: '', color: '', category: 'amplificadores', image: '' },
  { id: 'SG-021', brand: 'Fender', model: 'Amp Vibrolux', year: '', color: '', category: 'amplificadores', image: '' },
  { id: 'SG-025', brand: 'Fender', model: 'Amp Concert', year: '', color: '', category: 'amplificadores', image: 'assets/fender-amp.jpg' }
];
window.SAUL_CATEGORIES = [
  ['all', 'Todos'], ['electricas', 'Eléctricas'], ['acusticas', 'Acústicas'],
  ['amplificadores', 'Amplificadores'], ['pedales', 'Pedales'], ['bajos', 'Bajos'], ['merch', 'Merch']
];
window.SAUL_STORAGE_KEY = 'saul-guitars-demo-products-v1';
window.getSaulProducts = () => {
  try {
    const saved = localStorage.getItem(window.SAUL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : window.SAUL_PRODUCTS;
  } catch {
    return window.SAUL_PRODUCTS;
  }
};
