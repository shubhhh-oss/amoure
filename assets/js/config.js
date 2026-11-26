// AMOURÉ shop settings. Change values here; the whole site updates.
window.AMOURE_CONFIG = {
  brand: "AMOURÉ",
  tagline: "Light your world. Love your moments",
  currency: "₹",

  // Home page opening video (a real candle). Replace the file with your own footage
  // (same name) or change the path. heroPoster is the still shown while it loads.
  heroVideo: "assets/video/hero.mp4",
  heroPoster: "assets/images/scenes/hero-poster.jpg",
  // Optional: a clip of the same candle being blown out (smoke rising). When set, it plays
  // as you scroll down, and the burning loop returns when you scroll back up.
  heroOutVideo: "",

  // Orders are sent to this WhatsApp number.
  // Format: country code + number, no "+", no spaces. Example: "919876543210"
  // Leave empty while testing: checkout will show the order text instead.
  whatsappNumber: "",

  shippingFee: 79,          // flat delivery charge in rupees
  freeShippingOver: 999,    // free delivery when subtotal reaches this

  paymentOptions: ["UPI (pay after we confirm)", "Cash on delivery"],

  instagram: "",            // e.g. "https://instagram.com/amoure"
  email: ""                 // e.g. "hello@amoure.in"
};
