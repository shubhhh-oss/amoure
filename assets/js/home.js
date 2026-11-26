// Home page: real-candle hero video, the bedside ring of candles, quote, buy section, poster wall.
(function () {
  const { PRODUCTS, CFG, money, esc, productImage, reduceMotion, EASE } = window.Amoure;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (gsap && ST) gsap.registerPlugin(ST);

  // ---------- opening: the room is dark, the name appears, then the candle ----------
  const intro = document.querySelector(".intro");
  const hasIntro = document.documentElement.classList.contains("has-intro") && intro;
  function endIntro() {
    if (!intro || !intro.isConnected) return;
    intro.remove();
    document.documentElement.classList.remove("has-intro");
    try { sessionStorage.setItem("amoure_intro", "1"); } catch (e) {}
    if (window.Amoure.lenis) window.Amoure.lenis.start();
  }
  if (hasIntro && gsap) {
    const word = intro.querySelector(".intro-word");
    word.innerHTML = [...word.textContent].map((c) => `<span>${c}</span>`).join("");
    window.addEventListener("DOMContentLoaded", () => window.Amoure.lenis && window.Amoure.lenis.stop());
    gsap.timeline({ onComplete: endIntro })
      .fromTo(word.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.07 }, 0.2)
      .fromTo(".intro-line", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE }, 0.7)
      .to(intro, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 1.9);
    setTimeout(endIntro, 5000);
  } else if (intro) endIntro();

  // ---------- hero video ----------
  const hero = document.querySelector(".hero");
  const outVid = hero.querySelector("[data-hero-out]");
  const loop = window.Amoure.loopVideo([...hero.querySelectorAll("[data-hero-loop]")], CFG.heroVideo, { poster: CFG.heroPoster || "" });
  const playLoop = () => loop.play();
  const pauseLoop = () => loop.pause();
  const firstVid = loop.front();
  if (reduceMotion) firstVid.removeAttribute("autoplay"); else playLoop();
  firstVid.addEventListener("playing", () => hero.classList.add("is-playing"), { once: true });

  // Optional blow-out clip (CFG.heroOutVideo): plays once when you scroll down, loop returns on the way up.
  let heroOut = false;
  if (CFG.heroOutVideo && !reduceMotion) {
    outVid.src = CFG.heroOutVideo;
    outVid.preload = "auto";
    window.addEventListener("scroll", () => {
      const p = window.scrollY / Math.max(1, hero.offsetHeight);
      if (!heroOut && p > 0.12) {
        heroOut = true; outVid.currentTime = 0; outVid.play().catch(() => {});
        hero.classList.add("is-out");
      } else if (heroOut && p < 0.04) {
        heroOut = false; hero.classList.remove("is-out"); playLoop();
      }
    }, { passive: true });
  }
  // Save battery: pause the loop while the hero is off screen.
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !heroOut) playLoop(); else pauseLoop(); }).observe(hero);
  }

  // ---------- how ordering works (all from config, so it stays true) ----------
  const promise = document.querySelector("[data-promise]");
  if (promise) {
    const { icon } = window.Amoure;
    const pay = (CFG.paymentOptions || []).map((o) => o.replace(/\s*\(.*\)/, "")).join(" or ");
    promise.innerHTML = [
      ["truck", "Free delivery", `On orders over ${money(CFG.freeShippingOver)}`],
      ["gift", "A note in the box", "Write it at checkout"],
      ["wallet", pay || "Easy payment", "Pay after we confirm"],
      ["chat", "Confirmed on WhatsApp", "We reply to confirm each order"]
    ].map(([i, t, d]) => `<li>${icon(i, 20)}<span><strong>${esc(t)}</strong>${esc(d)}</span></li>`).join("");
  }

  // ---------- buy section ----------
  const buy = window.AmoureBuy.mount(document.getElementById("buy-block"), PRODUCTS[0].id, {
    onSelect: (id) => tray.show(PRODUCTS.findIndex((p) => p.id === id))
  });

  // ---------- the bedside ring: real photos on a turning ring, one candle at a time ----------
  const tray = (function () {
    const section = document.getElementById("tray");
    const stage = section.querySelector("[data-stage]");
    const ring = section.querySelector("[data-ring]");
    const n = PRODUCTS.length;
    const copy = section.querySelector("[data-copy]");
    const f = (k) => copy.querySelector(`[data-t="${k}"]`);
    const counter = section.querySelector("[data-counter]");

    ring.innerHTML = PRODUCTS.map((p, i) => `
      <button type="button" class="ring-item" data-i="${i}" tabindex="-1" aria-label="Show ${esc(p.name)}">
        <span class="ring-shadow"></span>
        <span class="arch">${productImage(p)}</span>
      </button>`).join("");
    const items = [...ring.children];

    let rot = 0, index = 0, tween = null;
    const geo = {};
    function measure() {
      const r = stage.getBoundingClientRect();
      geo.cx = r.width / 2;
      geo.cy = r.height * 0.8;            // where the front candle stands
      geo.rx = r.width * 0.34;
      geo.ry = r.height * 0.1;
      geo.w = items[0].offsetWidth;
      geo.h = items[0].offsetHeight;
    }
    function layout() {
      items.forEach((el, i) => {
        const a = ((i - rot) / n) * Math.PI * 2;
        const depth = (Math.cos(a) + 1) / 2;           // 1 = front, 0 = back
        const scale = 0.42 + 0.58 * depth;
        const x = geo.cx + Math.sin(a) * geo.rx - geo.w / 2;
        const y = geo.cy - (1 - depth) * geo.ry * 2 - geo.h;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.setProperty("--d", depth.toFixed(3));
      });
    }

    function writeCopy(p) {
      f("name").textContent = p.name;
      f("meaning").textContent = p.meaning;
      f("desc").textContent = p.description;
      f("top").textContent = p.notes.top;
      f("heart").textContent = p.notes.heart;
      f("base").textContent = p.notes.base;
      const stock = window.Amoure.stockNote(p) || (p.inStock ? "" : "Sold out");
      f("meta").textContent = [`${p.size} · about ${p.burnTime} burn time`, stock].filter(Boolean).join(" · ");
      f("add").dataset.add = p.inStock ? p.id : "";
      f("add").disabled = !p.inStock;
      f("add").textContent = p.inStock ? "Add to cart" : "Sold out";
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      section.querySelectorAll("[data-mood-pick]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.moodPick === p.mood)));
    }
    let copyTl = null, lastPrice = PRODUCTS[0].price;
    function updateCopy(animate = true) {
      const p = PRODUCTS[index];
      const priceEl = f("price");
      if (!gsap || reduceMotion || !animate) { writeCopy(p); priceEl.textContent = money(p.price); lastPrice = p.price; return; }
      const parts = copy.querySelectorAll("[data-swap]");
      if (copyTl) copyTl.kill();
      copyTl = gsap.timeline()
        .to(parts, { opacity: 0, y: -8, duration: 0.18, ease: "power1.in", stagger: 0.02 })
        .add(() => writeCopy(p))
        .to(parts, { opacity: 1, y: 0, duration: 0.55, ease: EASE, stagger: 0.04, startAt: { y: 10 } });
      const o = { v: lastPrice };
      lastPrice = p.price;
      gsap.to(o, { v: p.price, duration: 0.6, ease: EASE, onUpdate: () => { priceEl.textContent = money(o.v); } });
    }

    function goTo(target, dur = 1.1) {
      const newIndex = ((Math.round(target) % n) + n) % n;
      const changed = newIndex !== index;
      index = newIndex;
      items.forEach((el, i) => el.classList.toggle("is-front", i === index));
      if (tween) tween.kill();
      if (!gsap || reduceMotion) { rot = target; layout(); }
      else {
        const o = { r: rot };
        tween = gsap.to(o, { r: target, duration: dur, ease: "power3.inOut", onUpdate: () => { rot = o.r; layout(); } });
      }
      if (changed) {
        updateCopy();
        if (buy.current !== PRODUCTS[index].id) buy.set(PRODUCTS[index].id, { silent: true });
      }
    }
    const next = () => goTo(Math.round(rot) + 1);
    const prev = () => goTo(Math.round(rot) - 1);
    function show(i) {
      if (i < 0) return;
      const base = Math.round(rot);
      let diff = (((i - base) % n) + n) % n;
      if (diff > n / 2) diff -= n;
      goTo(base + diff);
    }

    // drag or swipe left/right
    let drag = null;
    const perStep = () => Math.max(140, geo.rx * 0.9);
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, rot, moved: false, samples: [{ x: e.clientX, t: performance.now() }] };
      if (tween) tween.kill();
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; stage.classList.add("is-dragging"); items.forEach((el) => el.classList.remove("is-front")); }
      if (!drag.moved) return;
      rot = drag.rot - dx / perStep();
      layout();
      drag.samples.push({ x: e.clientX, t: performance.now() });
      if (drag.samples.length > 5) drag.samples.shift();
    });
    window.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      stage.classList.remove("is-dragging");
      if (!d.moved) {
        const hit = e.target.closest && e.target.closest(".ring-item");
        if (hit) show(Number(hit.dataset.i));
        return;
      }
      const s0 = d.samples[0], s1 = d.samples[d.samples.length - 1];
      const v = (s1.x - s0.x) / Math.max(16, s1.t - s0.t);
      goTo(Math.round(rot - (v * 160) / perStep()), 1.0);
    });
    let acc = 0, lock = false;
    stage.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 40) { acc > 0 ? next() : prev(); acc = 0; lock = true; setTimeout(() => { lock = false; }, 600); }
    }, { passive: false });
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });
    section.querySelector("[data-next]").addEventListener("click", next);
    section.querySelector("[data-prev]").addEventListener("click", prev);

    // "Tonight is for": turn to a candle of that mood (again to see the next one)
    section.querySelectorAll("[data-mood-pick]").forEach((chip) => chip.addEventListener("click", () => {
      const ids = PRODUCTS.map((p, i) => (p.mood === chip.dataset.moodPick ? i : -1)).filter((i) => i >= 0);
      if (!ids.length) return;
      const at = ids.indexOf(index);
      show(ids[at === -1 ? 0 : (at + 1) % ids.length]);
    }));

    // Holding a candle in a dark room: on desktop the pointer warms the part of the room it is near
    const lit = section.querySelector(".tray-room-lit");
    if (lit && matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
      const pos = { x: 0.72, y: 0.6, tx: 0.72, ty: 0.6 };
      let raf = 0;
      const step = () => {
        pos.x += (pos.tx - pos.x) * 0.08; pos.y += (pos.ty - pos.y) * 0.08;
        section.style.setProperty("--mx", (pos.x * 100).toFixed(2) + "%");
        section.style.setProperty("--my", (pos.y * 100).toFixed(2) + "%");
        raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.001 ? requestAnimationFrame(step) : 0;
      };
      section.addEventListener("pointermove", (e) => {
        const r = section.getBoundingClientRect();
        pos.tx = (e.clientX - r.left) / r.width; pos.ty = (e.clientY - r.top) / r.height;
        section.classList.add("is-lighting");
        if (!raf) raf = requestAnimationFrame(step);
      });
      section.addEventListener("pointerleave", () => section.classList.remove("is-lighting"));
    }

    measure(); layout(); updateCopy(false);
    items[0].classList.add("is-front");
    window.addEventListener("resize", () => { measure(); layout(); });
    window.addEventListener("load", () => { measure(); layout(); });
    return { show, section };
  })();

  // ---------- a small candle that burns down as you scroll ----------
  const burn = document.createElement("div");
  burn.className = "burn";
  burn.setAttribute("aria-hidden", "true");
  burn.innerHTML = '<span class="burn-flame"></span><span class="burn-wick"></span><span class="burn-wax"></span>';
  document.body.appendChild(burn);
  const updateBurn = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    burn.style.setProperty("--wax", (1 - p * 0.9).toFixed(3));
    burn.classList.toggle("is-out", p > 0.985);
  };
  window.addEventListener("scroll", updateBurn, { passive: true });
  window.addEventListener("resize", updateBurn);
  updateBurn();

  // ---------- write the card ----------
  const NOTE_KEY = "amoure_gift_note_v1";
  const noteForm = document.querySelector("[data-note-form]");
  if (noteForm) {
    const card = document.querySelector("[data-note-card]");
    const out = (k) => card.querySelector(`[data-note-${k}]`);
    const saved = (() => { try { return JSON.parse(localStorage.getItem(NOTE_KEY)) || {}; } catch { return {}; } })();
    ["to", "from", "msg"].forEach((k) => { if (saved[k]) noteForm.elements[k].value = saved[k]; });
    const render = () => {
      const v = (k) => noteForm.elements[k].value.trim();
      const ph = (k) => noteForm.elements[k].placeholder;
      out("to").textContent = v("to") || ph("to");
      out("from").textContent = v("from") || ph("from");
      out("msg").textContent = v("msg") || ph("msg");
      card.classList.toggle("is-placeholder", !v("msg"));
      document.querySelector("[data-note-count]").textContent = noteForm.elements.msg.value.length;
    };
    noteForm.addEventListener("input", () => { render(); document.querySelector("[data-note-status]").textContent = ""; });
    noteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = { to: noteForm.elements.to.value.trim(), from: noteForm.elements.from.value.trim(), msg: noteForm.elements.msg.value.trim() };
      const status = document.querySelector("[data-note-status]");
      if (!note.msg) { status.textContent = "Write a message first"; noteForm.elements.msg.focus(); return; }
      localStorage.setItem(NOTE_KEY, JSON.stringify(note));
      status.textContent = "Saved. It will be added to your order at checkout";
      if (gsap && !reduceMotion) gsap.fromTo(card, { y: 0 }, { y: -10, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 });
    });
    render();
  }

  // ---------- quote: words light up one by one ----------
  const quote = document.querySelector("[data-words]");
  if (quote) {
    quote.innerHTML = quote.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="word" style="--i:${i}">${esc(w)}</span>`).join(" ");
  }

  // ---------- scent marquee ----------
  const marquee = document.querySelector("[data-marquee]");
  if (marquee) {
    const words = [...new Set(PRODUCTS.flatMap((p) => [p.notes.top, p.notes.heart, p.notes.base]))];
    const row = words.map((w) => `<span>${esc(w)}</span><i aria-hidden="true"></i>`).join("");
    marquee.innerHTML = `<div class="marquee-track">${row}${row}</div>`;
  }

  // ---------- scroll scenes ----------
  if (!gsap || !ST || reduceMotion) {
    document.documentElement.classList.add("no-scenes");
    return;
  }

  gsap.from(".hero [data-hero-part]", { opacity: 0, y: 14, duration: 1.2, ease: EASE, stagger: 0.1, delay: hasIntro ? 2.5 : 0.3 });
  gsap.from(".hero-media", { opacity: 0, scale: 1.04, duration: 2.2, ease: "power2.out", delay: hasIntro ? 2 : 0 });
  // as you scroll away, the candle eases closer and the room darkens
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero-media", { scale: 1.12, ease: "none" }, 0)
    .to(".hero-scrim", { opacity: 1, ease: "none" }, 0)
    .to(".hero-content", { opacity: 0, y: -50, ease: "none", duration: 0.6 }, 0);

  const track = document.querySelector(".marquee-track");
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 55, ease: "none", repeat: -1 });
    ST.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const boost = 1 + Math.min(5, Math.abs(self.getVelocity()) / 300);
        gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.2, ease: "power1.out" });
      }
    });
  }

  const mm = gsap.matchMedia();
  const traySec = tray.section;
  // ring: the room warms as the candle comes into view; on large screens the section holds briefly
  gsap.fromTo(traySec, { "--room": 0 }, { "--room": 1, ease: "none", scrollTrigger: { trigger: traySec, start: "top 80%", end: "top 10%", scrub: 0.6 } });
  gsap.fromTo(".ring-item .arch", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.07,
    scrollTrigger: { trigger: traySec, start: "top 60%" } });
  mm.add("(min-width: 900px)", () => {
    gsap.timeline({ scrollTrigger: { trigger: traySec, start: "top 85%", end: "top top", scrub: 0.6 } })
      .fromTo(".tray-copy [data-in]", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, ease: "none" }, 0.1);
    gsap.timeline({ scrollTrigger: { trigger: traySec, start: "top top", end: "+=50%", scrub: 0.8, pin: true, anticipatePin: 1 } })
      .fromTo(".tray-room img", { scale: 1.08 }, { scale: 1, ease: "none" }, 0)
      .fromTo(".tray-hint", { opacity: 0 }, { opacity: 1, ease: "none" }, 0.3);
  });

  if (quote) {
    gsap.fromTo(quote.querySelectorAll(".word"), { opacity: 0.16 }, {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: ".statement", start: "top 75%", end: "bottom 55%", scrub: 0.5 }
    });
    gsap.from(".statement-sign", { opacity: 0, y: 12, duration: 0.8, ease: EASE, scrollTrigger: { trigger: ".statement-sign", start: "top 90%" } });
  }

  // buy: the photo settles in as it scrolls into view
  gsap.timeline({ scrollTrigger: { trigger: "#buy", start: "top 80%", end: "top 15%", scrub: 0.6 } })
    .fromTo(buy.candle, { scale: 1.05 }, { scale: 1, ease: "none" }, 0)
    .fromTo("#buy .buy-panel > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: "none" }, 0.1);

  // the card settles onto its envelope as the section arrives
  gsap.timeline({ scrollTrigger: { trigger: ".note", start: "top 75%", end: "top 25%", scrub: 0.6 } })
    .fromTo(".note-card", { y: 60, rotation: -6 }, { y: 0, rotation: -2.5, ease: "none" }, 0)
    .fromTo(".note-envelope", { y: 30, rotation: 8 }, { y: 0, rotation: 4, ease: "none" }, 0);

  // full-bleed band: slow push-in while it is on screen
  gsap.fromTo(".band-media img", { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".band-text > *", { opacity: 0, y: 20, duration: 1, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: ".band", start: "top 55%" } });

  // poster wall: scroll down to walk along it
  mm.add("(min-width: 900px)", () => {
    const wallTrack = document.querySelector(".posters-track");
    const dist = () => Math.max(0, wallTrack.scrollWidth - window.innerWidth + 96);
    gsap.to(wallTrack, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".posters", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  });

  window.addEventListener("load", () => ST.refresh());
})();
