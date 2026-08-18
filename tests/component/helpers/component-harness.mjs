/**
 * Helper utilities for Playwright browser component tests.
 * Provides deterministic Home Assistant object stubs, element mounting,
 * lifecycle synchronization (updateComplete), render counting, and service call inspection.
 */

/**
 * Creates a deterministic default Home Assistant vacuum state.
 */
export function createDefaultVacuumState({
  entityId = "vacuum.test_vacuum",
  state = "cleaning",
  status = "Cleaning",
  batteryLevel = 80,
  fanSpeed = "Standard",
  fanSpeedList = ["Silent", "Standard", "Turbo", "Max"],
  friendlyName = "Test Vacuum",
  attributes = {},
} = {}) {
  return {
    entity_id: entityId,
    state,
    attributes: {
      friendly_name: friendlyName,
      status,
      battery_level: batteryLevel,
      fan_speed: fanSpeed,
      fan_speed_list: fanSpeedList,
      ...attributes,
    },
  };
}

/**
 * Mounts a `<xiaomi-vacuum-card>` on the page with real Lit lifecycle,
 * config, and deterministic Home Assistant stub.
 */
export async function mountCard(page, { config, hass, trackRenders = true } = {}) {
  await page.goto("/");
  await page.waitForFunction(() => window.__cardReady !== undefined);
  await page.evaluate(() => window.__cardReady);

  await page.evaluate(
    ({ cardConfig, initialHass, shouldTrackRenders }) => {
      // Clear previous instances
      const root = document.getElementById("root");
      root.innerHTML = "";

      window.__componentHarness = {
        serviceCalls: [],
        events: [],
        templateSubscriptions: [],
        renderCount: 0,
      };

      const card = document.createElement("xiaomi-vacuum-card");

      if (shouldTrackRenders) {
        const originalRender = card.render.bind(card);
        card.render = function () {
          window.__componentHarness.renderCount += 1;
          return originalRender();
        };
      }

      // Build mock hass object
      const hassObj = {
        states: initialHass?.states || {},
        localize: (key) => {
          const dict = {
            "state.default.unavailable": "Unavailable",
            "state.vacuum.cleaning": "Cleaning",
            "state.vacuum.docked": "Docked",
            "state.vacuum.paused": "Paused",
            "state.vacuum.idle": "Idle",
            "state.vacuum.returning": "Returning home",
            "state.vacuum.error": "Error",
          };
          return dict[key] || key;
        },
        callService: (domain, service, data) => {
          window.__componentHarness.serviceCalls.push({
            domain,
            service,
            data,
            timestamp: Date.now(),
          });
          return Promise.resolve();
        },
        connection: {
          subscribeMessage: (callback, options) => {
            const sub = {
              options,
              callback,
              unsubscribed: false,
            };
            window.__componentHarness.templateSubscriptions.push(sub);

            if (options?.template && initialHass?.templateResult !== undefined) {
              setTimeout(() => {
                if (!sub.unsubscribed) {
                  callback({ result: initialHass.templateResult });
                }
              }, 0);
            }

            return Promise.resolve(() => {
              sub.unsubscribed = true;
            });
          },
        },
      };

      card.setConfig(cardConfig);
      card.hass = hassObj;

      window.__activeCard = card;
      window.__activeHass = hassObj;

      root.appendChild(card);
    },
    { cardConfig: config, initialHass: hass, shouldTrackRenders: trackRenders },
  );

  await page.evaluate(async () => {
    await window.__activeCard.updateComplete;
  });

  return {
    cardLocator: page.locator("xiaomi-vacuum-card"),
  };
}

/**
 * Updates `card.hass` in the browser, preserving unchanged entity references,
 * and waits for Lit's `updateComplete`.
 */
export async function updateCardHass(page, updates) {
  await page.evaluate(async (payload) => {
    const card = window.__activeCard;
    const currentHass = window.__activeHass;

    const nextStates = { ...currentHass.states };
    if (payload?.states) {
      for (const [entityId, stateValue] of Object.entries(payload.states)) {
        const prevState = currentHass.states[entityId] || {
          entity_id: entityId,
          attributes: {},
        };
        nextStates[entityId] =
          typeof stateValue === "object" && stateValue !== null
            ? { ...prevState, ...stateValue }
            : { ...prevState, state: stateValue };
      }
    }

    const nextHass = {
      ...currentHass,
      ...payload,
      states: nextStates,
    };

    window.__activeHass = nextHass;
    card.hass = nextHass;
    await card.updateComplete;
  }, updates);
}

/**
 * Updates a single entity in `hass.states` while retaining references to all other entities.
 */
export async function updateEntityState(page, entityId, stateData) {
  await updateCardHass(page, {
    states: {
      [entityId]: stateData,
    },
  });
}

/**
 * Removes an entity from `hass.states` while retaining references to all other entities.
 */
export async function removeEntityState(page, entityId) {
  await page.evaluate(async (targetId) => {
    const card = window.__activeCard;
    const currentHass = window.__activeHass;
    const nextStates = { ...currentHass.states };
    delete nextStates[targetId];
    const nextHass = {
      ...currentHass,
      states: nextStates,
    };
    window.__activeHass = nextHass;
    card.hass = nextHass;
    await card.updateComplete;
  }, entityId);
}

/**
 * Retrieves the total count of renders performed by the mounted card.
 */
export async function getCardRenderCount(page) {
  return page.evaluate(() => window.__componentHarness?.renderCount || 0);
}
/**
 * Retrieves all recorded `callService` invocations.
 */
export async function getRecordedServiceCalls(page) {
  return page.evaluate(() => window.__componentHarness?.serviceCalls || []);
}

export async function emitTemplateUpdate(page, result) {
  await page.waitForFunction(
    () => (window.__componentHarness?.templateSubscriptions?.length || 0) > 0,
  );
  await page.evaluate(async (res) => {
    const subs = window.__componentHarness?.templateSubscriptions || [];
    for (const sub of subs) {
      if (!sub.unsubscribed && typeof sub.callback === "function") {
        sub.callback({ result: res });
      }
    }
    if (window.__activeCard?.updateComplete) {
      await window.__activeCard.updateComplete;
    }
  }, result);
}

/**
 * Mounts a `<xiaomi-vacuum-card-editor>` on the page with real Lit lifecycle,
 * config, and deterministic Home Assistant stub.
 */
export async function mountEditor(page, { config, hass } = {}) {
  await page.goto("/");
  await page.waitForFunction(() => window.__cardReady !== undefined);
  await page.evaluate(() => window.__cardReady);

  await page.evaluate(
    ({ editorConfig, initialHass }) => {
      const root = document.getElementById("root");
      root.innerHTML = "";

      window.__componentHarness = {
        configChangedEvents: [],
        serviceCalls: [],
      };

      const editor = document.createElement("xiaomi-vacuum-card-editor");

      editor.addEventListener("config-changed", (ev) => {
        window.__componentHarness.configChangedEvents.push(ev.detail.config);
      });

      const hassObj = {
        states: initialHass?.states || {},
        localize: (key) => key,
        callService: (domain, service, data) => {
          window.__componentHarness.serviceCalls.push({ domain, service, data });
          return Promise.resolve();
        },
      };

      editor.setConfig(editorConfig);
      editor.hass = hassObj;

      window.__activeEditor = editor;
      window.__activeHass = hassObj;

      root.appendChild(editor);
    },
    { editorConfig: config, initialHass: hass },
  );

  await page.evaluate(async () => {
    await window.__activeEditor.updateComplete;
  });

  return {
    editorLocator: page.locator("xiaomi-vacuum-card-editor"),
  };
}

/**
 * Retrieves all fired `config-changed` event payloads.
 */
export async function getRecordedConfigChanges(page) {
  return page.evaluate(() => window.__componentHarness?.configChangedEvents || []);
}
