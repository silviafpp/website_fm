(() => {
  // Fotos: coloca os ficheiros em /photos com estes nomes (slug-1.jpg, slug-2.jpg, slug-3.jpg).
  // Fotos em falta são ignoradas automaticamente. Podes trocar os caminhos aqui em baixo.
  const G = { E: "Eastern", C: "Central", W: "Western" };
  const ISLANDS = [
    { slug: "sao-miguel", name: "São Miguel", nick: "The green island", g: "E", lon: -25.5, lat: 37.78, len: 64, wid: 16, ang: -5, lab: [0, 46, "middle"],
      text: "The largest island, with crater lakes, hot springs and tea plantations.",
      photos: ["capa.jpg", "photos/sao-miguel-2.jpg", "photos/sao-miguel-3.jpg"] },
    { slug: "santa-maria", name: "Santa Maria", nick: "The sun island", g: "E", lon: -25.08, lat: 36.96, len: 17, wid: 10, ang: -20, lab: [-30, 6, "end"],
      text: "The warmest and driest island, with sandy beaches and whitewashed villages." },
    { slug: "terceira", name: "Terceira", nick: "The lilac island", g: "C", lon: -27.2, lat: 38.72, len: 29, wid: 17, ang: -15, lab: [0, 42, "middle"],
      text: "Home to Angra do Heroísmo, a UNESCO World Heritage city, and the Algar do Carvão volcanic cave." },
    { slug: "graciosa", name: "Graciosa", nick: "The white island", g: "C", lon: -28.0, lat: 39.05, len: 13, wid: 8, ang: -50, lab: [0, -26, "middle"],
      text: "A UNESCO Biosphere Reserve, known for its sulphur cave inside a volcano and traditional windmills." },
    { slug: "sao-jorge", name: "São Jorge", nick: "The long island", g: "C", lon: -28.05, lat: 38.65, len: 55, wid: 7, ang: -25, lab: [-10, -36, "middle"],
      text: "A narrow island of tall cliffs and fajãs, small flat plains by the sea. Famous for its cheese." },
    { slug: "pico", name: "Pico", nick: "The mountain island", g: "C", lon: -28.33, lat: 38.47, len: 42, wid: 14, ang: -20, lab: [8, 50, "middle"],
      text: "Home to Mount Pico, the highest peak in Portugal at 2,351 metres, and a UNESCO vineyard landscape." },
    { slug: "faial", name: "Faial", nick: "The blue island", g: "C", lon: -28.7, lat: 38.58, len: 21, wid: 14, ang: 0, lab: [-34, 5, "end"],
      text: "A sailors' stop-over: the Horta marina and the Capelinhos volcano, which erupted in 1957." },
    { slug: "flores", name: "Flores", nick: "The island of flowers", g: "W", lon: -31.2, lat: 39.45, len: 17, wid: 11, ang: -80, lab: [36, 6, "start"],
      text: "Waterfalls, roads lined with hydrangeas and crater lakes." },
    { slug: "corvo", name: "Corvo", nick: "The smallest island", g: "W", lon: -31.1, lat: 39.67, len: 6, wid: 4, ang: 0, lab: [20, 5, "start"],
      text: "The smallest island, with fewer than 500 people and a green crater at its heart." },
  ];

  const X = lon => (lon + 31.7) * 176 + 20;
  const Y = lat => (39.95 - lat) * 222 + 40;
  const K = 2.5; // px por km (com um pouco de exagero para se ver bem)

  function rng(seed) { let s = seed % 2147483646 + 1; return () => (s = s * 16807 % 2147483647) / 2147483647; }

  function shape(i) {
    const r = rng([...i.slug].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919);
    const rx = Math.max(i.len * K / 2, 9), ry = Math.max(i.wid * K / 2, 7);
    const a = i.ang * Math.PI / 180, cx = X(i.lon), cy = Y(i.lat), N = 14, amp = i.len > 20 ? 0.13 : 0.08;
    const P = [];
    for (let k = 0; k < N; k++) {
      const t = 2 * Math.PI * k / N, n = 1 + (r() - 0.5) * 2 * amp;
      const px = Math.cos(t) * rx * n, py = Math.sin(t) * ry * n;
      P.push([cx + px * Math.cos(a) - py * Math.sin(a), cy + px * Math.sin(a) + py * Math.cos(a)]);
    }
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let k = 0; k < N; k++) {
      const p0 = P[(k - 1 + N) % N], p1 = P[k], p2 = P[(k + 1) % N], p3 = P[(k + 2) % N];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  const $ = id => document.getElementById(id);
  const svg = $("azmap"), chips = $("chips"), thumbs = $("thumbs");
  const main = $("mainPhoto"), empty = $("photoEmpty");

  svg.innerHTML = ISLANDS.map(i => {
    const d = shape(i), [dx, dy, an] = i.lab;
    return `<g class="isl" data-slug="${i.slug}" tabindex="0" role="button" aria-pressed="false" aria-label="${i.name}">
      <path class="hit" d="${d}"/><path class="shape" d="${d}"/>
      <text x="${(X(i.lon) + dx).toFixed(1)}" y="${(Y(i.lat) + dy).toFixed(1)}" text-anchor="${an}">${i.name}</text></g>`;
  }).join("");

  chips.innerHTML = ISLANDS.map(i => `<button type="button" data-slug="${i.slug}" aria-pressed="false">${i.name}</button>`).join("");

  const probe = src => new Promise(res => { const im = new Image(); im.onload = () => res(src); im.onerror = () => res(null); im.src = src; });
  const cache = {};
  const photosOf = i => cache[i.slug] ||= Promise.all((i.photos || [1, 2, 3].map(n => `photos/${i.slug}-${n}.jpg`)).map(probe)).then(l => l.filter(Boolean));

  let token = 0;
  async function select(slug) {
    const i = ISLANDS.find(x => x.slug === slug), me = ++token;
    document.querySelectorAll("[data-slug]").forEach(el => {
      const on = el.dataset.slug === slug;
      el.classList.toggle("on", on); el.setAttribute("aria-pressed", on);
    });
    $("pName").textContent = i.name;
    $("pNick").textContent = `${i.nick}, in the ${G[i.g]} group`;
    $("pText").textContent = i.text;
    $("pLink").href = `./islands.html#${i.slug}`;
    $("pLink").textContent = `More about ${i.name}`;
    const list = await photosOf(i);
    if (me !== token) return;
    thumbs.innerHTML = ""; main.hidden = !list.length; empty.hidden = !!list.length;
    if (!list.length) { empty.textContent = `Photos from ${i.name} are coming soon.`; return; }
    const show = k => {
      main.src = list[k]; main.alt = `${i.name}, photo ${k + 1}`;
      main.style.animation = "none"; void main.offsetWidth; main.style.animation = "";
      thumbs.querySelectorAll("button").forEach((b, n) => b.setAttribute("aria-pressed", n === k));
    };
    if (list.length > 1) list.forEach((src, k) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", `Show photo ${k + 1}`);
      b.innerHTML = `<img src="${src}" alt="">`; b.onclick = () => show(k); thumbs.append(b);
    });
    show(0);
  }

  svg.addEventListener("click", e => { const g = e.target.closest(".isl"); if (g) select(g.dataset.slug); });
  svg.addEventListener("keydown", e => {
    const g = e.target.closest(".isl");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g.dataset.slug); }
  });
  chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b) select(b.dataset.slug); });

  select("sao-miguel");
})();