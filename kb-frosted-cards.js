(() => {
  let waitedFor = 0;
  const cardMods = new Map();
  cardMods.set("ha-card", ":host { backdrop-filter: blur(5px) }");
  cardMods.set(
    "ha-dialog",
    ".mdc-dialog__surface { backdrop-filter: blur(5px); }"
  );
  cardMods.set('mwc-menu-surface', '.mdc-menu-surface { top: initial !important; left: initial !important; bottom: 0; right: 0 }');

  const injectPromises = Array.from(cardMods).map(([cardName, cssRule]) =>
    addCssToCard(cardName, cssRule, cardName === "ha-card")
  );

  Promise.resolve()
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

  function waitP(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeout || 3000);
    });
  }

  function addCssToCard(cardName, cssRule, enforceOld) {
    return Promise.resolve()
      .then(() => waitUntilDefined(cardName, undefined, enforceOld))
      .then((cardClass) => insertStyleRule(cardClass, cssRule))
      .catch((err) => console.error(err));
  }

  function insertStyleRule(card, rule) {
    const newWay = Array.isArray(card.getStyles())
      ? card.getStyles()[0].styleSheet
      : card.getStyles().styleSheet;

    const oldWay =
      card._styles && card._styles[0] && card._styles[0].styleSheet;

    newWay.insertRule(rule);
    if (oldWay && oldWay.insertRule) {
      oldWay.insertRule(rule, 0);
    }
  }

  function waitUntilDefined(elementName, timeout, enforceOld) {
    timeout = timeout || 10000;
    return Promise.resolve()
      .then(() => customElements.get(elementName))
      .then((customElement) => {
        const isOldStyleDefined =
          customElement && customElement._styles && customElement._styles[0];
        const isNewStyleDefined = Array.isArray(customElement.getStyles())
          ? customElement.getStyles()[0].styleSheet
          : customElement.getStyles().styleSheet;

        if (
          customElement &&
          (enforceOld
            ? isOldStyleDefined
            : isOldStyleDefined || isNewStyleDefined)
        ) {
          waitedFor = 0;
          return customElement;
        }

        if (waitedFor >= timeout) {
          // throw new Error(elementName + " was not defined before timeout");
          console.info('waited for a long time. going into hibernate mode (checking every 10 seconds)');
        }

        let waitMilli = waitedFor >= timeout ? 10000 : 2000;
        waitedFor += waitMilli;
        return waitP(waitMilli).then(() => waitUntilDefined(elementName, timeout, enforceOld));
      });
  }
})();
