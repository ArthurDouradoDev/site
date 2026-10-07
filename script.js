(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  const LINKS = {
    github: "https://github.com/ArthurDouradoDev/",
    linkedin: "https://www.linkedin.com/in/arthur-camargo-dourado/",
  };

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Cursor spotlight + coordinates ---------- */
  const coords = $("#coords");
  const pointer = { x: -9999, y: -9999, active: false };

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    root.style.setProperty("--mx", e.clientX + "px");
    root.style.setProperty("--my", e.clientY + "px");
    coords.textContent =
      "x:" + String(Math.round(e.clientX)).padStart(3, "0") +
      " y:" + String(Math.round(e.clientY)).padStart(3, "0");
  });
  window.addEventListener("pointerleave", () => { pointer.active = false; });

  /* ---------- Construction dust (canvas particles) ---------- */
  const canvas = $("#dust");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(140, (W * H) / 11000));
    particles = Array.from({ length: count }, () => makeParticle());
  }

  function makeParticle(x, y, burst) {
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? 2 + Math.random() * 4 : 0.15 + Math.random() * 0.25;
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: burst ? 1.5 + Math.random() * 2.5 : 0.6 + Math.random() * 1.6,
      hue: Math.random() < 0.18 ? "accent" : "blue",
      life: burst ? 1 : Infinity,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const linkDist = 110;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16000 && d2 > 0.01) {
          const f = (16000 - d2) / 16000;
          const d = Math.sqrt(d2);
          p.vx += (dx / d) * f * 0.6;
          p.vy += (dy / d) * f * 0.6;
        }
      }

      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life === Infinity) {
        p.vx += (Math.random() - 0.5) * 0.03;
        p.vy += (Math.random() - 0.5) * 0.03 - 0.002;
      } else {
        p.vy += 0.05;
        p.life -= 0.012;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      const alpha = p.life === Infinity ? 0.7 : Math.max(p.life, 0);
      ctx.fillStyle = p.hue === "accent"
        ? `rgba(255,197,61,${alpha})`
        : `rgba(150,195,255,${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blueprint lines between close particles
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      if (a.life !== Infinity) continue;
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        if (b.life !== Infinity) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < linkDist) {
          ctx.strokeStyle = `rgba(90,176,255,${(1 - d / linkDist) * 0.18})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  function burst(x, y, n = 24) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) particles.push(makeParticle(x, y, true));
  }

  resize();
  window.addEventListener("resize", resize);
  if (!reduceMotion) requestAnimationFrame(draw);

  /* ---------- Name "assembling" (scramble) ---------- */
  const nameEl = $("#name");
  const finalName = nameEl.dataset.text;
  const glyphs = "▚▞▛▜▙▟#/\\<>[]{}=+*01";

  function scramble(el, text, duration = 1400) {
    if (reduceMotion) { el.textContent = text; return; }
    const start = performance.now();
    const order = [...text].map(() => Math.random());
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      let html = "";
      [...text].forEach((ch, i) => {
        if (ch === " " || order[i] < t) html += ch === " " ? " " : escapeHtml(ch);
        else html += `<span class="glyph">${glyphs[(Math.random() * glyphs.length) | 0]}</span>`;
      });
      el.innerHTML = html;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = text;
    }
    requestAnimationFrame(frame);
  }

  scramble(nameEl, finalName);
  nameEl.addEventListener("pointerenter", () => scramble(nameEl, finalName, 700));

  /* ---------- Typed roles ---------- */
  const roles = [
    "desenvolvedor de software",
    "construindo coisas na web",
    "aprendendo algo novo todo dia",
    "portfólio chegando em breve",
  ];
  const typedEl = $("#typed");

  async function typeLoop() {
    if (reduceMotion) { typedEl.textContent = roles[0]; return; }
    let i = 0;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    while (true) {
      const word = roles[i % roles.length];
      for (let c = 1; c <= word.length; c++) { typedEl.textContent = word.slice(0, c); await wait(45 + Math.random() * 40); }
      await wait(1800);
      for (let c = word.length; c >= 0; c--) { typedEl.textContent = word.slice(0, c); await wait(22); }
      await wait(300);
      i++;
    }
  }
  setTimeout(typeLoop, 900);

  /* ---------- Magnetic, tilting cards ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      if (reduceMotion) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--cx", px * 100 + "%");
      card.style.setProperty("--cy", py * 100 + "%");
      card.style.setProperty("--ry", (px - 0.5) * 12 + "deg");
      card.style.setProperty("--rx", (0.5 - py) * 12 + "deg");
      card.style.setProperty("--tx", (px - 0.5) * 8 + "px");
      card.style.setProperty("--ty", (py - 0.5) * 8 + "px");
    });
    card.addEventListener("pointerleave", () => {
      ["--rx", "--ry"].forEach((v) => card.style.setProperty(v, "0deg"));
      ["--tx", "--ty"].forEach((v) => card.style.setProperty(v, "0px"));
    });
  });

  /* ---------- Construction progress ---------- */
  const BASE = 37;
  const pctEl = $("#pct");
  const fillEl = $("#fill");
  const brickBtn = $("#brick");
  let bricks = 0;
  try { bricks = parseInt(localStorage.getItem("ad-bricks") || "0", 10) || 0; } catch (_) {}

  function progress() { return Math.min(BASE + bricks, 99); }

  function renderProgress(animate = true) {
    const target = progress();
    fillEl.style.width = target + "%";
    if (!animate || reduceMotion) { pctEl.textContent = target; return; }
    const from = parseInt(pctEl.textContent, 10) || 0;
    const start = performance.now();
    (function tick(now) {
      const t = Math.min((now - start) / 800, 1);
      pctEl.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  const brickLines = [
    "+ assentar um tijolo",
    "+ mais um tijolo",
    "+ chamar o mestre de obras",
    "+ passar o rejunte",
  ];

  brickBtn.addEventListener("click", (e) => {
    const r = brickBtn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 18);
    if (progress() >= 99) {
      brickBtn.textContent = "99% é o máximo. O último 1% é do Arthur 😉";
      return;
    }
    bricks++;
    try { localStorage.setItem("ad-bricks", String(bricks)); } catch (_) {}
    brickBtn.textContent = brickLines[bricks % brickLines.length];
    renderProgress();
  });

  setTimeout(() => renderProgress(), 600);

  /* ---------- Interactive terminal ---------- */
  const out = $("#out");
  const form = $("#prompt");
  const input = $("#cmd");
  const term = $("#term");
  const history = [];
  let hIndex = 0;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function print(html, cls = "") {
    const div = document.createElement("div");
    div.className = "line " + cls;
    div.innerHTML = html;
    out.appendChild(div);
    term.scrollTop = term.scrollHeight;
  }

  async function printSlow(lines, delay = 120) {
    for (const [html, cls] of lines) {
      print(html, cls);
      if (!reduceMotion) await new Promise((r) => setTimeout(r, delay));
    }
  }

  function open(url) { window.open(url, "_blank", "noopener"); }

  const commands = {
    help() {
      printSlow([
        ["comandos disponíveis:", "info"],
        ["  sobre      quem é o Arthur", ""],
        ["  github     abre o GitHub", ""],
        ["  linkedin   abre o LinkedIn", ""],
        ["  status     andamento da obra", ""],
        ["  build      tenta terminar o site", ""],
        ["  clear      limpa o terminal", ""],
        ["dica: use ↑ e ↓ para navegar no histórico", "dim"],
      ], 40);
    },
    sobre() {
      printSlow([
        ["Arthur Camargo Dourado", "warn"],
        ["Desenvolvedor. Curioso por natureza.", ""],
        ["Gosta de transformar ideias em código e código em produto.", ""],
        ["Este site é a planta baixa do que vem por aí.", "dim"],
      ], 80);
    },
    github() {
      print(`abrindo <a href="${LINKS.github}" target="_blank" rel="noopener noreferrer">${LINKS.github}</a> ...`, "ok");
      open(LINKS.github);
    },
    linkedin() {
      print(`abrindo <a href="${LINKS.linkedin}" target="_blank" rel="noopener noreferrer">${LINKS.linkedin}</a> ...`, "ok");
      open(LINKS.linkedin);
    },
    status() {
      const p = progress();
      const blocks = Math.round(p / 5);
      print(`[${"█".repeat(blocks)}${"░".repeat(20 - blocks)}] ${p}%`, "warn");
      print("fundação: ok · estrutura: em andamento · acabamento: aguardando", "dim");
    },
    async build() {
      await printSlow([
        ["$ npm run build:portfolio", "dim"],
        ["› compilando ideias...", ""],
        ["› otimizando café ☕...", ""],
        ["› renderizando projetos...", ""],
        ["✖ erro: projetos ainda estão no forno", "warn"],
        ["tente novamente em breve. ou siga no GitHub para acompanhar 👷", "info"],
      ], 380);
    },
    clear() { out.innerHTML = ""; },
    sudo() { print("permissão negada: só o mestre de obras pode fazer isso.", "warn"); },
    ls() { print("fundacao/  estrutura/  projetos/ (vazio)  README.md", "info"); },
    whoami() { print("visitante (seja bem-vindo!)", ""); },
    hello() { print("Olá! 👋 Digite <span class='warn'>help</span> para ver o que dá pra fazer.", ""); },
  };
  commands.ajuda = commands.help;
  commands.about = commands.sobre;
  commands.oi = commands.hello;
  commands.ola = commands.hello;
  commands.cls = commands.clear;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = "";
    print(`<span class="ps">arthur@obra</span>:<span class="path">~</span>$ ${escapeHtml(raw)}`, "cmd-echo");
    if (!raw) return;
    history.push(raw);
    hIndex = history.length;
    const name = raw.split(/\s+/)[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const fn = commands[name];
    if (fn) {
      input.disabled = true;
      try { await fn(raw); } finally { input.disabled = false; input.focus(); }
    } else {
      print(`comando não encontrado: ${escapeHtml(name)}. digite <span class="warn">help</span>`, "dim");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] ?? "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = Object.keys(commands).find((k) => k.startsWith(input.value.toLowerCase()) && input.value);
      if (match) input.value = match;
    }
  });

  term.addEventListener("click", () => {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  printSlow([
    ["Bem-vindo à obra. 🏗️", "warn"],
    ["Este terminal funciona de verdade.", ""],
    ["Digite <span class='warn'>help</span> para começar.", "dim"],
  ], 260);

  /* ---------- Easter egg: Konami code ---------- */
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let k = 0;
  window.addEventListener("keydown", (e) => {
    if (e.target === input) return;
    k = e.key === konami[k] ? k + 1 : (e.key === konami[0] ? 1 : 0);
    if (k === konami.length) {
      k = 0;
      for (let i = 0; i < 6; i++) setTimeout(() => burst(Math.random() * W, Math.random() * H * 0.6, 30), i * 150);
      print("🎉 código secreto aceito! você ganhou um capacete honorário ⛑️", "ok");
    }
  });

  /* ---------- Click anywhere = dust ---------- */
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button, input, .terminal")) return;
    burst(e.clientX, e.clientY, 14);
  });

  /* ---------- Entrance reveal ---------- */
  const revealEls = [".eyebrow", ".role", ".lead", ".links", ".progress", ".terminal"];
  revealEls.forEach((sel, i) => {
    const el = $(sel);
    if (!el) return;
    el.classList.add("reveal");
    el.style.transitionDelay = 200 + i * 110 + "ms";
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }));
})();
