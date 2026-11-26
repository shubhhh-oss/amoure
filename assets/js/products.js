// AMOURÉ product catalogue.
// Easiest way to edit: open admin.html (the product manager) in Chrome and connect this folder.
// You can still edit by hand. Fields:
//   id             link name (lowercase, dashes). Don't change it once the candle is live
//   mood           one of the keys in AMOURE_MOODS below
//   image          main photo; imagePosition keeps the candle in view ("50% 50%" = centre)
//   gallery        optional extra photos, shown as thumbnails on the product page
//   color          backdrop colour while the photo loads
//   stock          pieces left (optional). 0 = sold out. Leave it out to not count; then inStock decides
// Every save from the product manager keeps a copy of the previous file in assets/js/backups/.
window.AMOURE_PRODUCTS = [
  {
    "id": "premier-amour",
    "name": "Premier Amour",
    "meaning": "First love",
    "descriptor": "A soft and tender fragrance",
    "mood": "romance",
    "price": 899,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "Rose",
      "heart": "Amber",
      "base": "Vanilla"
    },
    "description": "A soft, warm rose for the evening that started everything.",
    "image": "assets/images/candles/premier-amour.jpg",
    "imagePosition": "50% 72%",
    "color": "#D4A0AA",
    "inStock": true
  },
  {
    "id": "coup-de-foudre",
    "name": "Coup de Foudre",
    "meaning": "Love at first sight",
    "descriptor": "A warm and daring fragrance",
    "mood": "romance",
    "price": 999,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "Pink pepper",
      "heart": "Oud",
      "base": "Musk"
    },
    "description": "Spiced and deep, the scent of a look that lasts a second too long.",
    "image": "assets/images/candles/coup-de-foudre.jpg",
    "imagePosition": "50% 58%",
    "color": "#642D42",
    "inStock": true
  },
  {
    "id": "rendez-vous",
    "name": "Rendez-vous",
    "meaning": "A date",
    "descriptor": "A woody and intimate fragrance",
    "mood": "romance",
    "price": 949,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "Fig",
      "heart": "Sandalwood",
      "base": "Cedar"
    },
    "description": "Fig and sandalwood for a quiet table set for two.",
    "image": "assets/images/candles/rendez-vous.jpg",
    "imagePosition": "62% 55%",
    "color": "#8A4A5C",
    "inStock": true
  },
  {
    "id": "nuit-dor",
    "name": "Nuit d'Or",
    "meaning": "Golden night",
    "descriptor": "A rich and golden fragrance",
    "mood": "gifting",
    "price": 1199,
    "size": "250 g",
    "burnTime": "50 hours",
    "notes": {
      "top": "Saffron",
      "heart": "Tonka",
      "base": "Amber"
    },
    "description": "Saffron and tonka in a jar made to be given.",
    "image": "assets/images/candles/nuit-dor.jpg",
    "imagePosition": "50% 46%",
    "color": "#EFD98E",
    "inStock": true
  },
  {
    "id": "doux-reve",
    "name": "Doux Rêve",
    "meaning": "Sweet dream",
    "descriptor": "A calm and gentle fragrance",
    "mood": "calm",
    "price": 849,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "Lavender",
      "heart": "Chamomile",
      "base": "Musk"
    },
    "description": "Lavender and soft musk for the last hour before sleep.",
    "image": "assets/images/candles/doux-reve.jpg",
    "imagePosition": "50% 62%",
    "color": "#E8D4D8",
    "inStock": true
  },
  {
    "id": "toujours",
    "name": "Toujours",
    "meaning": "Always",
    "descriptor": "A fresh and familiar fragrance",
    "mood": "calm",
    "price": 899,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "Jasmine",
      "heart": "Neroli",
      "base": "Cedar"
    },
    "description": "Jasmine and cedar, steady and familiar.",
    "image": "assets/images/candles/toujours.jpg",
    "imagePosition": "62% 72%",
    "color": "#FFF6DF",
    "inStock": true
  },
  {
    "id": "bella",
    "name": "bella",
    "meaning": "billu",
    "descriptor": "billu",
    "mood": "gifting",
    "price": 999,
    "size": "200 g",
    "burnTime": "40 hours",
    "notes": {
      "top": "",
      "heart": "",
      "base": ""
    },
    "description": "",
    "image": "assets/images/candles/bella.jpg?v=261126135046",
    "imagePosition": "80% 58%",
    "color": "#535353",
    "inStock": true
  }
];

window.AMOURE_MOODS = {
  "romance": "Romance",
  "calm": "Calm",
  "gifting": "Gifting"
};

// Taken out of the shop. Not shown on the site; restore them in the product manager.
window.AMOURE_ARCHIVED = [];
