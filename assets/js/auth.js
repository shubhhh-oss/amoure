// AMOURÉ accounts: sign up, sign in, sign out, saved orders.
// Version 1 keeps accounts in this browser only (localStorage), so it costs nothing
// and needs no server. Passwords are never stored, only a salted SHA-256 hash.
// To share accounts across devices later, swap these functions for Firebase Auth
// (free Spark plan) and keep the same names: current, signUp, signIn, signOut.
(function () {
  const USERS = "amoure_users_v1";
  const SESSION = "amoure_session_v1";
  const ORDERS = "amoure_orders_v1";

  const read = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const norm = (e) => String(e || "").trim().toLowerCase();
  const publicUser = (u) => u && { name: u.name, email: u.email, phone: u.phone || "", created: u.created };

  function randomSalt() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hash(password, salt) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + password));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback when the page is opened as a file (no secure context). Use Start AMOURE.command instead.
    let h = 2166136261;
    for (const c of salt + ":" + password) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return "f" + (h >>> 0).toString(16);
  }

  const Auth = {
    current() {
      const s = read(SESSION, null);
      const users = read(USERS, {});
      return s && users[s.email] ? publicUser(users[s.email]) : null;
    },

    async signUp({ name, email, phone, password }) {
      const e = norm(email);
      name = String(name || "").trim();
      if (!name) throw new Error("Enter your name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Enter a valid email");
      if (String(password || "").length < 8) throw new Error("Use at least 8 characters for the password");
      const users = read(USERS, {});
      if (users[e]) throw new Error("An account with this email already exists. Sign in instead");
      const salt = randomSalt();
      users[e] = { name, email: e, phone: String(phone || "").trim(), salt, hash: await hash(password, salt), created: new Date().toISOString() };
      write(USERS, users);
      write(SESSION, { email: e });
      return publicUser(users[e]);
    },

    async signIn({ email, password }) {
      const e = norm(email);
      const u = read(USERS, {})[e];
      if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error("Email or password is incorrect");
      write(SESSION, { email: e });
      return publicUser(u);
    },

    signOut() { localStorage.removeItem(SESSION); },

    saveOrder(order) {
      const u = Auth.current();
      if (!u) return;
      const all = read(ORDERS, {});
      (all[u.email] = all[u.email] || []).unshift({ ...order, placed: new Date().toISOString() });
      write(ORDERS, all);
    },

    orders() {
      const u = Auth.current();
      return u ? read(ORDERS, {})[u.email] || [] : [];
    }
  };

  window.AmoureAuth = Auth;
})();
