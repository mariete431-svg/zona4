const $ = (s) => document.querySelector(s);
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Barra de arriba y progreso de lectura ----------
const nav = $("#nav");
const progreso = $("#progreso");
const parallax = matchMedia("(hover: hover) and (min-width: 861px)").matches ? document.querySelectorAll("[data-parallax]") : [];
let pendiente = false;
function alHacerScroll() {
  pendiente = false;
  nav.classList.toggle("scrolled", scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  progreso.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (reducido) return;
  parallax.forEach((img) => {
    const r = img.closest(".porque-foto, .empezar-fondo").getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const centro = r.top + r.height / 2 - innerHeight / 2;
    img.style.transform = `translateY(${centro * -+img.dataset.parallax}px)`;
  });
}
addEventListener("scroll", () => {
  if (!pendiente) requestAnimationFrame(alHacerScroll);
  pendiente = true;
}, { passive: true });
alHacerScroll();

// ---------- Menú móvil ----------
const menu = $("#menu");
const hamburguesa = $("#hamburguesa");
const resto = document.querySelectorAll("main, footer, .nav > .logo");
function cerrarMenu(devolverFoco = true) {
  if (!menu.classList.contains("abierto")) return;
  menu.classList.remove("abierto");
  hamburguesa.setAttribute("aria-expanded", "false");
  hamburguesa.setAttribute("aria-label", "Abrir menú");
  document.body.style.overflow = "";
  resto.forEach((el) => (el.inert = false));
  if (devolverFoco) hamburguesa.focus();
}
function abrirMenu() {
  menu.classList.add("abierto");
  hamburguesa.setAttribute("aria-expanded", "true");
  hamburguesa.setAttribute("aria-label", "Cerrar menú");
  document.body.style.overflow = "hidden";
  resto.forEach((el) => (el.inert = true));
  requestAnimationFrame(() => menu.querySelector("a").focus());
}
hamburguesa.addEventListener("click", () => (menu.classList.contains("abierto") ? cerrarMenu() : abrirMenu()));
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => cerrarMenu(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });
matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && cerrarMenu(false));

// ---------- Vídeo de portada ----------
// Se carga después de la página, en versión pequeña en el móvil, y nunca con "ahorro de datos" o "reducir movimiento"
const video = $("#video");
const ahorroDatos = navigator.connection && navigator.connection.saveData;
if (!reducido && !ahorroDatos) {
  addEventListener("load", () => {
    video.src = matchMedia("(max-width: 700px)").matches ? video.dataset.movil : video.dataset.escritorio;
    video.addEventListener("loadeddata", () => video.classList.add("listo"), { once: true });
    video.play().catch(() => {});
  });
}

// ---------- Aparecer al bajar ----------
const observador = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      observador.unobserve(e.target);
    }),
  { threshold: 0.15 }
);
document.querySelectorAll(".aparecer").forEach((el) => {
  const hermanos = [...el.parentElement.children].filter((h) => h.classList.contains("aparecer"));
  el.style.setProperty("--retraso", (hermanos.indexOf(el) % 3) * 0.1 + "s");
  observador.observe(el);
});

// ---------- Contadores ----------
const contador = new IntersectionObserver((entradas) =>
  entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, final = +el.dataset.contar, sufijo = el.dataset.sufijo || "", t0 = performance.now();
    const paso = (t) => {
      const p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(final * (1 - (1 - p) ** 3)) + sufijo;
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    contador.unobserve(el);
  })
);
document.querySelectorAll("[data-contar]").forEach((el) => contador.observe(el));

// ---------- Horario ----------
const semana = {
  Lunes: [["07:00", "Fuerza", "Laura"], ["09:30", "Movilidad", "Ana"], ["18:00", "HIIT", "Dani"], ["19:00", "Boxeo", "Dani"], ["20:30", "Spinning", "Ana"]],
  Martes: [["07:00", "Cross", "Dani"], ["10:00", "Movilidad", "Ana"], ["18:00", "Fuerza", "Laura"], ["19:15", "Spinning", "Ana"], ["20:30", "HIIT", "Dani"]],
  Miércoles: [["07:00", "HIIT", "Dani"], ["09:30", "Fuerza", "Laura"], ["18:00", "Boxeo", "Dani"], ["19:15", "Cross", "Laura"], ["20:30", "Movilidad", "Ana"]],
  Jueves: [["07:00", "Fuerza", "Laura"], ["10:00", "Spinning", "Ana"], ["18:00", "Cross", "Dani"], ["19:15", "HIIT", "Dani"], ["20:30", "Boxeo", "Dani"]],
  Viernes: [["07:00", "Spinning", "Ana"], ["09:30", "Cross", "Dani"], ["17:30", "Fuerza", "Laura"], ["19:00", "Boxeo", "Dani"]],
  Sábado: [["09:00", "Cross", "Dani"], ["10:30", "HIIT", "Laura"], ["12:00", "Movilidad", "Ana"]],
  Domingo: [["10:00", "Movilidad", "Ana"], ["11:30", "Spinning", "Ana"]],
};
const dias = Object.keys(semana);

// Día y minuto actuales en hora de Canarias
function ahoraCanarias() {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: "Atlantic/Canary", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const v = (t) => partes.find((p) => p.type === t).value;
  return { dia: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(v("weekday")), min: (+v("hour") % 24) * 60 + +v("minute") };
}
const aMin = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
const plazasOcupadas = (hora, clase) => 6 + ((aMin(hora) + clase.length * 7) % 6);

const ahora = ahoraCanarias();
const hoy = dias[ahora.dia];
const cajaDias = $("#dias");
const lista = $("#lista-horario");

function pintarDia(dia) {
  cajaDias.querySelectorAll(".dia").forEach((b) => {
    const activo = b.dataset.dia === dia;
    b.setAttribute("aria-selected", activo);
    b.tabIndex = activo ? 0 : -1;
    if (activo) lista.setAttribute("aria-labelledby", b.id);
  });
  lista.innerHTML = semana[dia]
    .map(([hora, clase, coach], i) => `<li style="--i:${i}"><span class="hora">${hora}</span><span class="nombre-clase">${clase}</span><span class="coach">con ${coach}</span></li>`)
    .join("");
}
dias.forEach((d) => {
  const b = document.createElement("button");
  b.className = "dia";
  b.dataset.dia = d;
  b.id = "dia-" + dias.indexOf(d);
  b.setAttribute("role", "tab");
  b.setAttribute("aria-controls", "lista-horario");
  b.textContent = d === hoy ? `Hoy · ${d}` : d;
  b.addEventListener("click", () => pintarDia(d));
  cajaDias.appendChild(b);
});
pintarDia(hoy);
// Flechas, Inicio y Fin para moverse entre días
cajaDias.addEventListener("keydown", (e) => {
  const botones = [...cajaDias.querySelectorAll(".dia")];
  let i = botones.indexOf(document.activeElement);
  if (i < 0) return;
  if (e.key === "ArrowRight") i = (i + 1) % botones.length;
  else if (e.key === "ArrowLeft") i = (i - 1 + botones.length) % botones.length;
  else if (e.key === "Home") i = 0;
  else if (e.key === "End") i = botones.length - 1;
  else return;
  e.preventDefault();
  botones[i].focus();
  botones[i].click();
});
const botonHoy = cajaDias.querySelector(`[data-dia="${hoy}"]`);
cajaDias.scrollLeft = botonHoy.offsetLeft - cajaDias.offsetLeft - 8;

// ---------- Tarjeta "Próxima clase" ----------
(function proximaClase() {
  let siguiente = null;
  for (let d = 0; d < 7 && !siguiente; d++) {
    const indice = (ahora.dia + d) % 7;
    const clase = semana[dias[indice]].find(([h]) => d > 0 || aMin(h) > ahora.min);
    if (clase) siguiente = { d, dia: dias[indice], clase };
  }
  const [hora, nombre, coach] = siguiente.clase;
  const ocupadas = plazasOcupadas(hora, nombre);
  let cuando = siguiente.d === 0 ? "Hoy" : siguiente.d === 1 ? "Mañana" : siguiente.dia;
  if (siguiente.d === 0) {
    const falta = aMin(hora) - ahora.min;
    cuando = falta < 60 ? `Empieza en ${falta} min` : "Hoy";
  }
  $("#proxima-cuando").textContent = `Próxima clase · ${cuando}`;
  $("#proxima-clase").textContent = nombre;
  $("#proxima-info").textContent = `${hora} · con ${coach} · quedan ${12 - ocupadas} plazas`;
  document.querySelectorAll(".plazas i").forEach((p, i) => setTimeout(() => p.classList.toggle("ocupada", i < ocupadas), 1200 + i * 70));
})();

// ---------- Mapa de centros ----------
const centros = [
  { nombre: "Santa Cruz Centro", zona: "Calle Inventada 12", horario: "L–V 6:00–23:00", pos: [28.4682, -16.2546], principal: true },
  { nombre: "La Laguna", zona: "Junto a la Plaza del Adelantado", horario: "L–V 6:30–22:30", pos: [28.4874, -16.3159] },
  { nombre: "Candelaria", zona: "Paseo marítimo", horario: "L–V 7:00–22:00", pos: [28.3548, -16.3708] },
  { nombre: "Puerto de la Cruz", zona: "Cerca del Lago Martiánez", horario: "L–V 7:00–22:00", pos: [28.4140, -16.5480] },
  { nombre: "Costa Adeje", zona: "Avenida de las playas", horario: "L–D 7:00–23:00", pos: [28.0830, -16.7300] },
];
const listaCentros = $("#lista-centros");
const aviso = $("#cerca-aviso");

function distanciaKm([a1, o1], [a2, o2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const h = Math.sin(rad(a2 - a1) / 2) ** 2 + Math.cos(rad(a1)) * Math.cos(rad(a2)) * Math.sin(rad(o2 - o1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

if (window.L) {
  // En pantallas táctiles el mapa no se arrastra con un dedo, para no atrapar el scroll de la página
  const tactil = matchMedia("(hover: none)").matches;
  const mapa = L.map("mapa", { scrollWheelZoom: false, zoomSnap: 0.5, dragging: !tactil, tap: false });
  if (tactil) $(".mapa-lista").insertAdjacentHTML("afterbegin", '<p class="mapa-pista">Pellizca el mapa para hacer zoom o toca un centro de la lista.</p>');
  const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  L.tileLayer(esri + "World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
    attribution: 'Powered by <a href="https://www.esri.com">Esri</a> · Esri, HERE, Garmin, &copy; OpenStreetMap',
  }).addTo(mapa);
  L.tileLayer(esri + "World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16 }).addTo(mapa);

  // El zoom con la rueda solo se activa al hacer clic, para no atrapar el scroll de la página
  mapa.on("click", () => mapa.scrollWheelZoom.enable());
  mapa.on("mouseout", () => mapa.scrollWheelZoom.disable());

  const icono = (clase = "") => L.divIcon({ className: "pin " + clase, html: "<span></span>", iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -12] });
  const limites = L.latLngBounds(centros.map((c) => c.pos));
  mapa.fitBounds(limites, { padding: [40, 40] });

  centros.forEach((c) => {
    c.marcador = L.marker(c.pos, { icon: icono(), title: c.nombre }).addTo(mapa).bindPopup(
      `<strong>ZONA 4 ${c.nombre}</strong><span>${c.zona}</span><span>${c.horario}</span><span>Centro ficticio (portfolio)</span>`
    );
    c.marcador.on("click", () => seleccionar(c, false));
  });

  function seleccionar(c, volar = true) {
    centros.forEach((x) => {
      x.boton.classList.toggle("activo", x === c);
      x.marcador.getElement()?.classList.toggle("activo", x === c);
    });
    if (volar) {
      mapa.flyTo(c.pos, 15, { duration: reducido ? 0 : 1.4 });
      mapa.once("moveend", () => c.marcador.openPopup());
    }
  }

  function pintarLista() {
    listaCentros.innerHTML = "";
    centros.forEach((c) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.className = "centro";
      b.type = "button";
      b.innerHTML = `<strong>${c.nombre}${c.principal ? '<span class="etiqueta-principal">Principal</span>' : ""}</strong><small>${c.zona}</small>${c.km != null ? `<span class="km">${c.km < 10 ? c.km.toFixed(1) : Math.round(c.km)} km</span>` : ""}`;
      b.addEventListener("click", () => seleccionar(c));
      c.boton = b;
      li.appendChild(b);
      listaCentros.appendChild(li);
    });
  }
  pintarLista();

  let marcadorYo = null;
  $("#cerca").addEventListener("click", () => {
    if (!navigator.geolocation) {
      aviso.textContent = "Tu navegador no permite buscar tu ubicación.";
      return;
    }
    aviso.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const yo = [coords.latitude, coords.longitude];
        centros.forEach((c) => (c.km = distanciaKm(yo, c.pos)));
        centros.sort((a, b) => a.km - b.km);
        pintarLista();
        const cercano = centros[0];
        aviso.textContent = cercano.km > 150 ? "Estás lejos de Tenerife, pero este es el más cercano:" : `El más cercano está a ${cercano.km.toFixed(1)} km.`;
        if (marcadorYo) marcadorYo.remove();
        marcadorYo = L.marker(yo, { icon: icono("pin-yo"), title: "Tú" }).addTo(mapa).bindTooltip("Estás aquí");
        if (cercano.km < 150) mapa.flyToBounds(L.latLngBounds([yo, cercano.pos]), { padding: [60, 60], duration: 1.4 });
        seleccionar(cercano, cercano.km >= 150);
        if (cercano.km < 150) mapa.once("moveend", () => cercano.marcador.openPopup());
      },
      () => (aviso.textContent = "No hemos podido ver tu ubicación. Elige un centro de la lista."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
} else {
  $("#mapa").innerHTML = '<p style="padding:2rem;color:var(--gris)">No se ha podido cargar el mapa.</p>';
}

// ---------- Formulario (demo: no envía datos a ningún sitio) ----------
$("#formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const avisoForm = $("#aviso");
  let bien = true;
  [f.nombre, f.email].forEach((campo) => {
    const ok = campo.value.trim() && campo.checkValidity();
    campo.classList.toggle("error", !ok);
    if (!ok) bien = false;
  });
  if (!bien) {
    avisoForm.className = "aviso mal";
    avisoForm.textContent = "Revisa tu nombre y tu email, por favor.";
    return;
  }
  avisoForm.className = "aviso";
  avisoForm.textContent = `¡Gracias, ${f.nombre.value.trim().split(" ")[0]}! Así funcionaría el formulario. Es una demo: no se ha enviado nada.`;
  f.reset();
});
