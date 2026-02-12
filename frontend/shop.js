// shop.js
document.addEventListener("DOMContentLoaded", () => {
  const STORAGE = "doggie_cart_shop_v1";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $("#grid");
  const search = $("#search");
  const sort = $("#sort");
  const catChips = $("#catChips");

  const cartCount = $("#cartCount");
  const miniCartBody = $("#miniCartBody");
  const vaciarCarrito = $("#vaciar-carrito");

  const modal = $("#modal");
  const modalClose = $("#modalClose");
  const modalX = $("#modalX");

  const mImg = $("#mImg");
  const mThumbs = $("#mThumbs");
  const mTitle = $("#mTitle");
  const mDesc = $("#mDesc");
  const mPrice = $("#mPrice");
  const mCat = $("#mCat");
  const mAdd = $("#mAdd");
  const mBuy = $("#mBuy");
  const mSimilar = $("#mSimilar");

  let selectedCat = "all";
  let currentProduct = null;

  function moneyMXN(n) {
    const v = Number(n || 0);
    return "$" + v.toFixed(0) + " MXN";
  }

  function tagsOf(str) {
    return String(str || "")
      .split(",")
      .map(x => x.trim().toLowerCase())
      .filter(Boolean);
  }

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function scoreMatch(text, query) {
    const t = normalizeText(text);
    const q = normalizeText(query).trim();
    if (!q) return 1;

    const tokens = q.split(/\s+/).filter(Boolean);
    let score = 0;
    for (const tok of tokens) {
      if (t.includes(tok)) score += 1;
    }
    return score;
  }

  // ===== CARRITO =====
  function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); }
    catch { return []; }
  }

  function setCart(items) {
    localStorage.setItem(STORAGE, JSON.stringify(items));
    updateBadge();
    renderMiniCart();
  }

  function updateBadge() {
    if (!cartCount) return;
    cartCount.textContent = getCart().length;
  }

  function renderMiniCart() {
    if (!miniCartBody) return;
    const cart = getCart();

    if (!cart.length) {
      miniCartBody.innerHTML = `<tr><td colspan="4">Carrito vacío</td></tr>`;
      return;
    }

    miniCartBody.innerHTML = cart.map((it, idx) => `
      <tr>
        <td><img src="${it.img}" alt="Producto en carrito: ${it.title}" class="mini-img"></td>
        <td>${it.title}</td>
        <td>${moneyMXN(it.price)}</td>
        <td><a href="#" class="borrar" data-rm="${idx}">x</a></td>
      </tr>
    `).join("");
  }

  function addToCartFromCard(card) {
    const item = {
      id: card.dataset.id,
      title: card.dataset.title,
      price: card.dataset.price,
      img: card.dataset.img
    };

    const cart = getCart();
    cart.push(item);
    setCart(cart);
    alert("Agregado al carrito (demo).");
  }

  // eliminar item mini cart (delegación)
  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (!rm) return;

    e.preventDefault();
    const idx = Number(rm.getAttribute("data-rm"));
    const cart = getCart();
    cart.splice(idx, 1);
    setCart(cart);
  });

  if (vaciarCarrito) {
    vaciarCarrito.addEventListener("click", (e) => {
      e.preventDefault();
      setCart([]);
    });
  }

  // ===== MODAL =====
  function openModalFromCard(card) {
    currentProduct = {
      id: card.dataset.id,
      title: card.dataset.title,
      price: card.dataset.price,
      cat: card.dataset.cat,
      desc: card.dataset.desc,
      tags: tagsOf(card.dataset.tags),
      img: card.dataset.img,
      img2: card.dataset.img2 || card.dataset.img,
      img3: card.dataset.img3 || card.dataset.img
    };

    if (!modal) return;

    mTitle.textContent = currentProduct.title;
    mDesc.textContent = currentProduct.desc || "Sin descripción por el momento.";
    mPrice.textContent = moneyMXN(currentProduct.price);
    mCat.textContent = currentProduct.cat;

    const imgs = [currentProduct.img, currentProduct.img2, currentProduct.img3];
    mImg.src = imgs[0];

    mThumbs.innerHTML = imgs.map((src) => `
      <button class="thumb" type="button">
        <img src="${src}" alt="Miniatura del producto">
      </button>
    `).join("");

    $$(".thumb", mThumbs).forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        mImg.src = imgs[idx];
      });
    });

    renderSimilarProducts();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    currentProduct = null;
  }

  function renderSimilarProducts() {
    if (!currentProduct) return;

    const cards = $$(".card");
    const sim = cards
      .filter(c => c.dataset.id !== currentProduct.id)
      .map(c => ({
        id: c.dataset.id,
        title: c.dataset.title,
        price: c.dataset.price,
        img: c.dataset.img,
        tags: tagsOf(c.dataset.tags)
      }))
      .filter(p => p.tags.some(t => currentProduct.tags.includes(t)))
      .slice(0, 4);

    mSimilar.innerHTML = sim.length ? sim.map(p => `
      <button class="sim" type="button" data-open="${p.id}">
        <img src="${p.img}" alt="Producto similar: ${p.title}">
        <div class="sim-t">${p.title}</div>
        <div class="sim-p">${moneyMXN(p.price)}</div>
      </button>
    `).join("") : `<div class="empty">Aún no hay similares. Usa tags parecidas.</div>`;
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalX) modalX.addEventListener("click", closeModal);

  if (mAdd) {
    mAdd.addEventListener("click", () => {
      if (!currentProduct) return;
      const cart = getCart();
      cart.push({ id: currentProduct.id, title: currentProduct.title, price: currentProduct.price, img: currentProduct.img });
      setCart(cart);
      alert("Agregado al carrito (demo).");
    });
  }

  if (mBuy) {
    mBuy.addEventListener("click", () => {
      alert("Compra demo. Después conectamos pagos reales.");
    });
  }

  // abrir similar 
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open]");
    if (!openBtn) return;

    const id = openBtn.getAttribute("data-open");
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card) openModalFromCard(card);
  });

  // ===== Filtros =====
  function applyFilters() {
    const q = search ? search.value : "";
    const cards = $$(".card");

    let scored = cards.map(card => {
      const cat = (card.dataset.cat || "").toLowerCase();
      const okCat = (selectedCat === "all" || cat === selectedCat);

      const title = card.dataset.title || "";
      const tags = card.dataset.tags || "";
      const desc = card.dataset.desc || "";
      const text = `${title} ${tags} ${desc}`;

      const score = scoreMatch(text, q);
      const okSearch = !q.trim() || score > 0;

      return { card, ok: okCat && okSearch, score };
    });

    let visible = scored.filter(x => x.ok);

    const mode = sort ? sort.value : "featured";

    if (mode === "featured") {
      if (q.trim()) visible.sort((a, b) => b.score - a.score);
    }
    if (mode === "az") {
      visible.sort((a, b) => (a.card.dataset.title || "").localeCompare(b.card.dataset.title || ""));
    }
    if (mode === "priceLow") {
      visible.sort((a, b) => Number(a.card.dataset.price || 0) - Number(b.card.dataset.price || 0));
    }
    if (mode === "priceHigh") {
      visible.sort((a, b) => Number(b.card.dataset.price || 0) - Number(a.card.dataset.price || 0));
    }

    cards.forEach(c => (c.style.display = "none"));
    visible.forEach(x => (x.card.style.display = ""));

    if (grid) visible.forEach(x => grid.appendChild(x.card));
  }

  if (catChips) {
    $$(".chip", catChips).forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".chip", catChips).forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedCat = chip.dataset.cat || "all";
        applyFilters();
      });
    });
  }

  if (search) search.addEventListener("input", applyFilters);
  if (sort) sort.addEventListener("change", applyFilters);

  if (grid) {
    grid.addEventListener("click", (e) => {
      const viewBtn = e.target.closest(".btnView");
      const addBtn = e.target.closest(".btnAdd");

      if (!viewBtn && !addBtn) return;

      const card = e.target.closest(".card");
      if (!card) return;

      if (viewBtn) openModalFromCard(card);
      if (addBtn) addToCartFromCard(card);
    });
  }

  // init
  updateBadge();
  renderMiniCart();
  applyFilters();
});
