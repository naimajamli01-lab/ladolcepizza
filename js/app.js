/* Dolce Pizza — carte, panier et commande */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const euro = n => n.toFixed(2).replace(".", ",") + " €";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

  const PIZZAS = {};
  CATEGORIES.forEach(c => c.items.forEach(p => { PIZZAS[p.id] = { ...p, cat: c }; }));
  const EXTRA_BY_ID = Object.fromEntries(EXTRAS.map(e => [e.id, e]));
  const sizeLabel = id => SIZES.find(s => s.id === id).label;
  const sizeIdx = id => SIZES.findIndex(s => s.id === id);

  /* ---------- État ---------- */
  const STORE = "dolcepizza-cart-v1";
  const state = { mode: "emp", cart: [], view: "cart", form: { name: "", phone: "", address: "", slot: "", note: "" }, pay: "card", done: null };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.cart)) {
      state.mode = saved.mode === "liv" ? "liv" : "emp";
      state.cart = saved.cart.filter(l => l && (PIZZAS[l.id] || EXTRA_BY_ID[l.id] || l.id === FORMULE.id) && (!l.pizza || PIZZAS[l.pizza]));
    }
  } catch (e) { /* stockage indisponible : panier en mémoire seulement */ }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ mode: state.mode, cart: state.cart })); } catch (e) {} };

  /* ---------- Prix ---------- */
  const pizzaPrice = (id, size, mode = state.mode) => PIZZAS[id].cat[mode][sizeIdx(size)];
  function unitPrice(l) {
    if (PIZZAS[l.id]) return pizzaPrice(l.id, l.size) + (l.extras || 0) * CONFIG.extraPrice[l.size];
    if (l.id === FORMULE.id) return FORMULE.price;
    return EXTRA_BY_ID[l.id].price;
  }
  const total = () => state.cart.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
  const count = () => state.cart.reduce((s, l) => s + l.qty, 0);
  const hasFormule = () => state.cart.some(l => l.id === FORMULE.id);

  function lineName(l) {
    if (PIZZAS[l.id]) return PIZZAS[l.id].name + " · " + sizeLabel(l.size);
    if (l.id === FORMULE.id) return FORMULE.name;
    return EXTRA_BY_ID[l.id].name;
  }
  function lineDetail(l) {
    const d = [];
    if (l.id === FORMULE.id) d.push("Pizza Junior " + PIZZAS[l.pizza].name + " + boisson 33 cl");
    if (l.choice) d.push(l.choice);
    if (l.extras) d.push("En plus : " + l.extrasNote);
    return d.join(" — ");
  }

  /* ---------- Horaires (heure de Paris) ---------- */
  function parisNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), min: +g("hour") * 60 + +g("minute") };
  }
  function windows(day, mode) {
    const w = [];
    if (mode !== "liv" && !CONFIG.lunchClosedDays.includes(day)) w.push(CONFIG.lunch);
    w.push(CONFIG.dinner);
    return w;
  }
  function slots(mode) {
    const { day, min } = parisNow();
    const lead = mode === "liv" ? CONFIG.leadDelivery : CONFIG.leadPickup;
    const out = [];
    windows(day, mode).forEach(([a, b]) => {
      const openNow = min >= a && min <= b;
      let t = Math.ceil((Math.max(a, min) + lead) / 15) * 15;
      for (let first = true; t <= b; t += 15, first = false) out.push({ t, asap: openNow && first });
    });
    return out;
  }
  function renderStatus() {
    const { day, min } = parisNow();
    const el = $("[data-status]");
    const all = windows(day, "emp");
    const cur = all.find(([a, b]) => min >= a && min < b);
    const next = all.find(([a]) => min < a);
    el.className = "status " + (cur ? "is-open" : "is-closed");
    el.textContent = cur ? "Ouvert — jusqu'à " + hhmm(cur[1]).replace(":", "h")
      : next ? "Fermé — ouvre à " + hhmm(next[0]).replace(":", "h")
      : "Fermé — à demain";
    $$(".hours tr").forEach(tr => tr.classList.toggle("today", +tr.dataset.day === day));
  }

  /* ---------- Carte ---------- */
  function renderMenu() {
    $("[data-chips]").innerHTML = CATEGORIES.map(c => `<a href="#${c.id}">${esc(c.title.replace("Les ", ""))}</a>`).join("") + `<a href="#formule">Formule &amp; boissons</a>`;
    $("[data-menu]").innerHTML = CATEGORIES.map(c => {
      const p = c[state.mode];
      return `<section class="section ${c.tone === "sky" ? "sky scallop" : ""}" id="${c.id}">
        <div class="wrap">
          <div class="sec-head">
            ${c.tone === "sky" ? '<img class="sec-lemon" src="images/citron-feuilles.svg" alt="" width="68" height="73" loading="lazy">' : ""}
            <h2 class="h-display">${esc(c.title)}</h2>
            <p class="sub">${esc(c.en)}</p>
            <p class="prices">${SIZES.map((s, i) => `<span>${s.label} <b class="price-tag">${euro(p[i])}</b></span>`).join("")}</p>
          </div>
          <div class="grid">${c.items.map(it => `
            <button class="card" type="button" data-pizza="${it.id}" aria-label="${esc(it.name)}, dès ${euro(p[0])} — choisir">
              <img class="card-photo" src="images/pizzas/${it.id}.jpg" alt="" loading="lazy" onerror="this.remove()">
              <span class="card-name">${esc(it.name)}${it.note ? ` <small>(${esc(it.note)})</small>` : ""}</span>
              <span class="card-side"><span class="card-price">dès <b>${euro(p[0])}</b></span><span class="plus" aria-hidden="true">+</span></span>
              <span class="card-desc">${esc(it.desc)}</span>
              <span class="card-en">${esc(it.en)}</span>
            </button>`).join("")}
          </div>
        </div>
      </section>`;
    }).join("");
    $("[data-extras]").innerHTML = EXTRAS.map(e => `
      <li><span><span class="x-name">${esc(e.name)}</span> <span class="x-en">${esc(e.hint || e.en)}</span></span>
        <span class="x-price">${euro(e.price)}</span>
        <button class="plus" type="button" data-extra="${e.id}" aria-label="Ajouter ${esc(e.name)}">+</button></li>`).join("");
    $$("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
    $("[data-mode-note]").textContent = state.mode === "liv"
      ? "Prix en livraison — livraison uniquement le soir, de 18h00 à 23h00."
      : "Prix à emporter — à retirer au 2 rue de Paris, Orsay.";
    reveal();
  }

  /* ---------- Apparition au défilement ---------- */
  document.documentElement.classList.add("js-anim");
  let firstReveal = true;
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add("in"); io.unobserve(el);
    setTimeout(() => { el.style.transitionDelay = ""; el.classList.add("shown"); }, 900);
  }), { rootMargin: "0px 0px -6% 0px" }) : null;
  function reveal() {
    $$(".sec-head, .card, .formule, .extras, .infos > div").forEach((el, i) => {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      if (!io || !firstReveal) { el.classList.add("in", "shown"); return; }
      if (el.classList.contains("card")) el.style.transitionDelay = (i % 3) * 80 + "ms";
      io.observe(el);
    });
    firstReveal = false;
  }
  function bump(el) {
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }

  function setMode(mode) {
    if (mode === state.mode) return;
    state.mode = mode;
    if (mode === "liv" && hasFormule()) {
      state.cart = state.cart.filter(l => l.id !== FORMULE.id);
      toast("La formule midi est à emporter uniquement : elle a été retirée du panier.");
    }
    state.form.slot = "";
    save(); renderMenu(); renderBadges();
    if (cartDlg.open) renderCart();
  }

  /* ---------- Panier ---------- */
  function addLine(line) {
    const key = JSON.stringify([line.id, line.size, line.choice, line.extras, line.extrasNote, line.pizza]);
    const found = state.cart.find(l => l.key === key);
    if (found) found.qty += line.qty; else state.cart.push({ ...line, key });
    save(); renderBadges();
    bump($("[data-cart-count]"));
    $$("[data-open-cart]").forEach(b => b.classList.add("attn"));   // clignote jusqu'à l'ouverture du panier
    toast("Ajouté au panier : " + lineName(line));
  }
  function renderBadges() {
    const n = count();
    const badge = $("[data-cart-count]");
    badge.textContent = n; badge.hidden = n === 0;
    const fl = $(".floatcart");
    fl.hidden = n === 0;
    if (n === 0) $$("[data-open-cart]").forEach(b => b.classList.remove("attn"));
    $("[data-float-total]").textContent = euro(total());
  }
  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Fiche produit ---------- */
  const prodDlg = $("[data-product]");
  let draft = null;

  function openPizza(id) {
    const p = PIZZAS[id];
    draft = { id, size: "senior", choice: p.choices ? p.choices.options[0] : "", extras: 0, extrasNote: "", qty: 1 };
    prodDlg.innerHTML = `<form class="dlg" method="dialog" data-pform>
      <img class="sheet-photo" src="images/pizzas/${id}.jpg" alt="Pizza ${esc(p.name)}" onerror="this.remove()">
      <div class="dlg-head"><div style="flex:1"><h2 id="p-title">${esc(p.name)}</h2><p>${esc(p.desc)}</p></div>
        <button class="x" type="button" data-close aria-label="Fermer">×</button></div>
      <div class="dlg-body">
        <fieldset class="field"><legend>Taille</legend><div class="opts">
          ${SIZES.map(s => `<label class="opt"><input type="radio" name="size" value="${s.id}" ${s.id === draft.size ? "checked" : ""}><span>${s.label}</span><span>${euro(pizzaPrice(id, s.id))}</span></label>`).join("")}
        </div></fieldset>
        ${p.choices ? `<fieldset class="field"><legend>${esc(p.choices.label)}</legend><div class="opts row">
          ${p.choices.options.map((o, i) => `<label class="opt"><input type="radio" name="choice" value="${esc(o)}" ${i === 0 ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}
        </div></fieldset>` : ""}
        <fieldset class="field"><legend>Ingrédients en plus <span data-xprice></span></legend><div class="opts checks">
          ${INGREDIENTS.map(n => `<label class="opt"><input type="checkbox" name="extra" value="${esc(n)}"><span>${esc(n)}</span></label>`).join("")}
        </div></fieldset>
        <div class="field rowline"><span class="lbl" style="margin:0">Quantité</span>
          <span class="stepper"><button type="button" data-step="qty" data-d="-1" aria-label="Moins">−</button><output data-out="qty">1</output><button type="button" data-step="qty" data-d="1" aria-label="Plus">+</button></span></div>
      </div>
      <div class="dlg-foot"><button class="btn btn-red btn-block" type="submit" data-add></button></div>
    </form>`;
    updateDraft();
    prodDlg.showModal();
  }

  function openFormule() {
    if (state.mode === "liv") { toast("La formule midi est disponible à emporter, le midi."); return; }
    draft = { id: FORMULE.id, pizza: CATEGORIES[0].items[0].id, choice: "", qty: 1 };
    prodDlg.innerHTML = `<form class="dlg" method="dialog" data-pform>
      <div class="dlg-head"><div style="flex:1"><h2 id="p-title">Formule Midi</h2><p>Pizza Junior + boisson 33 cl — ${euro(FORMULE.price)}</p></div>
        <button class="x" type="button" data-close aria-label="Fermer">×</button></div>
      <div class="dlg-body">
        <div class="field"><label for="f-pizza">Votre pizza</label>
          <select id="f-pizza" name="pizza">${CATEGORIES.map(c => `<optgroup label="${esc(c.title)}">${c.items.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</optgroup>`).join("")}</select>
          <p class="hint" data-fdesc></p></div>
        <div class="field rowline"><span class="lbl" style="margin:0">Quantité</span>
          <span class="stepper"><button type="button" data-step="qty" data-d="-1" aria-label="Moins">−</button><output data-out="qty">1</output><button type="button" data-step="qty" data-d="1" aria-label="Plus">+</button></span></div>
        <p class="hint">Précisez votre boisson dans le commentaire de la commande.</p>
      </div>
      <div class="dlg-foot"><button class="btn btn-red btn-block" type="submit" data-add></button></div>
    </form>`;
    updateDraft();
    prodDlg.showModal();
  }

  function updateDraft() {
    const f = $("[data-pform]", prodDlg);
    if (f.size) draft.size = f.size.value;
    if (f.choice) draft.choice = f.choice.value;
    if (f.pizza) { draft.pizza = f.pizza.value; $("[data-fdesc]", f).textContent = PIZZAS[draft.pizza].desc; }
    if ($("[data-xprice]", f)) {
      const xs = $$('input[name="extra"]:checked', f);
      draft.extras = xs.length;
      draft.extrasNote = xs.map(i => i.value).join(", ");
      $("[data-xprice]", f).textContent = "(+ " + euro(CONFIG.extraPrice[draft.size]) + " l'un)";
    }
    $('[data-out="qty"]', f).textContent = draft.qty;
    $("[data-add]", f).textContent = "Ajouter · " + euro(unitPrice(draft) * draft.qty);
  }

  prodDlg.addEventListener("click", e => {
    if (e.target === prodDlg || e.target.closest("[data-close]")) return prodDlg.close();
    const st = e.target.closest("[data-step]");
    if (st) {
      const k = st.dataset.step, d = +st.dataset.d;
      draft[k] = Math.min(k === "extras" ? 5 : 20, Math.max(k === "extras" ? 0 : 1, draft[k] + d));
      updateDraft();
    }
  });
  prodDlg.addEventListener("input", updateDraft);
  prodDlg.addEventListener("submit", () => { updateDraft(); addLine(draft); });

  /* ---------- Panier / commande ---------- */
  const cartDlg = $("[data-cart]");

  function head(title, sub) {
    return `<div class="dlg-head"><div style="flex:1"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
      <button class="x" type="button" data-close aria-label="Fermer">×</button></div>`;
  }
  const modeSwitch = () => `<div class="mode" role="group" aria-label="Mode de commande" style="margin-bottom:8px">
      <button type="button" data-mode="emp" aria-pressed="${state.mode === "emp"}">À emporter</button>
      <button type="button" data-mode="liv" aria-pressed="${state.mode === "liv"}">Livraison</button></div>`;

  function renderCart() {
    const liv = state.mode === "liv";
    if (state.view === "done" && state.done) {
      cartDlg.innerHTML = `<div class="dlg">${head("Commande " + esc(state.done.ref))}
        <div class="dlg-body">
          <svg class="okmark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#009C69"/><path d="M19 33l9 9 17-19" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <p class="done-title">Commande confirmée !</p>
          <p>Grazie mille ! ${state.done.sent ? "Votre commande a bien été transmise à la pizzeria." : ""}</p>
          ${state.done.sent ? "" : `<p class="demo">Mode démonstration : aucun paiement réel n'a été effectué et la commande n'est pas transmise à la pizzeria.</p>`}
          <div class="recap">${esc(state.done.text)}</div>
          <button class="linkbtn" type="button" data-copy>Copier le récapitulatif</button>
        </div>
        <div class="dlg-foot">
          <a class="btn btn-red btn-block" href="tel:${CONFIG.phoneLink}">Appeler le ${CONFIG.phoneDisplay}</a>
          <button class="btn btn-ghost btn-block" type="button" data-new>Nouvelle commande</button>
        </div></div>`;
      return;
    }
    if (!state.cart.length) {
      state.view = "cart";
      cartDlg.innerHTML = `<div class="dlg">${head("Votre panier")}
        <div class="dlg-body"><div class="empty"><img src="images/citron.svg" alt="" width="87" height="93">
          <p>Votre panier est vide.<br>Choisissez une pizza pour commencer.</p>
          <button class="btn btn-red" type="button" data-close>Voir la carte</button></div></div></div>`;
      return;
    }
    const belowMin = liv && total() < CONFIG.deliveryMin;
    if (state.view === "cart") {
      cartDlg.innerHTML = `<div class="dlg">${head("Votre panier", liv ? "Prix en livraison" : "Prix à emporter")}
        <div class="dlg-body">${modeSwitch()}
          <ul class="lines">${state.cart.map((l, i) => `
            <li class="line"><div><div class="line-name">${esc(lineName(l))}</div><div class="line-detail">${esc(lineDetail(l))}</div></div>
              <div class="line-price">${euro(unitPrice(l) * l.qty)}</div>
              <span class="stepper"><button type="button" data-q="${i}" data-d="-1" aria-label="Retirer un ${esc(lineName(l))}">−</button><output>${l.qty}</output><button type="button" data-q="${i}" data-d="1" aria-label="Ajouter un ${esc(lineName(l))}">+</button></span>
              <button class="del" type="button" data-del="${i}" aria-label="Supprimer ${esc(lineName(l))} du panier">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                <span>Supprimer</span></button>
            </li>`).join("")}</ul>
          <button class="linkbtn clear" type="button" data-clear>Vider le panier</button>
        </div>
        <div class="dlg-foot"><p class="total"><span>Total</span><b>${euro(total())}</b></p>
          ${belowMin ? `<p class="err">Minimum de commande en livraison : ${euro(CONFIG.deliveryMin)}</p>` : ""}
          <button class="btn btn-red btn-block" type="button" data-checkout ${belowMin ? "disabled" : ""}>Commander</button></div></div>`;
      return;
    }
    if (state.view === "pay") { renderPay(); return; }
    // Formulaire
    const sl =slots(state.mode).filter(s => !hasFormule() || s.t <= CONFIG.lunch[1]);
    const f = state.form;
    cartDlg.innerHTML = `<form class="dlg" data-oform novalidate>${head("Vos coordonnées", (liv ? "Livraison" : "À emporter") + " · " + euro(total()))}
      <div class="dlg-body">
        <div class="field"><label for="o-slot">${liv ? "Heure de livraison" : "Heure de retrait"}</label>
          ${sl.length ? `<select id="o-slot" name="slot">${sl.map(s => `<option value="${s.t}" ${String(s.t) === f.slot ? "selected" : ""}>${s.asap ? "Dès que possible (vers " + hhmm(s.t) + ")" : hhmm(s.t)}</option>`).join("")}</select>`
            : `<p class="err">${hasFormule() ? "La formule midi n'est plus disponible aujourd'hui. Retirez-la du panier ou appelez-nous." : "Plus de créneau disponible aujourd'hui. Appelez-nous au " + CONFIG.phoneDisplay + "."}</p>`}
          ${liv ? `<p class="hint">Livraison uniquement le soir.</p>` : ""}</div>
        <div class="field"><label for="o-name">Nom</label><input id="o-name" name="name" type="text" autocomplete="name" value="${esc(f.name)}" required></div>
        <div class="field"><label for="o-phone">Téléphone</label><input id="o-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="06 12 34 56 78" value="${esc(f.phone)}" required></div>
        ${liv ? `<div class="field"><label for="o-addr">Adresse de livraison</label><textarea id="o-addr" name="address" autocomplete="street-address" placeholder="Numéro, rue, ville, code, étage…" required>${esc(f.address)}</textarea></div>` : ""}
        <div class="field"><label for="o-note">Commentaire (facultatif)</label><textarea id="o-note" name="note" maxlength="300" placeholder="Choix de boisson, allergie, précision…">${esc(f.note)}</textarea></div>
        <p class="err" data-err role="alert"></p>
      </div>
      <div class="dlg-foot"><button class="btn btn-red btn-block" type="submit" ${sl.length ? "" : "disabled"}>Continuer vers le paiement</button>
        <button class="linkbtn" type="button" data-back>← Retour au panier</button></div></form>`;
  }

  /* ---------- Paiement (interface de démonstration : aucune donnée de carte n'est conservée ni envoyée) ---------- */
  const ICON_CARD = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 10h19" stroke="currentColor" stroke-width="2.4"/><path d="M6 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const ICON_CASH = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 9.5v5M18 9.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const payLabel = () => (state.pay === "card" ? "Payer" : "Confirmer la commande") + " · " + euro(total());

  function renderPay() {
    const liv = state.mode === "liv", f = state.form;
    const n = count();
    cartDlg.innerHTML = `<form class="dlg" data-payform novalidate>${head("Paiement")}
      <div class="dlg-body">
        <div class="where">
          <div><b>${liv ? "Livraison" : "À emporter"} · ${hhmm(+f.slot)}</b><span>${esc(liv ? f.address.trim() : CONFIG.address)}</span><span>${esc(f.name.trim())} · ${esc(f.phone.trim())}</span></div>
          <button class="linkbtn" type="button" data-back-form>Modifier</button>
        </div>
        <fieldset class="field"><legend>Moyen de paiement</legend><div class="opts">
          <label class="opt pay-opt"><input type="radio" name="method" value="card" ${state.pay === "card" ? "checked" : ""}>${ICON_CARD}<span class="pay-txt"><b>Carte bancaire</b><small>CB, Visa, Mastercard</small></span><span class="radio" aria-hidden="true"></span></label>
          <label class="opt pay-opt"><input type="radio" name="method" value="cash" ${state.pay === "cash" ? "checked" : ""}>${ICON_CASH}<span class="pay-txt"><b>Espèces</b><small>${liv ? "À la livraison" : "Au retrait"}</small></span><span class="radio" aria-hidden="true"></span></label>
        </div></fieldset>
        <div class="cardbox" data-cardbox ${state.pay === "card" ? "" : "hidden"}>
          <div class="field"><label for="c-num">Numéro de carte</label>
            <div class="cardnum"><input id="c-num" name="cardnum" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23"><span class="brand-tag" data-brand></span></div></div>
          <div class="two">
            <div class="field"><label for="c-exp">Expiration</label><input id="c-exp" name="cardexp" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div>
            <div class="field"><label for="c-cvc">CVC</label><input id="c-cvc" name="cardcvc" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div>
          </div>
          <div class="field" style="margin-bottom:0"><label for="c-name">Titulaire de la carte</label><input id="c-name" name="cardname" type="text" autocomplete="cc-name" value="${esc(f.name.trim())}"></div>
        </div>
        <div class="bill">
          <p class="lbl">Récapitulatif</p>
          <div><span>Produits (${n} article${n > 1 ? "s" : ""})</span><span>${euro(total())}</span></div>
          ${liv ? `<div><span>Livraison</span><span>Incluse</span></div>` : ""}
          <div class="bill-total"><span>Total</span><b>${euro(total())}</b></div>
        </div>
        ${CONFIG.demo ? `<p class="demo">Mode démonstration : aucun paiement réel n'est effectué.</p>` : ""}
        <p class="err" data-err role="alert"></p>
      </div>
      <div class="dlg-foot"><button class="btn btn-red btn-block" type="submit">${payLabel()}</button>
        <p class="secure"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z"/></svg> Paiement sécurisé</p></div></form>`;
  }

  function cardBrand(d) {
    if (/^4/.test(d)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    return "";
  }
  const luhn = d => { let s = 0; for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; } return s % 10 === 0; };

  cartDlg.addEventListener("input", e => {
    const t = e.target, d = t.value.replace(/\D/g, "");
    if (t.name === "cardnum") { t.value = d.slice(0, 19).replace(/(.{4})(?=.)/g, "$1 "); $("[data-brand]", cartDlg).textContent = cardBrand(d); }
    else if (t.name === "cardexp") t.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2, 4) : d;
    else if (t.name === "cardcvc") t.value = d.slice(0, 4);
  });
  cartDlg.addEventListener("change", e => {
    if (e.target.name !== "method") return;
    state.pay = e.target.value;
    $("[data-cardbox]", cartDlg).hidden = state.pay !== "card";
    $('[type="submit"]', cartDlg).textContent = payLabel();
    $("[data-err]", cartDlg).textContent = "";
  });

  function pay() {
    const liv = state.mode === "liv";
    const err = $("[data-err]", cartDlg), f = $("[data-payform]", cartDlg);
    const fail = (msg, el) => { err.textContent = msg; el.focus(); };
    if (state.pay === "cash") return placeOrder("Paiement en espèces " + (liv ? "à la livraison" : "au retrait"));
    const num = f.cardnum.value.replace(/\D/g, "");
    if (num.length < 13 || !luhn(num)) return fail("Numéro de carte invalide.", f.cardnum);
    const m = /^(\d{2})\/(\d{2})$/.exec(f.cardexp.value), now = new Date();
    if (!m || +m[1] < 1 || +m[1] > 12 || 2000 + +m[2] < now.getFullYear() || (2000 + +m[2] === now.getFullYear() && +m[1] < now.getMonth() + 1)) return fail("Date d'expiration invalide.", f.cardexp);
    if (f.cardcvc.value.length < 3) return fail("Code de sécurité (CVC) invalide.", f.cardcvc);
    if (f.cardname.value.trim().length < 2) return fail("Indiquez le titulaire de la carte.", f.cardname);
    err.textContent = "";
    const btn = $('[type="submit"]', cartDlg);
    btn.disabled = true; btn.innerHTML = `<span class="spin" aria-hidden="true"></span> Paiement en cours…`;
    const line = "Payé par carte " + (cardBrand(num) || "bancaire") + " •••• " + num.slice(-4);
    setTimeout(() => placeOrder(line), 1500);   // démonstration : à remplacer par l'appel au prestataire de paiement
  }

  function keepForm() {
    const f = $("[data-oform]", cartDlg);
    if (!f) return;
    ["name", "phone", "address", "slot", "note"].forEach(k => { if (f[k]) state.form[k] = f[k].value; });
  }

  function checkForm() {
    keepForm();
    const f = state.form, liv = state.mode === "liv";
    const err = $("[data-err]", cartDlg);
    const fail = (msg, field) => { err.textContent = msg; const el = $(`[name="${field}"]`, cartDlg); if (el) el.focus(); };
    if (f.name.trim().length < 2) return fail("Indiquez votre nom.", "name");
    if (f.phone.replace(/\D/g, "").length < 9) return fail("Indiquez un numéro de téléphone valide.", "phone");
    if (liv && f.address.trim().length < 8) return fail("Indiquez votre adresse de livraison complète.", "address");
    if (!slots(state.mode).some(s => String(s.t) === f.slot)) { renderCart(); return; }
    state.view = "pay"; renderCart();
  }

  async function placeOrder(payLine) {
    const f = state.form, liv = state.mode === "liv";
    const err = $("[data-err]", cartDlg);
    if (!slots(state.mode).some(s => String(s.t) === f.slot)) { state.view = "form"; renderCart(); return; }
    const ref = "DP-" + String(Date.now()).slice(-5);
    const text = [
      (liv ? "LIVRAISON" : "À EMPORTER") + " — " + hhmm(+f.slot),
      "",
      ...state.cart.map(l => `${l.qty} × ${lineName(l)}${lineDetail(l) ? " (" + lineDetail(l) + ")" : ""} — ${euro(unitPrice(l) * l.qty)}`),
      "",
      "TOTAL : " + euro(total()),
      payLine,
      "",
      f.name.trim() + " — " + f.phone.trim(),
      ...(liv ? [f.address.trim()] : []),
      ...(f.note.trim() ? ["Commentaire : " + f.note.trim()] : [])
    ].join("\n");

    let sent = false;
    if (CONFIG.orderEndpoint) {
      const btn = $('[type="submit"]', cartDlg);
      btn.disabled = true; btn.textContent = "Envoi de la commande…";
      try {
        const r = await fetch(CONFIG.orderEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref, mode: state.mode, time: hhmm(+f.slot), total: total(), customer: { name: f.name.trim(), phone: f.phone.trim(), address: liv ? f.address.trim() : "" }, note: f.note.trim(), payment: { method: state.pay, label: payLine }, lines: state.cart.map(l => ({ ...l, label: lineName(l), detail: lineDetail(l), unit: unitPrice(l) })), text })
        });
        if (!r.ok) throw new Error(r.status);
        sent = true;
      } catch (e) {
        btn.disabled = false; btn.textContent = payLabel();
        err.textContent = "L'envoi n'a pas abouti. Réessayez ou appelez-nous au " + CONFIG.phoneDisplay + ".";
        return;
      }
    }
    state.done = { ref, text, sent };
    state.view = "done";
    state.cart = []; state.form.note = ""; state.form.slot = "";
    save(); renderBadges(); renderCart();
  }

  const stopAttn = () => $$("[data-open-cart]").forEach(b => b.classList.remove("attn"));
  function openCart() { stopAttn(); if (state.view !== "done") state.view = "cart"; renderCart(); cartDlg.showModal(); }

  cartDlg.addEventListener("click", e => {
    if (e.target === cartDlg || e.target.closest("[data-close]")) return cartDlg.close();
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.del !== undefined) {
      state.cart.splice(+t.dataset.del, 1);
      save(); renderBadges(); renderCart();
    } else if (t.hasAttribute("data-clear")) {
      if (!confirm("Vider tout le panier ?")) return;
      state.cart = [];
      save(); renderBadges(); renderCart();
    } else if (t.dataset.q !== undefined) {
      const l = state.cart[+t.dataset.q];
      l.qty += +t.dataset.d;
      if (l.qty <= 0) state.cart.splice(+t.dataset.q, 1);
      save(); renderBadges(); renderCart();
    } else if (t.dataset.mode) setMode(t.dataset.mode);
    else if (t.hasAttribute("data-checkout")) { state.view = "form"; renderCart(); }
    else if (t.hasAttribute("data-back-form")) { state.view = "form"; renderCart(); }
    else if (t.hasAttribute("data-back")) { keepForm(); state.view = "cart"; renderCart(); }
    else if (t.hasAttribute("data-new")) { state.done = null; state.view = "cart"; cartDlg.close(); }
    else if (t.hasAttribute("data-copy")) {
      (navigator.clipboard ? navigator.clipboard.writeText(state.done.text) : Promise.reject())
        .then(() => toast("Récapitulatif copié."), () => toast("Copie impossible sur cet appareil."));
    }
  });
  cartDlg.addEventListener("submit", e => { e.preventDefault(); if (state.view === "pay") pay(); else checkForm(); });
  cartDlg.addEventListener("close", () => { keepForm(); if (state.view === "done") { state.done = null; state.view = "cart"; } });

  /* ---------- Page ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("dialog")) return;
    const pz = e.target.closest("[data-pizza]");
    if (pz) return openPizza(pz.dataset.pizza);
    const ex = e.target.closest("[data-extra]");
    if (ex) return addLine({ id: ex.dataset.extra, qty: 1 });
    if (e.target.closest("[data-formule]")) return openFormule();
    if (e.target.closest("[data-open-cart]")) return openCart();
    const m = e.target.closest("[data-mode]");
    if (m) setMode(m.dataset.mode);
  });

  renderMenu(); renderBadges(); renderStatus();
  setInterval(renderStatus, 60000);
})();
