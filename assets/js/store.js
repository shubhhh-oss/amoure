// AMOURÉ shared code: cart, header, footer, gift-box cart dock, smooth scroll, reveals.
// No server needed: the cart lives in the browser (localStorage).
(function () {
  const CFG = window.AMOURE_CONFIG;
  const PRODUCTS = window.AMOURE_PRODUCTS;
  const Auth = window.AmoureAuth;
  const CART_KEY = "amoure_cart_v1";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const EASE = "expo.out"; // close to cubic-bezier(0.22, 1, 0.36, 1)

  // ---------- helpers ----------
  const money = (n) => CFG.currency + Math.round(Number(n)).toLocaleString("en-IN");
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  // Stock: "stock" is how many are left (set in the product manager). Empty means not counted.
  // A counted candle at 0 is sold out; nobody can add more than are left (and never more than 20).
  PRODUCTS.forEach((p) => { if (typeof p.stock === "number") p.inStock = p.stock > 0; });
  const maxQty = (p) => (!p || !p.inStock ? 0 : typeof p.stock === "number" ? Math.min(20, p.stock) : 20);
  const LOW_STOCK = 5;
  const stockNote = (p) => (p && p.inStock && typeof p.stock === "number" && p.stock <= LOW_STOCK ? `Only ${p.stock} left` : "");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = document.body.dataset.page || "";

  // Lucide icon paths (lucide.dev, ISC licence), 1.5 stroke.
  const ICONS = {
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    swipe: '<path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 8-4 4 4 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  };
  const icon = (name, size = 18) =>
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // Drawn frosted-glass jar, shown when a product has no photo or its photo fails to load.
  function candleSVG(color) {
    const id = "j" + Math.random().toString(36).slice(2, 7);
    return `
<svg viewBox="0 0 200 250" class="candle-svg" role="img" aria-label="Candle">
  <defs>
    <linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity=".75"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".7"/></linearGradient>
  </defs>
  <rect width="200" height="250" fill="#140A0D"/>
  <ellipse cx="100" cy="96" rx="70" ry="56" fill="#EFD98E" opacity=".10"/>
  <path class="flame" d="M100 62 C 92 78, 93 90, 100 95 C 107 90, 108 78, 100 62 Z" fill="#EFD98E"/>
  <rect x="58" y="100" width="84" height="110" rx="12" fill="url(#${id})"/>
  <rect x="72" y="140" width="56" height="34" rx="3" fill="#FFF6DF" opacity=".92"/>
  <text x="100" y="161" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="11" letter-spacing="1.5" fill="#642D42">AMOURÉ</text>
</svg>`;
  }

  function productImage(p, cls = "") {
    if (!p.image) return candleSVG(p.color || "#D4A0AA");
    return `<img class="${cls}" src="${esc(p.image)}" alt="${esc(p.name)} candle" data-color="${esc(p.color || "#D4A0AA")}"
      style="object-position:${esc(p.imagePosition || "50% 50%")}" decoding="async" draggable="false">`;
  }

  // If a photo path is wrong, fall back to the drawn jar instead of a broken image.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.color) {
      const wrap = document.createElement("span");
      wrap.className = "img-fallback " + img.className;
      wrap.innerHTML = candleSVG(img.dataset.color);
      img.replaceWith(wrap);
    }
  }, true);

  // ---------- cart ----------
  const Cart = {
    read() {
      try {
        return (JSON.parse(localStorage.getItem(CART_KEY)) || [])
          .filter((i) => byId(i.id) && i.qty > 0)
          .map((i) => ({ ...i, qty: Math.min(i.qty, maxQty(byId(i.id))) }))
          .filter((i) => i.qty > 0);
      } catch { return []; }
    },
    write(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCounts(); },
    add(id, qty = 1) {
      const items = Cart.read();
      const found = items.find((i) => i.id === id);
      const max = maxQty(byId(id));
      if (found) found.qty = Math.min(max, found.qty + qty); else items.push({ id, qty: Math.min(max, qty) });
      Cart.write(items);
    },
    setQty(id, qty) {
      let items = Cart.read();
      if (qty <= 0) items = items.filter((i) => i.id !== id);
      else items.forEach((i) => { if (i.id === id) i.qty = Math.min(maxQty(byId(id)), qty); });
      Cart.write(items);
    },
    remove(id) { Cart.setQty(id, 0); },
    clear() { Cart.write([]); },
    count() { return Cart.read().filter((i) => byId(i.id)).reduce((n, i) => n + i.qty, 0); },
    lines() {
      // a candle that was taken out of the shop drops out of the cart instead of breaking it
      return Cart.read().filter((i) => byId(i.id)).map((i) => { const p = byId(i.id); return { ...i, product: p, total: p.price * i.qty }; });
    },
    totals() {
      const subtotal = Cart.lines().reduce((s, l) => s + l.total, 0);
      const shipping = subtotal === 0 || subtotal >= CFG.freeShippingOver ? 0 : CFG.shippingFee;
      return { subtotal, shipping, total: subtotal + shipping };
    }
  };

  // ---------- header ----------
  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const user = Auth && Auth.current();
    const first = user ? user.name.split(" ")[0] : "";
    const account = user
      ? `<a class="nav-user" href="account.html">${icon("user", 16)}<span>${esc(first)}</span></a>`
      : `<a class="nav-text" href="signin.html">Sign in</a><a class="btn btn-sm btn-outline" href="signup.html">Sign up</a>`;
    const accountMobile = user
      ? `<a href="account.html">My account</a>`
      : `<a href="signin.html">Sign in</a><a href="signup.html">Sign up</a>`;

    el.className = "site-header" + (page === "home" ? "" : " is-solid");
    el.innerHTML = `
      <div class="nav wrap">
        <a class="logo" href="index.html" aria-label="AMOURÉ home">AMOURÉ</a>
        <nav class="nav-links" aria-label="Main">
          <a href="index.html#tray">Collection</a>
          <a href="shop.html" ${page === "shop" ? 'aria-current="page"' : ""}>Shop</a>
          <a href="shop.html?mood=gifting">Gifting</a>
        </nav>
        <div class="nav-actions">
          <span class="nav-account">${account}</span>
          <a class="nav-cart" href="cart.html" aria-label="Cart">${icon("bag")}<span class="nav-count" data-cart-count hidden>0</span></a>
          <button class="nav-menu" type="button" aria-label="Open menu" aria-expanded="false">${icon("menu")}</button>
        </div>
      </div>
      <div class="mobile-menu" hidden>
        <a href="index.html#tray">Collection</a>
        <a href="shop.html">Shop</a>
        <a href="shop.html?mood=gifting">Gifting</a>
        <span class="mobile-sep"></span>
        ${accountMobile}
      </div>`;

    const btn = el.querySelector(".nav-menu");
    const menu = el.querySelector(".mobile-menu");
    btn.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = icon(open ? "x" : "menu");
      el.classList.toggle("menu-open", open);
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) btn.click(); });

    if (page === "home") {
      const onScroll = () => el.classList.toggle("is-solid", window.scrollY > 24);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  // ---------- footer ----------
  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    const user = Auth && Auth.current();
    const contact = [
      CFG.instagram && `<a href="${esc(CFG.instagram)}" target="_blank" rel="noopener">Instagram</a>`,
      CFG.email && `<a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a>`,
      CFG.whatsappNumber && `<a href="https://wa.me/${esc(CFG.whatsappNumber)}" target="_blank" rel="noopener">WhatsApp</a>`
    ].filter(Boolean);
    el.className = "site-footer";
    el.innerHTML = `
      <div class="wrap">
        <div class="footer-top">
          <p class="footer-line">${esc(CFG.tagline)}</p>
          <span class="footer-seal" aria-hidden="true">A</span>
        </div>
        <div class="footer-cols">
          <nav aria-label="Shop">
            <h3>Shop</h3>
            <a href="shop.html">All candles</a>
            <a href="shop.html?mood=romance">Romance</a>
            <a href="shop.html?mood=calm">Calm</a>
            <a href="shop.html?mood=gifting">Gifting</a>
          </nav>
          <nav aria-label="Gifts">
            <h3>Gifts</h3>
            <a href="index.html#note">Write the card</a>
            <a href="index.html#buy">Choose a candle</a>
            <a href="cart.html">Your cart</a>
          </nav>
          <nav aria-label="Account">
            <h3>Account</h3>
            ${user ? `<a href="account.html">My account</a>` : `<a href="signin.html">Sign in</a><a href="signup.html">Create an account</a>`}
            ${contact.length ? `<h3 class="footer-sub">Say hello</h3>${contact.join("")}` : ""}
          </nav>
          <div class="footer-care">
            <h3>Candle care</h3>
            <p>Burn until the whole top has melted on the first light. Trim the wick before each light. Never leave a burning candle unattended.</p>
          </div>
        </div>
        <div class="footer-base">
          <a class="footer-word" href="index.html" aria-label="AMOURÉ home">AMOURÉ</a>
          <p class="fine">Free delivery on orders over ${money(CFG.freeShippingOver)} · © ${new Date().getFullYear()} AMOURÉ</p>
        </div>
      </div>`;
  }

  // ---------- gift-box cart dock ----------
  // Boxes stack in a small pyramid in the bottom corner: 3, then 2, then 1.
  const SLOTS = [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1], [1, 2]];
  const BOX_W = 30, BOX_H = 22, GAP = 2;

  // stackCount lets the meta text update now while the boxes wait for the throw to land
  function renderDock(stackCount) {
    let dock = document.querySelector(".gift-dock");
    if (!dock) {
      dock = document.createElement("button");
      dock.type = "button";
      dock.className = "gift-dock";
      dock.setAttribute("aria-haspopup", "dialog");
      dock.setAttribute("aria-expanded", "false");
      dock.innerHTML = `<span class="dock-stack" aria-hidden="true"></span><span class="dock-meta"><span class="dock-count"></span><span class="dock-total"></span></span>`;
      dock.addEventListener("click", () => (popOpen ? closePop() : openPop()));
      document.body.appendChild(dock);
    }
    const n = Cart.count();
    const show = n > 0 && page !== "cart";
    dock.classList.toggle("is-visible", show);
    dock.setAttribute("aria-label", `Your gifts: ${n} ${n === 1 ? "item" : "items"}. Open to edit`);
    dock.tabIndex = show ? 0 : -1;
    const boxes = Math.min(stackCount ?? n, 6);
    const rows = boxes <= 3 ? 1 : boxes <= 5 ? 2 : 3;
    const stack = dock.querySelector(".dock-stack");
    const draw = () => {
      stack.style.height = rows * (BOX_H + GAP) - GAP + "px";
      stack.innerHTML = SLOTS.slice(0, boxes)
        .map(([x, y]) => `<span class="mini-gift" style="left:${x * (BOX_W + GAP)}px;bottom:${y * (BOX_H + GAP)}px"><i></i></span>`).join("");
      document.documentElement.style.setProperty("--dock-h", dock.offsetHeight + "px");
    };
    // boxes that leave the stack lift off and fade before it redraws
    const extra = [...stack.children].slice(boxes);
    if (extra.length && gsap && !reduceMotion) {
      gsap.to(extra, { y: -16, opacity: 0, scale: 0.8, duration: 0.3, ease: "power2.in", stagger: 0.04, onComplete: draw });
    } else draw();
    dock.querySelector(".dock-count").textContent = `${n} ${n === 1 ? "gift" : "gifts"}`;
    dock.querySelector(".dock-total").textContent = money(Cart.totals().subtotal);
    if (!show && popOpen) closePop();
    return dock;
  }

  // ---------- small cart window that opens from the gift stack ----------
  let pop = null, popOpen = false;
  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "cart-pop";
    pop.hidden = true;
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Your gifts");
    pop.innerHTML = `
      <div class="pop-head"><h2>Your gifts</h2><button type="button" class="pop-close" aria-label="Close">${icon("x")}</button></div>
      <ul class="pop-lines" data-lenis-prevent></ul>
      <div class="pop-foot">
        <div class="pop-sum"><span>Subtotal</span><span data-pop-sub></span></div>
        <p class="pop-note" data-pop-note></p>
        <div class="pop-actions"><a class="btn btn-light" href="cart.html">Checkout</a><a class="btn-link" href="cart.html">View cart</a></div>
      </div>`;
    document.body.appendChild(pop);
    pop.querySelector(".pop-close").addEventListener("click", () => closePop());
    pop.addEventListener("click", (e) => {
      const step = e.target.closest("[data-pop-step]");
      const rm = e.target.closest("[data-pop-remove]");
      if (!step && !rm) return;
      const id = (step || rm).dataset.id;
      const line = Cart.read().find((i) => i.id === id);
      const qty = rm ? 0 : (line ? line.qty : 0) + Number(step.dataset.popStep);
      Cart.setQty(id, qty);
      if (rm || qty <= 0) announce(`${byId(id).name} removed from cart`);
      renderPop();
      renderDock();
    });
    return pop;
  }

  function renderPop() {
    const lines = Cart.lines();
    const list = pop.querySelector(".pop-lines");
    if (!lines.length) {
      list.innerHTML = `<li class="pop-empty">Your cart is empty</li>`;
      pop.querySelector(".pop-foot").hidden = true;
      return;
    }
    pop.querySelector(".pop-foot").hidden = false;
    list.innerHTML = lines.map((l) => `
      <li class="pop-line">
        <a class="pop-img" href="product.html?id=${encodeURIComponent(l.id)}" tabindex="-1" aria-hidden="true">${productImage(l.product)}</a>
        <div class="pop-info">
          <span class="pop-name">${esc(l.product.name)}</span>
          <span class="pop-price">${money(l.product.price)} each</span>
          <div class="pop-row">
            <span class="pop-step">
              <button type="button" data-pop-step="-1" data-id="${esc(l.id)}" aria-label="One fewer ${esc(l.product.name)}">${icon("minus", 14)}</button>
              <span>${l.qty}</span>
              <button type="button" data-pop-step="1" data-id="${esc(l.id)}" aria-label="One more ${esc(l.product.name)}">${icon("plus", 14)}</button>
            </span>
            <button type="button" class="pop-remove" data-pop-remove data-id="${esc(l.id)}">Remove</button>
          </div>
        </div>
        <span class="pop-total">${money(l.total)}</span>
      </li>`).join("");
    const t = Cart.totals();
    const gap = CFG.freeShippingOver - t.subtotal;
    pop.querySelector("[data-pop-sub]").textContent = money(t.subtotal);
    pop.querySelector("[data-pop-note]").textContent = gap > 0 ? `Add ${money(gap)} more for free delivery` : "Free delivery on this order";
  }

  function openPop() {
    ensurePop();
    renderPop();
    pop.hidden = false;
    popOpen = true;
    document.querySelector(".gift-dock")?.setAttribute("aria-expanded", "true");
    if (gsap && !reduceMotion) gsap.fromTo(pop, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: EASE });
    pop.querySelector(".pop-close").focus({ preventScroll: true });
  }

  function closePop() {
    if (!pop || !popOpen) return;
    popOpen = false;
    const dock = document.querySelector(".gift-dock");
    dock?.setAttribute("aria-expanded", "false");
    const done = () => { pop.hidden = true; };
    if (gsap && !reduceMotion) gsap.to(pop, { opacity: 0, y: 8, duration: 0.18, ease: "power1.in", onComplete: done });
    else done();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popOpen) { closePop(); document.querySelector(".gift-dock")?.focus(); }
  });
  document.addEventListener("pointerdown", (e) => {
    if (popOpen && !e.target.closest(".cart-pop") && !e.target.closest(".gift-dock")) closePop();
  });

  function slotRect(dock, index) {
    const stack = dock.querySelector(".dock-stack").getBoundingClientRect();
    const [x, y] = SLOTS[Math.min(index, 5)];
    return { left: stack.left + x * (BOX_W + GAP), top: stack.bottom - y * (BOX_H + GAP) - BOX_H };
  }

  function updateCounts() {
    const n = Cart.count();
    document.querySelectorAll("[data-cart-count]").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  }

  // Throws a small gift box from the button into the dock, then adds it to the stack.
  function addWithGift(id, qty, fromEl) {
    const before = Cart.count();
    const p = byId(id);
    const inCart = (Cart.read().find((i) => i.id === id) || {}).qty || 0;
    const room = maxQty(p) - inCart;
    if (room <= 0) { announce(`All ${maxQty(p)} ${p.name} candles are already in your cart`, true); return false; }
    if (qty > room) { qty = room; announce(`Only ${room} more ${p.name} left, added ${room}`, true); }
    else announce(`${p.name} added to cart`);

    Cart.add(id, qty);
    if (reduceMotion || !gsap || !fromEl || page === "cart") { renderDock(); return; }

    // dock shows the new count now; the new box joins the stack when the throw lands
    const dock = renderDock(before);
    const target = Math.min(before, 5);
    const rowsAfter = target < 3 ? 1 : target < 5 ? 2 : 3;
    dock.querySelector(".dock-stack").style.height = rowsAfter * (BOX_H + GAP) - GAP + "px";
    const a = fromEl.getBoundingClientRect();
    const t = slotRect(dock, before);
    const gift = document.createElement("span");
    gift.className = "mini-gift is-flying";
    gift.innerHTML = "<i></i>";
    const sx = a.left + a.width / 2 - BOX_W / 2, sy = a.top + a.height / 2 - BOX_H / 2;
    Object.assign(gift.style, { left: sx + "px", top: sy + "px" });
    document.body.appendChild(gift);

    const dx = t.left - sx, dy = t.top - sy;
    const lift = Math.min(160, Math.max(80, Math.abs(dx) * 0.25));
    gsap.timeline({
      onComplete() {
        gift.remove();
        renderDock();
        if (popOpen) renderPop();
        const boxes = dock.querySelectorAll(".mini-gift");
        const landed = boxes[Math.min(before, 5)];
        if (landed) gsap.fromTo(landed, { y: -6, scale: 1.08 }, { y: 0, scale: 1, duration: 0.35, ease: EASE });
        gsap.fromTo(dock, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: EASE });
      }
    })
      .fromTo(gift, { scale: 0.3, opacity: 0 }, { scale: 1.5, opacity: 1, duration: 0.22, ease: "power2.out" })
      .to(gift, { x: dx, duration: 0.85, ease: "power1.inOut" }, ">-0.04")
      .to(gift, { keyframes: { y: [0, -lift, dy], easeEach: "sine.inOut" }, duration: 0.85, ease: "none" }, "<")
      .to(gift, { keyframes: { rotation: [0, -14, 8, 0] }, duration: 0.85, ease: "none" }, "<")
      .to(gift, { scale: 1, duration: 0.85, ease: "power1.inOut" }, "<");
  }

  // Any element with data-add="product-id" adds that product. Quantity comes from a
  // [data-qty] input inside the same [data-buy] block, if there is one.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn || !btn.dataset.add) return;
    e.preventDefault();
    const scope = btn.closest("[data-buy]");
    const input = scope && scope.querySelector("[data-qty]");
    const qty = input ? Math.max(1, Math.min(20, parseInt(input.value, 10) || 1)) : 1;
    const ok = addWithGift(btn.dataset.add, qty, btn) !== false;
    if (ok && btn.classList.contains("btn") && !btn.dataset.busy) {
      btn.dataset.busy = "1";
      const before = btn.innerHTML;
      btn.style.minWidth = btn.offsetWidth + "px";
      btn.innerHTML = `${icon("check", 16)} Added`;
      setTimeout(() => {
        if (btn.textContent.trim() === "Added") btn.innerHTML = before;
        btn.style.minWidth = ""; delete btn.dataset.busy;
      }, 1400);
    }
  });

  // Quantity steppers: <button data-step="1"> next to an [data-qty] input.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const input = b.parentElement.querySelector("[data-qty]");
    const max = Math.max(1, parseInt(input.dataset.max, 10) || 20);
    input.value = Math.max(1, Math.min(max, (parseInt(input.value, 10) || 1) + Number(b.dataset.step)));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Screen-reader announcements
  // visible note for things people must see (stock limits); sits above the gift stack
  function notice(msg) {
    let n = document.getElementById("shop-notice");
    if (!n) { n = document.createElement("div"); n.id = "shop-notice"; n.className = "shop-notice theme-night"; document.body.appendChild(n); }
    n.textContent = msg; n.classList.add("is-on");
    clearTimeout(notice.t); notice.t = setTimeout(() => n.classList.remove("is-on"), 3200);
  }
  function announce(msg, visible) {
    if (visible) notice(msg);
    let live = document.getElementById("live-region");
    if (!live) {
      live = document.createElement("div");
      live.id = "live-region";
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = "";
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  // ---------- product card ----------
  function productCard(p) {
    const href = `product.html?id=${encodeURIComponent(p.id)}`;
    return `
      <article class="card" data-reveal>
        <a href="${href}" class="card-img" tabindex="-1" aria-hidden="true">${productImage(p)}</a>
        <div class="card-body">
          <p class="card-mood">${esc(window.AMOURE_MOODS[p.mood] || p.mood)}</p>
          <h3><a href="${href}">${esc(p.name)}</a></h3>
          <p class="card-notes">${esc(p.notes.top)}, ${esc(p.notes.heart)}, ${esc(p.notes.base)}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}${stockNote(p) ? `<small class="stock-note">${esc(stockNote(p))}</small>` : ""}</span>
            ${p.inStock
              ? `<button class="btn btn-sm btn-merlot" data-add="${esc(p.id)}">Add to cart</button>`
              : `<span class="muted">Sold out</span>`}
          </div>
        </div>
      </article>`;
  }

  // ---------- smooth scroll and reveals ----------
  let lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    if (gsap && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Same-page anchor links glide instead of jumping.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  function initReveals(root = document) {
    const els = [...root.querySelectorAll("[data-reveal]:not(.is-in)")];
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const siblings = [...en.target.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
        en.target.style.transitionDelay = Math.min(siblings.indexOf(en.target), 5) * 50 + "ms";
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  function fadeInImages(root = document) {
    root.querySelectorAll("img:not([data-faded])").forEach((img) => {
      img.dataset.faded = "1";
      if (img.complete && img.naturalWidth) return;
      img.classList.add("img-wait");
      const done = () => img.classList.remove("img-wait");
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) fadeInImages(n.tagName === "IMG" ? n.parentNode : n); })))
    .observe(document.documentElement, { childList: true, subtree: true });

  // Product data for search engines (read when the site is public)
  function structuredData() {
    if (!["home", "shop", "product"].includes(page)) return;
    const base = location.href.replace(/[^/]*$/, "");
    const offer = (p) => ({ "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" });
    const item = (p) => ({ "@type": "Product", name: `${p.name} scented candle`, description: p.description, image: base + p.image, brand: { "@type": "Brand", name: "AMOURÉ" }, offers: offer(p) });
    const id = page === "product" && new URLSearchParams(location.search).get("id");
    const one = id && byId(id);
    const data = one ? { "@context": "https://schema.org", ...item(one) }
      : { "@context": "https://schema.org", "@type": "ItemList", name: "AMOURÉ candles", itemListElement: PRODUCTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: item(p) })) };
    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  }

  // Seamless video loop: two copies of one clip. Before the front copy ends, the other starts from the top
  // and fades in over it, so the loop point is never seen (a plain <video loop> stalls or jumps on restart).
  function loopVideo(vids, src, { fade = 1.6, poster = "" } = {}) {
    let cur = 0, swapping = false, running = false;
    vids.forEach((v, i) => {
      // iPhone needs these as attributes to play silently in place; no picture-in-picture or AirPlay buttons
      ["muted", "playsinline", "webkit-playsinline", "disablepictureinpicture", "disableremoteplayback"].forEach((a) => v.setAttribute(a, ""));
      v.muted = true; v.loop = false; v.controls = false; v.src = src;
      if (i === 0) v.poster = poster; else v.style.opacity = 0;
    });
    const front = () => vids[cur];
    // If the phone refuses to autoplay (iPhone Low Power Mode does), the still poster stays on screen
    // (the play button is hidden in CSS) and the video starts on the visitor's first tap.
    let armed = false;
    const GESTURES = ["touchend", "click", "keydown"];
    function retryOnTap() {
      if (armed) return;
      armed = true;
      const go = () => {
        armed = false;
        GESTURES.forEach((t) => document.removeEventListener(t, go, true));
        if (running) safePlay(front());
      };
      GESTURES.forEach((t) => document.addEventListener(t, go, { capture: true, passive: true }));
    }
    const safePlay = (v) => { const p = v.play(); return p ? p.catch(() => retryOnTap()) : Promise.resolve(); };
    function swap() {
      if (swapping || vids.length < 2) { if (vids.length < 2) { vids[0].currentTime = 0; safePlay(vids[0]); } return; }
      swapping = true;
      const a = vids[cur], b = vids[1 - cur];
      b.style.transition = "none"; b.style.opacity = 0; b.style.zIndex = 2; a.style.zIndex = 1;
      b.currentTime = 0;
      safePlay(b).then(() => {
        void b.offsetWidth;
        b.style.transition = `opacity ${fade}s cubic-bezier(0.45, 0, 0.55, 1)`;
        b.style.opacity = 1;
        setTimeout(() => { a.pause(); a.style.opacity = 0; a.currentTime = 0; cur = 1 - cur; swapping = false; }, fade * 1000 + 80);
      });
    }
    function tick() {
      if (!running) return;
      const v = front();
      if (!swapping && v.duration && v.currentTime >= v.duration - fade - 0.25) swap();
      requestAnimationFrame(tick);
    }
    vids.forEach((v) => v.addEventListener("ended", () => { if (v === front()) swap(); }));
    return {
      play() {
        safePlay(front());
        if (swapping) safePlay(vids[1 - cur]);
        if (!running) { running = true; requestAnimationFrame(tick); }
      },
      pause() { running = false; vids.forEach((v) => v.pause()); },
      front
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    structuredData();
    fadeInImages();
    renderFooter();
    updateCounts();
    renderDock();
    initSmoothScroll();
    initReveals();
  });

  window.Amoure = {
    CFG, PRODUCTS, Cart, Auth, money, byId, esc, icon, productImage, productCard,
    announce, initReveals, reduceMotion, EASE, renderDock, renderHeader, loopVideo, maxQty, stockNote,
    get lenis() { return lenis; }
  };
})();
