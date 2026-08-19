import { readFile } from "node:fs/promises";
import vm from "node:vm";

const cardSourceUrl = new URL("../../dist/xiaomi-vacuum-card.js", import.meta.url);

export { VACUUM_FEATURES } from "./vacuum-features.mjs";

export function toHost(value) {
  if (Array.isArray(value)) return Array.from(value, (item) => toHost(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toHost(item)]));
}

export async function loadCard() {
  const calls = {
    console: [],
    events: [],
    animationFrames: [],
  };
  const registryEntries = new Map();

  class FakeEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = Boolean(options.bubbles);
      this.cancelable = Boolean(options.cancelable);
      this.composed = Boolean(options.composed);
      this.defaultPrevented = false;
    }

    preventDefault() {
      if (this.cancelable) this.defaultPrevented = true;
    }
  }

  class FakeCustomEvent extends FakeEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  }

  class FakeLitElement {
    constructor() {
      this.renderRoot = {
        activeElement: null,
        querySelector: () => null,
      };
    }

    dispatchEvent(event) {
      calls.events.push(event);
      return true;
    }

    disconnectedCallback() {}

    requestUpdate() {}
  }

  FakeLitElement.prototype.html = (strings, ...values) => ({ strings, values });
  FakeLitElement.prototype.css = (strings, ...values) => ({ strings, values });

  const registry = {
    entries: registryEntries,
    define(name, element) {
      registryEntries.set(name, element);
    },
    get(name) {
      return registryEntries.get(name);
    },
  };

  const document = {
    createElement(name) {
      const Element = registry.get(name);
      return Element ? new Element() : { localName: name };
    },
  };

  const consoleStub = Object.fromEntries(
    ["debug", "error", "info", "log", "warn"].map((method) => [
      method,
      (...args) => calls.console.push({ method, args }),
    ]),
  );

  let animationFrameId = 0;
  const animationFrames = new Map();

  const context = {
    cancelAnimationFrame(id) {
      animationFrames.delete(id);
    },
    console: consoleStub,
    customElements: registry,
    CustomEvent: FakeCustomEvent,
    decodeURIComponent,
    document,
    Event: FakeEvent,
    requestAnimationFrame(callback) {
      const id = ++animationFrameId;
      animationFrames.set(id, callback);
      calls.animationFrames.push({ id, callback });
      return id;
    },
    window: {
      customCards: [],
      LitElement: FakeLitElement,
    },
  };

  context.globalThis = context;
  context.window.customElements = registry;
  context.window.document = document;

  vm.runInContext(await readFile(cardSourceUrl, "utf8"), vm.createContext(context), {
    filename: cardSourceUrl.pathname,
  });

  return {
    calls,
    Card: registry.get("xiaomi-vacuum-card"),
    context,
    customCards: context.window.customCards,
    Editor: registry.get("xiaomi-vacuum-card-editor"),
    registry,
  };
}

export function createHass({
  states = {},
  entities = undefined,
  devices = undefined,
  wsResult = {},
  wsReject = null,
  subscribeHandler = null,
  subscribeEvent = null,
  subscribeError = null,
  subscribeReject = null,
  syncCallback = false,
  unsubscribeReject = null,
  localize = (key) => key,
} = {}) {
  const calls = {
    services: [],
    subscriptions: [],
    unsubscribes: 0,
    ws: [],
  };

  const connection = {
    subscribeMessage(callback, message, options) {
      const record = {
        callback,
        message: toHost(message),
        options: toHost(options),
      };
      calls.subscriptions.push(record);

      if (subscribeReject) {
        return Promise.reject(subscribeReject);
      }

      const unsub = async () => {
        calls.unsubscribes++;
        if (unsubscribeReject) {
          throw unsubscribeReject;
        }
      };

      if (typeof subscribeHandler === "function") {
        return subscribeHandler({ callback, message, options, calls, defaultUnsub: unsub });
      }

      if (syncCallback) {
        if (subscribeError) {
          callback({ error: subscribeError });
        } else if (subscribeEvent !== null) {
          callback(subscribeEvent);
        }
      } else {
        queueMicrotask(() => {
          if (subscribeError) {
            callback({ error: subscribeError });
          } else if (subscribeEvent !== null) {
            callback(subscribeEvent);
          }
        });
      }

      return Promise.resolve(unsub);
    },
  };

  return {
    calls,
    connection,
    localize,
    states,
    ...(entities !== undefined ? { entities } : {}),
    ...(devices !== undefined ? { devices } : {}),
    callService(domain, service, data) {
      calls.services.push({ domain, service, data: toHost(data) });
    },
    callWS(message) {
      calls.ws.push(toHost(message));
      return wsReject ? Promise.reject(wsReject) : Promise.resolve(wsResult);
    },
  };
}
