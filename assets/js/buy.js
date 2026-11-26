// The buy block: a large photo of the candle with its details and Add to cart.
// Used on the home page (after the tray) and on each product page.
(function () {
  const { PRODUCTS, money, esc, icon, productImage, byId, reduceMotion, EASE, maxQty, stockNote } = window.Amoure;
  const gsap = window.gsap;

  function mount(root, startId, { onSelect } = {}) {
    root.innerHTML = `
      <div class="buy-grid">
        <div class="buy-media">
          <div class="arch arch-lg" data-box-img></div>
          <span class="buy-seal" aria-hidden="true"><span>A</span></span>
          <div class="buy-thumbs" data-thumbs role="group" aria-label="More photos"></div>
        </div>

        <div class="buy-panel" data-buy>
          <p class="label">The candle</p>
          <h2 class="buy-name" data-f="name"></h2>
          <p class="buy-meaning" data-f="meaning"></p>
          <p class="buy-price" data-f="price"></p>
          <p class="buy-desc" data-f="description"></p>
          <dl class="notes">
            <div><dt>Top</dt><dd data-f="top"></dd></div>
            <div><dt>Heart</dt><dd data-f="heart"></dd></div>
            <div><dt>Base</dt><dd data-f="base"></dd></div>
          </dl>
          <p class="buy-meta" data-f="meta"></p>
          <p class="buy-stock" data-f="stock" aria-live="polite"></p>
          <div class="buy-row">
            <div class="stepper">
              <button type="button" data-step="-1" aria-label="Fewer">${icon("minus", 16)}</button>
              <input data-qty value="1" inputmode="numeric" aria-label="Quantity">
              <button type="button" data-step="1" aria-label="More">${icon("plus", 16)}</button>
            </div>
            <button class="btn btn-merlot btn-lg" data-add="">Add to cart</button>
          </div>
          <div class="swatches" role="group" aria-label="Choose a candle">
            ${PRODUCTS.map((p) => `
              <button type="button" class="swatch" data-pick="${esc(p.id)}" aria-label="${esc(p.name)}" aria-pressed="false">
                ${productImage(p)}
              </button>`).join("")}
          </div>
        </div>
      </div>`;

    const fields = (name) => root.querySelectorAll(`[data-f="${name}"]`);
    const setText = (name, value) => fields(name).forEach((el) => { el.textContent = value; });
    const imgBox = root.querySelector("[data-box-img]");
    const addBtn = root.querySelector("[data-add]");
    const thumbs = root.querySelector("[data-thumbs]");
    let current = null;

    // show one photo in the arch, crossfading from the last one
    function showPhoto(html, animate) {
      const next = document.createElement("div");
      next.className = "arch-photo";
      next.innerHTML = html;
      imgBox.appendChild(next);
      const old = [...imgBox.children].slice(0, -1);
      if (gsap && !reduceMotion && animate) {
        gsap.fromTo(next, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE });
        gsap.to(old, { opacity: 0, duration: 0.4, onComplete: () => old.forEach((o) => o.remove()) });
      } else old.forEach((o) => o.remove());
    }
    // a candle can have extra photos (field "gallery"); they appear as small thumbnails under the arch
    function renderThumbs(p) {
      const extra = (p.gallery || []).filter(Boolean);
      if (!p.image || !extra.length) { thumbs.innerHTML = ""; thumbs.hidden = true; return; }
      thumbs.hidden = false;
      const all = [{ src: p.image, pos: p.imagePosition }, ...extra.map((src) => ({ src, pos: "50% 50%" }))];
      thumbs.innerHTML = all.map((ph, i) => `
        <button type="button" class="buy-thumb" data-photo="${i}" aria-label="Photo ${i + 1} of ${all.length}" aria-pressed="${i === 0}">
          <img src="${esc(ph.src)}" alt="" style="object-position:${esc(ph.pos || "50% 50%")}" loading="lazy">
        </button>`).join("");
      thumbs.onclick = (e) => {
        const b = e.target.closest("[data-photo]");
        if (!b || b.getAttribute("aria-pressed") === "true") return;
        const ph = all[Number(b.dataset.photo)];
        thumbs.querySelectorAll("[data-photo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        showPhoto(`<img src="${esc(ph.src)}" alt="${esc(p.name)} candle" style="object-position:${esc(ph.pos || "50% 50%")}" decoding="async" draggable="false">`, true);
      };
    }

    function set(id, { silent = false } = {}) {
      const p = byId(id) || PRODUCTS[0];
      if (current === p.id) return;
      const first = current === null;
      current = p.id;

      setText("name", p.name);
      setText("meaning", p.meaning);
      setText("descriptor", p.descriptor || "");
      setText("description", p.description);
      setText("size", p.size);
      setText("top", p.notes.top);
      setText("heart", p.notes.heart);
      setText("base", p.notes.base);
      setText("meta", `${p.size} · about ${p.burnTime} burn time`);
      addBtn.dataset.add = p.inStock ? p.id : "";
      addBtn.disabled = !p.inStock;
      addBtn.textContent = p.inStock ? "Add to cart" : "Sold out";
      setText("stock", stockNote(p));
      const qtyInput = root.querySelector("[data-qty]");
      qtyInput.dataset.max = Math.max(1, maxQty(p));
      if (Number(qtyInput.value) > Number(qtyInput.dataset.max)) qtyInput.value = qtyInput.dataset.max;
      root.querySelectorAll("[data-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === p.id)));

      // price counts from the old figure to the new one
      const priceEl = fields("price")[0];
      const from = Number(priceEl.dataset.value || p.price);
      priceEl.dataset.value = p.price;
      if (gsap && !reduceMotion && !first) {
        const o = { v: from };
        gsap.to(o, { v: p.price, duration: 0.5, ease: EASE, onUpdate: () => { priceEl.textContent = money(o.v); } });
      } else priceEl.textContent = money(p.price);

      // candle inside the box crossfades
      showPhoto(productImage(p), !first);
      renderThumbs(p);

      if (!silent && onSelect) onSelect(p.id);
    }

    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pick]");
      if (b) set(b.dataset.pick);
    });

    set(startId || PRODUCTS[0].id, { silent: true });
    return {
      set,
      get current() { return current; },
      media: root.querySelector(".buy-media"),
      candle: imgBox
    };
  }

  window.AmoureBuy = { mount };
})();
