import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");

export function createComponentServer() {
  return http.createServer((req, res) => {
    const rawUrl = req.url || "/";
    const pathname = rawUrl.split("?")[0];

    if (pathname === "/ready") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    if (pathname === "/" || pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Component Test Harness</title>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #root {
      max-width: 500px;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "lit": "/node_modules/lit/index.js",
      "lit/": "/node_modules/lit/",
      "@lit/reactive-element": "/node_modules/@lit/reactive-element/reactive-element.js",
      "@lit/reactive-element/": "/node_modules/@lit/reactive-element/",
      "lit-element": "/node_modules/lit-element/index.js",
      "lit-element/": "/node_modules/lit-element/",
      "lit-html": "/node_modules/lit-html/lit-html.js",
      "lit-html/": "/node_modules/lit-html/"
    }
  }
  </script>
  <script type="module">
    import { LitElement, html, css } from "lit";
    LitElement.prototype.html = html;
    LitElement.prototype.css = css;
    window.LitElement = LitElement;

    // Minimal custom element stubs for elements rendered inside the card/editor
    if (!customElements.get("ha-card")) {
      customElements.define("ha-card", class extends HTMLElement {
        connectedCallback() {
          this.style.display = "block";
        }
      });
    }
    if (!customElements.get("ha-icon")) {
      customElements.define("ha-icon", class extends HTMLElement {
        static get observedAttributes() { return ["icon"]; }
        connectedCallback() {
          this.style.display = "inline-block";
          this.style.width = "24px";
          this.style.height = "24px";
        }
      });
    }
    if (!customElements.get("ha-icon-button")) {
      customElements.define("ha-icon-button", class extends HTMLElement {
        static get observedAttributes() { return ["label", "title", "disabled"]; }
        constructor() {
          super();
          this._shadow = this.attachShadow({ mode: "open" });
          this._shadow.innerHTML = \`<button type="button" style="width:100%;height:100%;background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><slot></slot></button>\`;
          this._btn = this._shadow.querySelector("button");
          this.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (!this.hasAttribute("disabled")) {
                e.preventDefault();
                this.click();
              }
            }
          });
        }
        connectedCallback() {
          this.style.display = "inline-flex";
          this.style.alignItems = "center";
          this.style.justifyContent = "center";
          this.style.width = "40px";
          this.style.height = "40px";
          this.style.cursor = "pointer";
          this._syncAttributes();
        }
        attributeChangedCallback() {
          this._syncAttributes();
        }
        _syncAttributes() {
          if (!this._btn) return;
          this._btn.disabled = this.hasAttribute("disabled");
          const label = this.getAttribute("label") || this.getAttribute("title") || "";
          if (label) {
            this._btn.setAttribute("aria-label", label);
            this._btn.title = label;
          } else {
            this._btn.removeAttribute("aria-label");
            this._btn.removeAttribute("title");
          }
        }
      });
    }
    if (!customElements.get("ha-expansion-panel")) {
      customElements.define("ha-expansion-panel", class extends HTMLElement {
        static get observedAttributes() { return ["outlined", "expanded"]; }
        connectedCallback() {
          this.style.display = "block";
        }
        set expanded(val) {
          this._expanded = Boolean(val);
          if (this._expanded) {
            this.setAttribute("expanded", "");
          } else {
            this.removeAttribute("expanded");
          }
        }
        get expanded() {
          return this._expanded !== undefined ? this._expanded : this.hasAttribute("expanded");
        }
        toggle() {
          const next = !this.expanded;
          this.expanded = next;
          this.dispatchEvent(new CustomEvent("expanded-changed", { bubbles: false, composed: true, detail: { expanded: next } }));
        }
      });
    }
    if (!customElements.get("ha-button")) {
      customElements.define("ha-button", class extends HTMLElement {
        static get observedAttributes() { return ["disabled"]; }
        constructor() {
          super();
          this._shadow = this.attachShadow({ mode: "open" });
          this._shadow.innerHTML = \`<button type="button" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit;padding:0;"><slot></slot></button>\`;
          this._btn = this._shadow.querySelector("button");
        }
        connectedCallback() {
          this.style.display = "inline-block";
          this._syncAttributes();
        }
        attributeChangedCallback() {
          this._syncAttributes();
        }
        _syncAttributes() {
          if (!this._btn) return;
          this._btn.disabled = this.hasAttribute("disabled");
        }
      });
    }
    if (!customElements.get("ha-form")) {
      customElements.define("ha-form", class extends HTMLElement {
        connectedCallback() {
          this.style.display = "block";
          this._render();
        }
        set schema(val) {
          this._schema = val;
          this._render();
        }
        get schema() {
          return this._schema;
        }
        set computeHelper(fn) {
          this._computeHelper = fn;
          this._render();
        }
        get computeHelper() {
          return this._computeHelper;
        }
        set computeLabel(fn) {
          this._computeLabel = fn;
          this._render();
        }
        get computeLabel() {
          return this._computeLabel;
        }
        set data(val) {
          this._data = val;
        }
        get data() {
          return this._data;
        }
        set hass(val) {
          this._hass = val;
        }
        get hass() {
          return this._hass;
        }
        _render() {
          if (!Array.isArray(this._schema)) return;
          this.innerHTML = this._schema
            .map((item) => {
              const label = typeof this._computeLabel === "function" ? this._computeLabel(item) : item.label || item.name;
              const helper = typeof this._computeHelper === "function" ? this._computeHelper(item) : undefined;
              return \`<div class="form-row" data-field="\${item.name}">\` +
                \`<label class="form-label">\${label}</label>\` +
                (helper ? \`<p class="ha-form-helper-text helper">\${helper}</p>\` : "") +
                \`</div>\`;
            })
            .join("");
        }
      });
    }

    // Load the shipped card script
    const script = document.createElement("script");
    script.src = "/dist/xiaomi-vacuum-card.js";
    document.head.appendChild(script);

    window.__cardReady = new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
    });
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`);
      return;
    }

    // Safe file serving within repository root avoiding TOCTOU race conditions
    const normalizedPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(rootDir, normalizedPath);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    let fd;
    try {
      fd = fs.openSync(filePath, "r");
      const stat = fs.fstatSync(fd);
      if (!stat.isFile()) {
        fs.closeSync(fd);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const content = fs.readFileSync(fd);
      fs.closeSync(fd);
      fd = undefined;

      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
      };
      const contentType = contentTypes[ext] || "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch (err) {
      if (fd !== undefined) {
        try {
          fs.closeSync(fd);
        } catch (_) {}
      }
      if (err.code === "ENOENT" || err.code === "EISDIR" || err.code === "ENOTDIR") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  });
}

// Standalone execution when run via `node server.mjs`
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let port = Number(process.env.COMPONENT_SERVER_PORT || 5178);
  let host = "127.0.0.1";
  if (process.env.COMPONENT_BASE_URL) {
    try {
      const url = new URL(process.env.COMPONENT_BASE_URL);
      if (url.port) {
        port = Number(url.port);
      } else {
        port = url.protocol === "https:" ? 443 : 80;
      }
      if (url.hostname) {
        host = url.hostname;
      }
    } catch (_) {}
  }
  const server = createComponentServer();
  server.listen(port, host, () => {
    console.log(`Component test server listening on http://${host}:${port}`);
  });
}
