/* Dolce Pizza — données du restaurant et de la carte (menu été 2026).
   Tout ce qui peut changer (coordonnées, horaires, prix) se modifie ici. */

const CONFIG = {
  name: "Dolce Pizza",
  address: "2 rue de Paris, 91400 Orsay",
  phoneDisplay: "01 64 46 33 00",
  phoneLink: "+33164463300",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dolce+Pizza+2+rue+de+Paris+91400+Orsay",

  // Horaires en minutes depuis minuit (heure de Paris)
  lunch: [11 * 60, 14 * 60 + 30],
  dinner: [18 * 60, 23 * 60],
  lunchClosedDays: [5, 0],      // vendredi (5) et dimanche (0) : fermé le midi
  // Livraison uniquement le soir.

  leadPickup: 20,               // délai de préparation à emporter (min) — à confirmer
  leadDelivery: 40,             // délai de livraison (min) — à confirmer
  deliveryMin: 0,               // minimum de commande en livraison (€) — à confirmer

  extraPrice: { junior: 1, senior: 2, familiale: 3 },

  // true = interface de paiement en démonstration (aucun encaissement réel, mention affichée au client)
  demo: true,

  // URL qui reçoit la commande en POST (JSON). Vide = le client valide par téléphone.
  orderEndpoint: ""
};

const SIZES = [
  { id: "junior", label: "Junior" },
  { id: "senior", label: "Senior" },
  { id: "familiale", label: "Familiale" }
];

/* prix : [junior, senior, familiale] — emp = à emporter, liv = en livraison */
const CATEGORIES = [
  {
    id: "classiques", title: "Les Classiques", en: "Classics", tone: "white",
    emp: [8.9, 11.9, 19.9], liv: [12.9, 15.9, 23.9],
    items: [
      { id: "margherita", name: "Margherita", desc: "Tomate, mozzarella, basilic frais", en: "Tomato, mozzarella, fresh basil" },
      { id: "regina", name: "Régina", desc: "Tomate, mozzarella, jambon, champignon", en: "Tomato, mozzarella, ham, mushroom" },
      { id: "campione", name: "Campione", desc: "Tomate, mozzarella, viande hachée, champignons", en: "Tomato, mozzarella, minced meat, mushrooms" },
      { id: "paysanne", name: "Paysanne", desc: "Tomate, mozzarella, jambon, œuf", en: "Tomato, mozzarella, ham, egg" },
      { id: "pepperona", name: "Pepperona", desc: "Tomate, mozzarella, pepperoni", en: "Tomato, mozzarella, pepperoni" },
      { id: "calzone", name: "Calzone", note: "soufflée", desc: "Tomate, mozzarella, jambon ou thon ou viande, œuf", en: "Tomato, mozzarella, ham or tuna or meat, egg (puffed)",
        choices: { label: "Garniture", options: ["Jambon", "Thon", "Viande"] } }
    ]
  },
  {
    id: "exclusives", title: "Les Exclusives", en: "Exclusives", tone: "sky",
    emp: [10.9, 13.9, 21.9], liv: [14.9, 17.9, 25.9],
    items: [
      { id: "vegetarienne", name: "Végétarienne", desc: "Tomate, mozzarella, aubergines, poivrons et courgettes marinés, champignons, artichauts, oignons, roquette", en: "Tomato, mozzarella, eggplants, bell peppers, zucchini, marinated mushrooms, artichokes, onions, arugula" },
      { id: "grada-padano", name: "Grada Padano", desc: "Tomate, mozzarella fraîche, tomates cerises, Grada Padano, basilic frais", en: "Tomato, fresh mozzarella, cherry tomatoes, Grada Padano, fresh basil" },
      { id: "italienne", name: "Italienne", desc: "Tomate, mozzarella, jambon, tomates cerises, aubergines marinées, copeaux de parmesan, roquette", en: "Tomato, mozzarella, ham, cherry tomatoes, marinated eggplants, parmesan shavings, arugula" },
      { id: "4-jambons", name: "4 Jambons", desc: "Tomate, mozzarella, jambon, pepperoni, salami, chorizo", en: "Tomato, mozzarella, ham, pepperoni, salami, chorizo" },
      { id: "4-saisons", name: "4 Saisons", desc: "Tomate, mozzarella, jambon, artichauts, champignons, olives, œuf", en: "Tomato, mozzarella, ham, artichokes, mushrooms, olives, egg" },
      { id: "boursin", name: "Boursin", desc: "Tomate, mozzarella, viande hachée, Boursin, pommes de terre, olives", en: "Tomato, mozzarella, minced meat, Boursin cheese, potatoes, olives" },
      { id: "fermiere", name: "Fermière", desc: "Crème, mozzarella, poulet, pommes de terre, œuf, tomates fraîches", en: "Cream, mozzarella, chicken, potatoes, egg, fresh tomatoes" },
      { id: "savoyarde", name: "Savoyarde", desc: "Crème, mozzarella, viande hachée, oignons, pomme de terre, reblochon", en: "Cream, mozzarella, minced meat, onions, potato, reblochon" },
      { id: "pizza-du-chef", name: "Pizza du Chef", desc: "Tomate, mozzarella, merguez, viande hachée, œuf", en: "Tomato, mozzarella, spicy sausage, minced meat, egg" },
      { id: "sicilienne", name: "Sicilienne", desc: "Tomate, mozzarella, viande hachée, aubergines marinées, chèvre, oignons", en: "Tomato, mozzarella, minced meat, marinated eggplants, goat cheese, onions" }
    ]
  },
  {
    id: "gourmets", title: "Les Gourmets", en: "Gourmet", tone: "white",
    emp: [9.9, 12.9, 20.9], liv: [13.9, 16.9, 24.9],
    items: [
      { id: "caprese", name: "Caprese", desc: "Tomate, mozzarella, mozzarella fraîche, tomates fraîches, olives, basilic frais", en: "Tomato, mozzarella, fresh mozzarella, fresh tomatoes, olives, fresh basil" },
      { id: "capri", name: "Capri", desc: "Tomate, mozzarella, thon, poivrons, olives", en: "Tomato, mozzarella, tuna, bell peppers, olives" },
      { id: "a-la-rucola", name: "A la Rucola", desc: "Tomate, mozzarella, parmesan, tomates cerises, roquette", en: "Tomato, mozzarella, Parmesan, cherry tomatoes, arugula" },
      { id: "4-fromages", name: "4 Fromages", desc: "Tomate, mozzarella, chèvre, gorgonzola, taleggio, parmesan", en: "Tomato, mozzarella, goat cheese, gorgonzola, taleggio, Parmesan" },
      { id: "san-pietro", name: "San Pietro", desc: "Tomate, mozzarella, viande hachée, oignons, œuf", en: "Tomato, mozzarella, minced meat, onions, egg" },
      { id: "napolitaine", name: "Napolitaine", desc: "Tomate, mozzarella, anchois, câpres", en: "Tomato, mozzarella, anchovies, capers" },
      { id: "orientale", name: "Orientale", desc: "Tomate, mozzarella, merguez, poivrons, œuf, oignons", en: "Tomato, mozzarella, spicy sausage, bell peppers, egg, onions" },
      { id: "san-marco", name: "San Marco", desc: "Crème, mozzarella, viande hachée, tomates fraîches, chèvre", en: "Cream, mozzarella, minced meat, fresh tomatoes, goat cheese" },
      { id: "raclette", name: "Raclette", desc: "Crème, mozzarella, viande hachée, raclette, pommes de terre", en: "Cream, mozzarella, minced meat, raclette cheese, potatoes" },
      { id: "tartiflette", name: "Tartiflette", desc: "Crème, mozzarella, jambon, reblochon, pommes de terre", en: "Cream, mozzarella, ham, reblochon, potatoes" },
      { id: "fromaggi", name: "Fromaggi", desc: "Crème, mozzarella, chèvre, gorgonzola, taleggio, parmesan", en: "Cream, mozzarella, goat cheese, gorgonzola, taleggio, Parmesan" },
      { id: "chevre-miel", name: "Chèvre Miel", desc: "Crème, mozzarella, chèvre, miel", en: "Cream, mozzarella, goat cheese, honey" },
      { id: "rimini", name: "Rimini", desc: "Crème, mozzarella, poulet, champignons", en: "Cream, mozzarella, chicken, mushrooms" },
      { id: "poulette", name: "Poulette", desc: "Tomate, mozzarella, poulet, poivrons, oignons", en: "Tomato, mozzarella, chicken, peppers, onions" }
    ]
  },
  {
    id: "supremes", title: "Les Suprêmes", en: "Supreme", tone: "sky",
    emp: [10.9, 14.9, 22.9], liv: [14.9, 18.9, 26.9],
    items: [
      { id: "5-fromages", name: "5 Fromages", desc: "Tomate, mozzarella, chèvre, gorgonzola, taleggio, scamorza", en: "Tomato, mozzarella, goat cheese, gorgonzola, taleggio, scamorza" },
      { id: "5-saisons", name: "5 Saisons", desc: "Tomate, mozzarella, jambon, aubergines, courgettes et poivrons marinés, champignons, artichauts", en: "Tomato, mozzarella, ham, eggplants, zucchini, marinated bell peppers, mushrooms, artichokes" },
      { id: "buratta", name: "Buratta", desc: "Tomate, mozzarella, burrata, pepperoni, roquette, tomates cerise", en: "Tomato, mozzarella, burrata, pepperoni, arugula, cherry tomatoes" },
      { id: "venezia", name: "Venezia", desc: "Crème, mozzarella, saumon fumé, citron", en: "Cream, mozzarella, smoked salmon, lemon" },
      { id: "extravaganza", name: "Extravaganza", desc: "Tomate, mozzarella, peppéroni, jambon, champignons, oignons, poivrons, viande hachée", en: "Tomato, mozzarella, pepperoni, ham, mushrooms, onions, bell peppers, minced meat" }
    ]
  }
];

const FORMULE = { id: "formule-midi", name: "Formule Midi", price: 9.9 };

const EXTRAS = [
  { id: "boisson-33", name: "Boisson 33 cl", en: "Cold drink", price: 1.5 },
  { id: "boisson-125", name: "Boisson 1,25 l", en: "Cold drink", price: 3 },
  { id: "dessert", name: "Dessert", en: "Available desserts", price: 3.5, hint: "Selon disponibilité" }
];

/* Ingrédients proposés en supplément (repris de la carte) — liste à valider */
const INGREDIENTS = [
  "Mozzarella", "Mozzarella fraîche", "Burrata", "Chèvre", "Gorgonzola", "Taleggio", "Parmesan", "Scamorza", "Raclette", "Reblochon", "Boursin",
  "Jambon", "Pepperoni", "Salami", "Chorizo", "Merguez", "Viande hachée", "Poulet", "Thon", "Saumon fumé", "Anchois", "Œuf",
  "Champignons", "Oignons", "Poivrons", "Aubergines marinées", "Courgettes marinées", "Artichauts", "Olives", "Câpres",
  "Tomates fraîches", "Tomates cerises", "Pommes de terre", "Roquette", "Basilic frais", "Miel"
];
