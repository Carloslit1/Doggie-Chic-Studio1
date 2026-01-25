class Favorito {
  constructor({ id, titulo, precio, imagen, nota = "" }) {
    this.id = String(id);
    this.titulo = titulo;
    this.precio = precio;
    this.imagen = imagen;
    this.nota = nota;
  }

  editarNota(nuevaNota) {
    this.nota = String(nuevaNota ?? "").trim();
  }
}

class GestorFavoritos {
  constructor(storageKey = "favoritos_doggie") {
    this.storageKey = storageKey;
    this.favoritos = [];
    this.cargar();
  }

  guardar() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.favoritos));
  }

  cargar() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      this.favoritos = (Array.isArray(data) ? data : []).map(f => new Favorito(f));
    } catch {
      this.favoritos = [];
    }
  }

  existe(id) {
    return this.favoritos.some(f => f.id === String(id));
  }

  agregar(data) {
    if (this.existe(data.id)) return;
    this.favoritos.push(new Favorito(data));
    this.guardar();
  }

  eliminar(id) {
    const fid = String(id);
    this.favoritos = this.favoritos.filter(f => f.id !== fid);
    this.guardar();
  }

  editar(id, nota) {
    const fid = String(id);
    const fav = this.favoritos.find(f => f.id === fid);
    if (!fav) return;
    fav.editarNota(nota);
    this.guardar();
  }
}

// --- DOM refs
const listaProductos = document.getElementById("lista-1");
const carritoBox = document.getElementById("carrito");
const gestorFav = new GestorFavoritos();

// -- para que se vea bien 
const UI = {
  favBtnBg: "#ff4d6d",
  favBtnBgHover: "#ff2d55",
  favBtnText: "#ffffff",

  editBg: "#2b2d42",
  editHover: "#1f2132",
  editText: "#ffffff",

  delBg: "#b00020",
  delHover: "#8b001a",
  delText: "#ffffff",

  cardBg: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(255,255,255,0.18)",
};

function styleBtn(el, bg, color) {
  el.style.background = bg;
  el.style.color = color;
  el.style.border = "none";
  el.style.padding = "6px 10px";
  el.style.borderRadius = "10px";
  el.style.fontWeight = "800";
  el.style.fontSize = "13px";
  el.style.cursor = "pointer";
  el.style.textDecoration = "none";
  el.style.display = "inline-block";
  el.style.lineHeight = "1";
}

function addHover(el, bgIn, bgOut) {
  el.addEventListener("mouseenter", () => (el.style.background = bgIn));
  el.addEventListener("mouseleave", () => (el.style.background = bgOut));
}

//Pate favoritos abajo del carrito compras
let favPanel = null;
let favLista = null;

function montarFavoritosEnCarrito() {
  if (!carritoBox) return;
// qUE NO LO DUPLIQUE SI YA EXISTE 
  if (document.getElementById("favoritos-panel")) {
    favPanel = document.getElementById("favoritos-panel");
    favLista = document.getElementById("favoritos-lista");
    return;
  }

  favPanel = document.createElement("div");
  favPanel.id = "favoritos-panel";
  favPanel.style.marginTop = "15px";
  favPanel.style.paddingTop = "12px";
  favPanel.style.borderTop = "1px solid rgba(255,255,255,0.25)";

  const titulo = document.createElement("div");
  titulo.textContent = "Favoritos";
  titulo.style.color = "#ffffff";
  titulo.style.fontWeight = "900";
  titulo.style.marginBottom = "10px";
  titulo.style.letterSpacing = "0.3px";

  favLista = document.createElement("div");
  favLista.id = "favoritos-lista";

  favPanel.appendChild(titulo);
  favPanel.appendChild(favLista);

  // final del dropdown del carrito
  carritoBox.appendChild(favPanel);

  // Editar / eliminar
  favLista.addEventListener("click", (e) => {
    e.preventDefault();

    const target = e.target;

    if (target.classList.contains("fav-borrar")) {
      const id = target.getAttribute("data-id");
      gestorFav.eliminar(id);
      renderFavoritos();
      return;
    }

    if (target.classList.contains("fav-editar")) {
      const id = target.getAttribute("data-id");
      const notaActual = target.getAttribute("data-nota") || "";
      const nuevaNota = prompt("Escribe una nota para este favorito:", notaActual);
      if (nuevaNota !== null) {
        gestorFav.editar(id, nuevaNota);
        renderFavoritos();
      }
      return;
    }
  });
}


function agregarBotonesFavorito() {
  if (!listaProductos) return;

  const cards = listaProductos.querySelectorAll(".box");

  cards.forEach((card) => {
    // Evita duplicados 
    if (card.querySelector(".favorito-btn")) return;

    const btnFav = document.createElement("a");
    btnFav.href = "#";
    btnFav.className = "favorito-btn";
    btnFav.textContent = "Favorito";

    // El estilo del boton 
    styleBtn(btnFav, UI.favBtnBg, UI.favBtnText);
    addHover(btnFav, UI.favBtnBgHover, UI.favBtnBg);
    btnFav.style.marginTop = "10px";
    btnFav.style.marginLeft = "8px";

    // Insertarlo junto al botón 
    const contenedor = card.querySelector(".product-txt");
    if (contenedor) contenedor.appendChild(btnFav);
  });


  listaProductos.addEventListener("click", (e) => {
    if (!e.target.classList.contains("favorito-btn")) return;
    e.preventDefault();

    const card = e.target.closest(".box");
    if (!card) return;

    const data = leerProducto(card);
    gestorFav.agregar(data);
    renderFavoritos();
  });
}

//Facilita el leer el porducto
function leerProducto(card) {
  const imagen = card.querySelector("img")?.src || "";
  const titulo = card.querySelector("h3")?.textContent?.trim() || "Producto";
  const precioTxt = card.querySelector(".precio")?.textContent || "$0";
  const id = card.querySelector(".agregar-carrito")?.getAttribute("data-id") || (crypto?.randomUUID?.() ?? String(Date.now()));
  const precio = Number(String(precioTxt).replace(/[^0-9.]/g, "")) || 0;

  return { id, titulo, precio, imagen, nota: "" };
}

function renderFavoritos() {
  if (!favLista) return;

  if (gestorFav.favoritos.length === 0) {
    favLista.innerHTML = `<p style="margin:0; color:rgba(255,255,255,0.85); font-size:13px;">Aún no tienes favoritos.</p>`;
    return;
  }

  favLista.innerHTML = gestorFav.favoritos.map(f => `
    <div style="
      display:flex;
      align-items:center;
      gap:10px;
      padding:10px;
      border:1px solid ${UI.cardBorder};
      background:${UI.cardBg};
      border-radius:14px;
      margin-bottom:10px;
    ">
      <img src="${f.imagen}" width="48" style="border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
      <div style="flex:1; color:#fff;">
        <div style="font-weight:900; font-size:14px; margin-bottom:2px;">${f.titulo}</div>
        <div style="font-size:13px; opacity:0.95;">
          <span style="font-weight:800;">$${f.precio}</span>
          <span style="opacity:0.9;"> • Nota: ${f.nota ? f.nota : "(sin nota)"}</span>
        </div>
      </div>
      <a href="#"
         class="fav-editar"
         data-id="${f.id}"
         data-nota="${(f.nota || "").replace(/"/g, "&quot;")}"
         style="text-decoration:none;"
      >Editar</a>
      <a href="#"
         class="fav-borrar"
         data-id="${f.id}"
         style="text-decoration:none;"
      >X</a>
    </div>
  `).join("");

  // Pintar el boton
  const editarBtns = favLista.querySelectorAll(".fav-editar");
  editarBtns.forEach(btn => {
    styleBtn(btn, UI.editBg, UI.editText);
    addHover(btn, UI.editHover, UI.editBg);
  });

  const borrarBtns = favLista.querySelectorAll(".fav-borrar");
  borrarBtns.forEach(btn => {
    styleBtn(btn, UI.delBg, UI.delText);
    addHover(btn, UI.delHover, UI.delBg);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  montarFavoritosEnCarrito();   // favoritos dentro del dropdown
  agregarBotonesFavorito();    
  renderFavoritos();            // carga desde LocalStorage y pinta
});
