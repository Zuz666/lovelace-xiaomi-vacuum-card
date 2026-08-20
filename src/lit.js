export const LitElement =
  window.LitElement ||
  Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"));

export const html = LitElement.prototype.html;
export const css = LitElement.prototype.css;
