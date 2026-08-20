import { XiaomiVacuumCard } from "./card.js";
import { XiaomiVacuumCardEditor } from "./editor.js";

console.info(
  "%c XIAOMI-VACUUM-CARD-REBORN %c 4.6.4 ",
  "color: cyan; background: black; font-weight: bold;",
  "color: darkblue; background: white; font-weight: bold;",
);

if (!customElements.get("xiaomi-vacuum-card-editor")) {
  customElements.define("xiaomi-vacuum-card-editor", XiaomiVacuumCardEditor);
}
if (!customElements.get("xiaomi-vacuum-card")) {
  customElements.define("xiaomi-vacuum-card", XiaomiVacuumCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "xiaomi-vacuum-card")) {
  window.customCards.push({
    type: "xiaomi-vacuum-card",
    name: "Xiaomi Vacuum Card Reborn",
    description: "Maintained Lovelace custom card for vacuum cleaners",
    preview: true,
    documentationURL: "https://github.com/Zuz666/lovelace-xiaomi-vacuum-card",
    getEntitySuggestion: (hass, entityId) =>
      entityId.split(".")[0] === "vacuum"
        ? { config: { type: "custom:xiaomi-vacuum-card", entity: entityId } }
        : null,
  });
}
