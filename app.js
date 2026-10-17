// Lee data/huerto.json, dibuja cada cama y muestra la ficha de la especie elegida.
const ESCALA = 5; // unidades SVG por cm
const MARGEN = 40;
const SVG_NS = "http://www.w3.org/2000/svg";

let datos = null;
let seleccion = null;

function el(tag, attrs = {}, ...hijos) {
  const svg = ["svg", "rect", "circle", "g", "text", "title"].includes(tag);
  const nodo = svg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  for (const h of hijos) nodo.append(h);
  return nodo;
}

function nombreCompleto(esp) {
  return esp.variedad ? `${esp.nombre} ${esp.variedad}` : esp.nombre;
}

function dibujarCama(cama) {
  const ancho = cama.largo_cm * ESCALA + MARGEN * 2;
  const alto = cama.ancho_cm * ESCALA + MARGEN * 2;
  const svg = el("svg", { viewBox: `0 0 ${ancho} ${alto}`, class: "bed-svg", role: "group", "aria-label": `Plano de ${cama.nombre}` });
  svg.append(el("rect", { x: MARGEN, y: MARGEN, width: cama.largo_cm * ESCALA, height: cama.ancho_cm * ESCALA, rx: 14, class: "soil" }));
  svg.append(el("text", { x: ancho / 2, y: MARGEN - 14, "text-anchor": "middle", class: "dim" }, `${cama.largo_cm} cm`));
  svg.append(el("text", { x: ancho - MARGEN + 16, y: alto / 2, "text-anchor": "middle", class: "dim", transform: `rotate(90 ${ancho - MARGEN + 16} ${alto / 2})` }, `${cama.ancho_cm} cm`));

  const px = (cm) => MARGEN + cm * ESCALA;

  for (const fila of cama.filas || []) {
    const esp = datos.especies[fila.especie];
    const g = el("g", { class: "plant", "data-especie": fila.especie, tabindex: 0, role: "button", "aria-label": `Fila de ${nombreCompleto(esp)}` });
    g.append(el("title", {}, `${nombreCompleto(esp)}: una cada ${fila.cada} cm`));
    g.append(el("rect", { class: "hit", x: px(fila.desde) - 10, y: px(fila.y) - 12, width: (fila.hasta - fila.desde) * ESCALA + 20, height: 24, rx: 12 }));
    for (let x = fila.desde; x <= fila.hasta; x += fila.cada) {
      g.append(el("circle", { cx: px(x), cy: px(fila.y), r: 6, class: `c-${esp.color}` }));
    }
    svg.append(g);
  }

  for (const p of cama.plantas || []) {
    const esp = datos.especies[p.especie];
    const g = el("g", { class: "plant", "data-especie": p.especie, tabindex: 0, role: "button", "aria-label": nombreCompleto(esp) });
    g.append(el("title", {}, nombreCompleto(esp)));
    g.append(el("circle", { class: `c-${esp.color}`, cx: px(p.x), cy: px(p.y), r: p.radio * ESCALA }));
    g.append(el("circle", { class: "hit", cx: px(p.x), cy: px(p.y), r: p.radio * ESCALA + 4 }));
    svg.append(g);
  }

  svg.addEventListener("click", (e) => {
    const g = e.target.closest(".plant");
    if (g) elegir(g.dataset.especie);
  });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest(".plant");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); elegir(g.dataset.especie); }
  });
  return svg;
}

function especiesDeCama(cama) {
  const ids = [...(cama.plantas || []), ...(cama.filas || [])].map((p) => p.especie);
  return [...new Set(ids)];
}

function pintarCamas() {
  const cont = document.getElementById("camas");
  cont.replaceChildren();
  for (const cama of datos.camas) {
    const leyenda = el("ul", { class: "legend" });
    for (const id of especiesDeCama(cama)) {
      const esp = datos.especies[id];
      const b = el("button", { type: "button", "data-especie": id, "aria-pressed": "false" }, el("span", { class: `dot c-${esp.color}` }), nombreCompleto(esp));
      b.addEventListener("click", () => elegir(id));
      leyenda.append(el("li", {}, b));
    }
    cont.append(
      el("section", { class: "panel", "aria-labelledby": `t-${cama.id}` },
        el("div", { class: "bed-head" }, el("h2", { id: `t-${cama.id}` }, cama.nombre), el("span", { class: "meta" }, `${cama.largo_cm} × ${cama.ancho_cm} cm · ${cama.sol}`)),
        dibujarCama(cama),
        leyenda
      )
    );
  }
}

function pintarFicha() {
  const cont = document.getElementById("ficha");
  cont.replaceChildren();
  if (!seleccion) {
    cont.append(el("h2", {}, "Ficha"), el("p", { class: "empty" }, "Toca una planta de la cama para ver su ficha."));
    return;
  }
  const esp = datos.especies[seleccion];
  const tabla = el("table");
  for (const [dato, valor] of esp.ficha) tabla.append(el("tr", {}, el("th", { scope: "row" }, dato), el("td", {}, valor)));
  const pasos = el("ol");
  esp.pasos.forEach((p) => pasos.append(el("li", {}, p)));
  const problemas = el("ul");
  esp.problemas.forEach(([t, d]) => problemas.append(el("li", {}, el("strong", {}, `${t}: `), d)));
  const consejos = el("ul");
  esp.consejos.forEach((c) => consejos.append(el("li", {}, c)));

  cont.append(
    el("div", {}, el("h2", {}, esp.nombre), esp.variedad ? el("p", { class: "sub" }, esp.variedad) : ""),
    el("p", {}, esp.resumen),
    el("h3", {}, "Ficha rápida"), tabla,
    el("h3", {}, "Cómo sembrar"), pasos,
    el("h3", {}, "Problemas comunes"), problemas,
    el("h3", {}, "Consejos"), consejos
  );
  if (esp.doc) cont.append(el("a", { href: esp.doc, target: "_blank", rel: "noopener" }, "Abrir la ficha completa"));
}

function pintarBitacora() {
  const lista = document.getElementById("bitacora");
  lista.replaceChildren();
  const entradas = [...(datos.bitacora || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  for (const e of entradas) {
    const cama = datos.camas.find((c) => c.id === e.cama);
    lista.append(el("li", {}, el("time", { datetime: e.fecha }, e.fecha), el("span", {}, cama ? `${cama.nombre}: ${e.nota}` : e.nota)));
  }
}

function elegir(id) {
  seleccion = seleccion === id ? null : id;
  document.querySelectorAll(".bed-svg").forEach((s) => s.classList.toggle("has-sel", !!seleccion));
  document.querySelectorAll(".plant").forEach((g) => g.classList.toggle("sel", g.dataset.especie === seleccion));
  document.querySelectorAll(".legend button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.especie === seleccion)));
  pintarFicha();
}

async function iniciar() {
  try {
    const r = await fetch("data/huerto.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    datos = await r.json();
  } catch (err) {
    document.getElementById("camas").textContent = `No se pudo leer data/huerto.json (${err.message}). Abre el sitio con un servidor, no como archivo suelto.`;
    return;
  }
  document.getElementById("titulo").textContent = datos.huerto.nombre;
  document.getElementById("zona").textContent = `${datos.huerto.zona} · ${datos.huerto.nota}`;
  pintarCamas();
  pintarBitacora();
  elegir(Object.keys(datos.especies)[0]);
}

iniciar();
