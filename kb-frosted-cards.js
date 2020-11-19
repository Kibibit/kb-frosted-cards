const cardMods = new Map();
cardMods.set('ha-card', ':host { backdrop-filter: blur(5px) }');
cardMods.set('ha-dialog', '.mdc-dialog__surface { backdrop-filter: blur(5px); }');

const injectPromises = Array.from( cardMods ).map(([cardName, cssRule]) => addCssToCard(cardName, cssRule));

Promise.resolve()
.then(() => wait())
.then(() => Promise.all(injectPromises))
.then(() => {
  // Force lovelace to redraw everything
  const ev = new Event("ll-rebuild", {
    bubbles: true,
    cancelable: false,
    composed: true,
  });

  let root = document.querySelector("home-assistant");
  root = root && root.shadowRoot;
  root = root && root.querySelector("home-assistant-main");
  root = root && root.shadowRoot;
  root =
    root && root.querySelector("app-drawer-layout partial-panel-resolver");
  root = (root && root.shadowRoot) || root;
  root = root && root.querySelector("ha-panel-lovelace");
  root = root && root.shadowRoot;
  root = root && root.querySelector("hui-root");
  root = root && root.shadowRoot;
  root = root && root.querySelector("ha-app-layout #view");
  root = root && root.firstElementChild;
  if (root) root.dispatchEvent(ev);
});

function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timeout || 3000);
  });
}

function addCssToCard(cardName, cssRule) {
  return Promise.resolve()
  .then(() => customElements.whenDefined(cardName))
  .then(() => customElements.get(cardName))
  .then((cardClass) => insertStyleRule(cardClass, cssRule))
  .catch((err) => console.error(err));
}

function insertStyleRule(card, rule) {
  const newWay = Array.isArray(card.getStyles())
    ? card.getStyles()[0].styleSheet
    : card.getStyles().styleSheet;

  const oldWay = card._styles && card._styles[0] && card._styles[0].styleSheet;

  newWay.insertRule(rule);
  if (oldWay && oldWay.insertRule) {
    oldWay.insertRule(rule, 0);
  }
}
