// Sign in / Sign up: the candle on the left brightens as the card is filled in,
// and a wax "A" seal stamps the card when you are through.
(function () {
  const { CFG, reduceMotion, loopVideo } = window.Amoure;
  const gsap = window.gsap;
  const page = document.querySelector(".auth");
  const form = page.querySelector("form");
  const card = page.querySelector("[data-card]");
  const seal = page.querySelector("[data-seal]");
  const err = page.querySelector("[data-err]");
  const mode = form.dataset.auth; // "signin" | "signup"

  const next = new URLSearchParams(location.search).get("next");
  const safeNext = next && /^[a-z]+\.html$/.test(next) ? next : "account.html";
  const swapLink = page.querySelector("[data-swap]");
  if (next && swapLink) swapLink.href = `${swapLink.getAttribute("href")}?next=${encodeURIComponent(safeNext)}`;
  if (window.AmoureAuth.current()) { location.replace(safeNext); return; }

  // the candle
  const vids = [...page.querySelectorAll("[data-auth-video]")];
  const poster = CFG.heroPoster || "";
  if (reduceMotion || !CFG.heroVideo) vids.forEach((v) => { v.poster = poster; v.removeAttribute("autoplay"); });
  else loopVideo(vids, CFG.heroVideo, { poster }).play();

  // a greeting for the hour
  const hello = page.querySelector("[data-hello]");
  if (hello && mode === "signin") {
    const h = new Date().getHours();
    hello.textContent = h < 5 ? "Still awake" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  // light follows the card: each filled field turns the flame up a little
  const required = [...form.querySelectorAll("input[required]")];
  function setLight() {
    const done = required.filter((i) => i.value.trim() && i.checkValidity()).length;
    page.style.setProperty("--light", (0.28 + 0.72 * (done / required.length)).toFixed(3));
  }
  form.addEventListener("input", setLight);
  setLight();

  // show / hide password
  const EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.97 0 8.5 3.6 9.94 6.65a1 1 0 0 1 0 .7 13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.5 15.4 7.03 19 12 19a9.74 9.74 0 0 0 5.39-1.61"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="m2 2 20 20"/></svg>';
  page.querySelectorAll("[data-eye]").forEach((b) => {
    const input = b.parentElement.querySelector("input");
    b.innerHTML = EYE;
    b.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      b.innerHTML = show ? EYE_OFF : EYE;
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
      b.setAttribute("aria-pressed", String(show));
      input.focus();
    });
  });

  // sign up: a wick that burns along as the password grows
  const wick = page.querySelector("[data-wick]");
  if (wick) {
    const pw = form.querySelector('input[name="password"]');
    const note = page.querySelector("[data-wick-note]");
    const update = () => {
      const n = pw.value.length;
      wick.style.setProperty("--w", Math.min(1, n / 8));
      wick.classList.toggle("is-ok", n >= 8);
      note.textContent = n === 0 ? "At least 8 characters" : n < 8 ? `${8 - n} more character${8 - n === 1 ? "" : "s"}` : "Good to go";
    };
    pw.addEventListener("input", update);
  }

  function seal_(name) {
    page.style.setProperty("--light", 1);
    card.classList.add("is-sealed");
    const first = (name || "").trim().split(" ")[0];
    page.querySelector("[data-done-name]").textContent = first ? (mode === "signin" ? `Welcome back, ${first}` : `Welcome, ${first}`) : "Welcome";
    if (!gsap || reduceMotion) { setTimeout(() => (location.href = safeNext), 700); return; }
    gsap.timeline({ onComplete: () => setTimeout(() => (location.href = safeNext), 650) })
      .to(card.querySelectorAll("[data-fill]"), { opacity: 0, y: -8, duration: 0.4, ease: "power2.in", stagger: 0.03 }, 0)
      .fromTo(seal, { scale: 1.9, opacity: 0, rotate: -14 }, { scale: 0.92, opacity: 1, rotate: -4, duration: 0.42, ease: "power3.in" }, 0.25)
      .to(seal, { scale: 1, rotate: -6, duration: 0.5, ease: "elastic.out(1, 0.5)" })
      .fromTo(card, { y: 0 }, { y: 3, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.67)
      .fromTo(page.querySelector("[data-done]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.8);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    if (!form.checkValidity()) {
      const bad = form.querySelector(":invalid");
      err.textContent = `Please check: ${bad.closest("label").querySelector("span").textContent.trim()}`;
      err.hidden = false;
      bad.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      const user = mode === "signin" ? await window.AmoureAuth.signIn(data) : await window.AmoureAuth.signUp(data);
      seal_(user && user.name);
    } catch (ex) {
      btn.disabled = false;
      err.textContent = ex.message;
      err.hidden = false;
      if (gsap && !reduceMotion) gsap.timeline().to(card, { x: -6, duration: 0.07 }).to(card, { x: 5, duration: 0.09 }).to(card, { x: -3, duration: 0.08 }).to(card, { x: 0, duration: 0.12, ease: "power2.out" });
    }
  });
})();
