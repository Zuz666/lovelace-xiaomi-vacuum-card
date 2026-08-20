import { LitElement, html } from "./lit.js";
import {
  state,
  attributes,
  buttons,
  vendors,
  SERVICE_TO_FEATURE,
  DEFAULT_BUTTONS_MODE,
  DEFAULT_SCRIM,
} from "./constants.js";
import { cardStyles } from "./styles.js";
import { sanitizeStyleUrl } from "./utils.js";
export class XiaomiVacuumCard extends LitElement {
  static get properties() {
    return {
      _hass: {},
      config: {},
      stateObj: {},
      _dropdown: { type: Object },
      _resolvedImage: {},
      _resolvedImageSource: {},
    };
  }

  static get styles() {
    return cardStyles;
  }

  hasImage() {
    return Boolean(this.config && (this.config.image || this._resolvedImage));
  }

  isScrimActive() {
    if (!this.config || !this.config.show || this.config.show.buttons === false) return false;
    const scrim = this.config.scrim;
    if (scrim === "true" || scrim === true) return true;
    if (scrim === "false" || scrim === false) return false;
    return this.hasImage();
  }

  render() {
    return this.stateObj
      ? html` <ha-card
          class="background ${this.hasImage() ? "has-image" : ""} ${this.isScrimActive() ? "has-scrim" : ""}"
          style="${this.config.styles.background}"
        >
          ${
            this.config.show.name
              ? html`<div class="title">
                  ${this.config.name || this.stateObj.attributes.friendly_name}
                </div>`
              : null
          }
          ${
            this.config.show.state || this.config.show.attributes
              ? html` <div
                  class="grid"
                  style="${this.config.styles.content}"
                  @click="${() => this.fireEvent("hass-more-info")}"
                >
                  ${
                    this.config.show.state
                      ? html` <div class="grid-content grid-left">
                          ${Object.entries(this.config.state)
                            .filter(([k, v]) => v && v.show !== false)
                            .map(([id, data]) => this.renderAttribute(Object.assign({ id }, data)))}
                        </div>`
                      : null
                  }
                  ${
                    this.config.show.attributes
                      ? html` <div class="grid-content grid-right">
                          ${Object.entries(this.config.attributes)
                            .filter(([k, v]) => v && v.show !== false)
                            .map(([id, data]) => this.renderAttribute(Object.assign({ id }, data)))}
                        </div>`
                      : null
                  }
                </div>`
              : null
          }
          ${this.isScrimActive() ? html`<div class="scrim"></div>` : null}
          ${
            this.config.show.buttons
              ? html` <div class="flex">
                  ${Object.entries(this.config.buttons)
                    .filter(([k, v]) => v)
                    .map(([id, data]) => this.renderButton(Object.assign({ id }, data)))}
                </div>`
              : null
          }
        </ha-card>`
      : html`<ha-card style="padding: 8px 16px"
          >Entity '${this.config.entity}' not available...</ha-card
        >`;
  }

  getRegistrySnapshot(hass = this._hass) {
    return {
      states: (hass && hass.states) || {},
      entities:
        hass && hass.entities !== undefined && hass.entities !== null ? hass.entities : null,
      devices: hass && hass.devices !== undefined && hass.devices !== null ? hass.devices : null,
    };
  }

  emitAmbiguousCandidateWarning(vacuumEntityId, deviceClass, candidateIds, selectedId) {
    if (!this._warnedCandidateSignatures) {
      this._warnedCandidateSignatures = new Set();
    }
    const signature = `${vacuumEntityId}:${deviceClass}:${candidateIds.slice().sort().join(",")}`;
    if (!this._warnedCandidateSignatures.has(signature)) {
      this._warnedCandidateSignatures.add(signature);
      console.warn(
        `[xiaomi-vacuum-card] Multiple ${deviceClass} candidates found for ${vacuumEntityId}: ${candidateIds.join(", ")}. Selected '${selectedId}'. Specify 'entity' in configuration to avoid ambiguity.`,
      );
    }
  }

  resolveSameDeviceCandidates(domain, expectedDeviceClass, hass = this._hass) {
    const snapshot = this.getRegistrySnapshot(hass);
    const vacuumEntityId =
      (this.stateObj && this.stateObj.entity_id) || (this.config && this.config.entity) || "";
    if (!snapshot.entities || !vacuumEntityId || !(vacuumEntityId in snapshot.entities)) {
      return [];
    }

    const vacuumEntry = snapshot.entities[vacuumEntityId];
    if (!vacuumEntry || !vacuumEntry.device_id) {
      return [];
    }

    const deviceId = vacuumEntry.device_id;
    const vacuumPlatform = vacuumEntry.platform;
    const candidates = [];

    for (const [key, entry] of Object.entries(snapshot.entities)) {
      if (!entry || typeof entry !== "object") continue;
      const entityId = entry.entity_id || key;
      if (entry.device_id !== deviceId) continue;

      const entityDomain = entityId.includes(".") ? entityId.split(".")[0] : entry.domain || "";
      if (entityDomain !== domain) continue;

      if (entry.disabled_by !== undefined && entry.disabled_by !== null) continue;
      if (entry.hidden_by !== undefined && entry.hidden_by !== null) continue;
      if (entry.hidden === true) continue;

      if (!snapshot.states || !(entityId in snapshot.states) || !snapshot.states[entityId])
        continue;
      const entityState = snapshot.states[entityId];
      if (
        !entityState ||
        !entityState.attributes ||
        entityState.attributes.device_class !== expectedDeviceClass
      )
        continue;

      candidates.push({ entityId, entry });
    }

    if (!candidates.length) return [];

    candidates.sort((a, b) => {
      const aPlatformMatch = Boolean(vacuumPlatform && a.entry.platform === vacuumPlatform);
      const bPlatformMatch = Boolean(vacuumPlatform && b.entry.platform === vacuumPlatform);
      if (aPlatformMatch !== bPlatformMatch) {
        return aPlatformMatch ? -1 : 1;
      }
      return a.entityId.localeCompare(b.entityId);
    });

    if (candidates.length > 1) {
      const candidateIds = candidates.map((c) => c.entityId);
      const selectedId = candidates[0].entityId;
      this.emitAmbiguousCandidateWarning(
        vacuumEntityId,
        expectedDeviceClass,
        candidateIds,
        selectedId,
      );
    }

    return candidates;
  }

  resolveDiscoveredBatteryEntity(hass = this._hass) {
    const candidates = this.resolveSameDeviceCandidates("sensor", "battery", hass);
    return candidates.length > 0 ? candidates[0].entityId : null;
  }

  resolveDiscoveredChargingEntity(hass = this._hass) {
    const candidates = this.resolveSameDeviceCandidates("binary_sensor", "battery_charging", hass);
    return candidates.length > 0 ? candidates[0].entityId : null;
  }

  resolveChargingSource() {
    const snapshot = this.getRegistrySnapshot(this._hass);
    const states = snapshot.states;

    const discoveredChargingId = this.resolveDiscoveredChargingEntity(this._hass);
    if (discoveredChargingId && discoveredChargingId in states) {
      const entityState = states[discoveredChargingId];
      return {
        isCharging: entityState.state === "on",
        entityState,
        entityId: discoveredChargingId,
      };
    }

    if (this.stateObj && this.stateObj.attributes) {
      if (
        this.stateObj.attributes.charging === true ||
        this.stateObj.attributes.is_charging === true
      ) {
        return { isCharging: true, entityState: null, entityId: null };
      }
      if (
        typeof this.stateObj.attributes.battery_icon === "string" &&
        this.stateObj.attributes.battery_icon.includes("charging")
      ) {
        return { isCharging: true, entityState: null, entityId: null };
      }
    }

    return { isCharging: false, entityState: null, entityId: null };
  }

  resolveAttributeSource(data) {
    if (!data) return { rawValue: null, entityState: null, isBattery: false };

    const isBattery =
      data.id === "battery" || data.key === "battery_level" || data.key === "battery";
    const snapshot = this.getRegistrySnapshot(this._hass);
    const states = snapshot.states;

    if (isBattery) {
      if (data.entity && data.entity in states) {
        const entityState = states[data.entity];
        return { rawValue: entityState.state, entityState, isBattery: true };
      }

      const discoveredBatteryId = this.resolveDiscoveredBatteryEntity(this._hass);
      if (discoveredBatteryId && discoveredBatteryId in states) {
        const entityState = states[discoveredBatteryId];
        return { rawValue: entityState.state, entityState, isBattery: true };
      }

      const vacuumEntityId =
        (this.stateObj && this.stateObj.entity_id) || (this.config && this.config.entity) || "";
      const vacuumObjectId = vacuumEntityId.includes(".")
        ? vacuumEntityId.split(".")[1]
        : vacuumEntityId;

      const modernSensorId = `sensor.${vacuumObjectId}_battery`;
      if (modernSensorId in states) {
        const entityState = states[modernSensorId];
        return { rawValue: entityState.state, entityState, isBattery: true };
      }

      const legacySensorId = `sensor.${vacuumObjectId}_battery_level`;
      if (legacySensorId in states) {
        const entityState = states[legacySensorId];
        return { rawValue: entityState.state, entityState, isBattery: true };
      }

      if (
        this.stateObj &&
        this.stateObj.attributes &&
        "battery_level" in this.stateObj.attributes
      ) {
        return {
          rawValue: this.stateObj.attributes.battery_level,
          entityState: null,
          isBattery: true,
        };
      }

      if (this.stateObj && this.stateObj.attributes && "battery" in this.stateObj.attributes) {
        return { rawValue: this.stateObj.attributes.battery, entityState: null, isBattery: true };
      }

      if (this.stateObj && data.key && data.key in this.stateObj) {
        return { rawValue: this.stateObj[data.key], entityState: null, isBattery: true };
      }

      return { rawValue: null, entityState: null, isBattery: true };
    }

    if (data.entity && data.entity in states) {
      const entityState = states[data.entity];
      return { rawValue: entityState.state, entityState, isBattery: false };
    }

    const sensorKey = `${this.config.sensorEntity}_${data.key}`;
    if (sensorKey in states) {
      const entityState = states[sensorKey];
      return { rawValue: entityState.state, entityState, isBattery: false };
    }
    const isStatus = data.id === "status" || data.key === "status" || data.key === "state";
    if (isStatus) {
      if (
        data.attribute &&
        this.stateObj &&
        this.stateObj.attributes &&
        data.attribute in this.stateObj.attributes
      ) {
        return {
          rawValue: this.stateObj.attributes[data.attribute],
          entityState: null,
          isBattery: false,
        };
      }
      if (this.stateObj && this.stateObj.state !== undefined && this.stateObj.state !== null) {
        return {
          rawValue: this.stateObj.state,
          entityState: null,
          isBattery: false,
        };
      }
      if (this.stateObj && this.stateObj.attributes && "status" in this.stateObj.attributes) {
        return {
          rawValue: this.stateObj.attributes.status,
          entityState: null,
          isBattery: false,
        };
      }
      if (this.stateObj && data.key && data.key in this.stateObj) {
        return {
          rawValue: this.stateObj[data.key],
          entityState: null,
          isBattery: false,
        };
      }
      return { rawValue: null, entityState: null, isBattery: false };
    }

    if (
      this.stateObj &&
      this.stateObj.attributes &&
      data.key &&
      data.key in this.stateObj.attributes
    ) {
      return {
        rawValue: this.stateObj.attributes[data.key],
        entityState: null,
        isBattery: false,
      };
    }

    if (this.stateObj && data.key && data.key in this.stateObj) {
      return { rawValue: this.stateObj[data.key], entityState: null, isBattery: false };
    }

    return { rawValue: null, entityState: null, isBattery: false };
  }

  renderAttribute(data) {
    if (!data) return null;
    const source = this.resolveAttributeSource(data);
    const raw = source.rawValue;
    const computeFunc = data.compute || ((v) => v);
    const unavailableText =
      this._hass && typeof this._hass.localize === "function"
        ? this._hass.localize("state.default.unavailable") || "Unavailable"
        : "Unavailable";
    const unknownText =
      this._hass && typeof this._hass.localize === "function"
        ? this._hass.localize("state.default.unknown") || "Unknown"
        : "Unknown";

    let value = null;
    if (raw === "unavailable") {
      value = unavailableText;
    } else if (raw === "unknown") {
      value = unknownText;
    } else if (raw !== null && raw !== undefined) {
      let formatted = raw;
      const isStatus = data.id === "status" || data.key === "status" || data.key === "state";
      if (isStatus && typeof raw === "string" && this._hass) {
        if (
          typeof this._hass.formatEntityState === "function" &&
          this.stateObj &&
          !data.entity &&
          this.stateObj.state === raw
        ) {
          formatted = this._hass.formatEntityState(this.stateObj);
        } else if (typeof this._hass.localize === "function") {
          const localized =
            this._hass.localize(`component.vacuum.entity_component._.state.${raw}`) ||
            this._hass.localize(`state.vacuum.${raw}`);
          if (localized && !localized.startsWith("component.") && !localized.startsWith("state.")) {
            formatted = localized;
          }
        }
      }
      if (isStatus && formatted === raw && typeof raw === "string" && raw.length > 0) {
        formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      const computed = computeFunc(formatted);
      value = computed === "-" ? "-" : computed + (data.unit || "");
    }

    const list =
      this.stateObj && this.stateObj.attributes && data.key
        ? this.stateObj.attributes[`${data.key}_list`]
        : undefined;
    const hasDropdown = Array.isArray(list);

    if (hasDropdown && value !== null) {
      const icon = this.renderIcon(data, source);
      return this.renderDropdown(icon, data.key, data.service, data.label);
    }
    return html`<div>
      ${this.renderIcon(data, source)}
      ${(data.label || "") + (value !== null ? value : unavailableText)}
    </div>`;
  }

  renderIcon(data, source) {
    const attrSource = source || this.resolveAttributeSource(data);
    let icon = "";

    if (attrSource.isBattery) {
      if (
        attrSource.entityState &&
        attrSource.entityState.attributes &&
        attrSource.entityState.attributes.icon
      ) {
        icon = attrSource.entityState.attributes.icon;
      }

      if (
        !icon &&
        attrSource.rawValue !== null &&
        attrSource.rawValue !== undefined &&
        attrSource.rawValue !== ""
      ) {
        const num = Number(attrSource.rawValue);
        if (!Number.isNaN(num)) {
          const clamped = Math.max(0, Math.min(100, num));
          const rounded = Math.round(clamped / 10) * 10;
          const chargingSource = this.resolveChargingSource();
          if (chargingSource.isCharging) {
            if (rounded === 0) {
              icon = "mdi:battery-charging-outline";
            } else if (rounded === 100) {
              icon = "mdi:battery-charging-100";
            } else {
              icon = `mdi:battery-charging-${rounded}`;
            }
          } else {
            if (rounded === 0) {
              icon = "mdi:battery-outline";
            } else if (rounded === 100) {
              icon = "mdi:battery";
            } else {
              icon = `mdi:battery-${rounded}`;
            }
          }
        }
      }

      if (
        !icon &&
        this.stateObj &&
        this.stateObj.attributes &&
        this.stateObj.attributes.battery_icon
      ) {
        icon = this.stateObj.attributes.battery_icon;
      }

      if (!icon && data && data.icon) {
        icon = data.icon;
      }
    } else {
      if (data && data.icon) {
        icon = data.icon;
      } else if (
        attrSource.entityState &&
        attrSource.entityState.attributes &&
        attrSource.entityState.attributes.icon
      ) {
        icon = attrSource.entityState.attributes.icon;
      } else if (
        data &&
        data.entity &&
        this._hass &&
        this._hass.states &&
        data.entity in this._hass.states
      ) {
        const entityState = this._hass.states[data.entity];
        if (entityState.attributes && entityState.attributes.icon)
          icon = entityState.attributes.icon;
      }
    }

    return icon
      ? html`<ha-icon
          icon="${icon}"
          style="margin-right: 10px; ${this.config.styles.icon}"
        ></ha-icon>`
      : null;
  }

  getRequiredFeatureForService(service) {
    return SERVICE_TO_FEATURE[service];
  }

  getRequiredFeatureForButton(buttonData) {
    if (!buttonData) return undefined;
    const service = buttonData.service || "";
    return this.getRequiredFeatureForService(service);
  }

  evaluateButton(data) {
    if (!data) return { visible: false, disabled: true, callable: false };
    if (data.show === false) return { visible: false, disabled: true, callable: false };

    const buttonsMode = this.config
      ? this.config.buttons_mode || DEFAULT_BUTTONS_MODE
      : DEFAULT_BUTTONS_MODE;
    if (
      buttonsMode === "always_active" ||
      (this.config && this.config.buttons_state_aware === false)
    ) {
      return {
        visible: true,
        disabled: false,
        callable: true,
      };
    }
    const service = data.service || "";
    const isLegacyToggle = service === "vacuum.turn_on" || service === "vacuum.turn_off";
    const isCustom = data.custom === true || (data.id && !(data.id in buttons));
    const explicitShow = data.show === true || isLegacyToggle || (isCustom && data.show !== "auto");

    const stateObj = this.stateObj;
    if (!stateObj) {
      return { visible: explicitShow, disabled: true, callable: false };
    }

    const currentState = stateObj.state;
    const isStateUnavailable = currentState === "unavailable" || currentState === "unknown";

    const requiredFeature = this.getRequiredFeatureForButton(data);
    if (!explicitShow && requiredFeature !== undefined) {
      const supportedFeatures =
        stateObj.attributes && typeof stateObj.attributes.supported_features === "number"
          ? stateObj.attributes.supported_features
          : 0;
      const isSupported = (supportedFeatures & requiredFeature) !== 0;
      if (!isSupported) {
        return { visible: false, disabled: true, callable: false };
      }
    }

    if (isStateUnavailable) {
      return {
        visible: buttonsMode === "compact" && !explicitShow ? false : true,
        disabled: true,
        callable: false,
      };
    }
    let isBlocked = false;
    if (service === "vacuum.start") {
      isBlocked = ["cleaning", "on"].includes(currentState);
    } else if (service === "vacuum.pause" || (data.id === "pause" && service === "vacuum.stop")) {
      isBlocked = !["cleaning", "on"].includes(currentState);
    } else if (service === "vacuum.stop") {
      isBlocked = ["docked", "off", "idle"].includes(currentState);
    } else if (service === "vacuum.return_to_base") {
      isBlocked = currentState === "returning";
    }
    return {
      visible: buttonsMode === "compact" && !explicitShow ? !isBlocked : true,
      disabled: isBlocked,
      callable: !isBlocked,
    };
  }

  renderButton(data) {
    if (!data) return null;
    const buttonState = this.evaluateButton(data);
    if (!buttonState.visible) return null;

    const disabled = buttonState.disabled;

    return html`<ha-icon-button
      .disabled=${disabled}
      ?disabled=${disabled}
      aria-disabled=${disabled ? "true" : "false"}
      tabindex=${disabled ? "-1" : "0"}
      @click="${() => this.callActionButton(data)}"
      label="${data.label || ""}"
      title="${data.label || ""}"
      style="${this.config.styles.icon}"
    >
      <ha-icon style="display:flex; ${this.config.styles.icon}" icon="${data.icon}"></ha-icon>
    </ha-icon-button>`;
  }

  async callActionButton(data) {
    if (!data) return;
    const buttonsMode = this.config
      ? this.config.buttons_mode || DEFAULT_BUTTONS_MODE
      : DEFAULT_BUTTONS_MODE;
    if (
      buttonsMode === "always_active" ||
      (this.config && this.config.buttons_state_aware === false)
    ) {
      const payload =
        data.service_data_mode === "dynamic" ? data.service_data_template : data.service_data;
      await this.callService(data.service, payload, true);
      return;
    }
    const buttonState = this.evaluateButton(data);
    if (!buttonState.callable) return;

    const payload =
      data.service_data_mode === "dynamic" ? data.service_data_template : data.service_data;
    await this.callService(data.service, payload);
  }

  renderDropdown(attribute, key, service, label) {
    const list = Array.isArray(this.stateObj.attributes[`${key}_list`])
      ? this.stateObj.attributes[`${key}_list`]
      : [];
    const current = key in this.stateObj.attributes ? this.stateObj.attributes[key] : "";
    const dropdown = this._dropdown && this._dropdown.key === key ? this._dropdown : null;
    const value = dropdown ? dropdown.value : current;
    const active = dropdown ? dropdown.active : current;
    const isOpen = dropdown && dropdown.open;
    const ariaLabel = String(label || key).replace(/[:\s]+$/, "");
    const entitySlug = this.config.entity.replace(/[^a-z0-9]/gi, "_");
    const listboxId = `xvc-list-${entitySlug}-${key}`;
    const optionId = (item) => `${listboxId}-${String(item).replace(/[^a-zA-Z0-9_-]/g, "-")}`;

    return html` <div class="xvc-dropdown" @focusout=${(e) => this.handleDropdownFocusout(e)}>
      ${attribute}
      <button
        type="button"
        class="xvc-select"
        @click=${(e) => this.toggleDropdown(e, key, current)}
        @keydown=${(e) => this.handleDropdownKeydown(e, key, service, list, current)}
        role="combobox"
        aria-label=${ariaLabel}
        aria-haspopup="listbox"
        aria-expanded=${isOpen ? "true" : "false"}
        aria-controls=${listboxId}
        aria-activedescendant=${isOpen ? optionId(active) : ""}
      >
        ${value}
        <span
          aria-hidden="true"
          style="pointer-events:none;margin-left:6px;display:inline-block;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid currentColor;vertical-align:middle;opacity:0.7;transform:translateY(-1px)"
        ></span>
      </button>
      ${
        isOpen
          ? html` <div id=${listboxId} class="xvc-options" role="listbox" aria-label=${ariaLabel}>
              ${list.map(
                (item) =>
                  html` <div
                    id=${optionId(item)}
                    class="xvc-option"
                    role="option"
                    aria-selected=${item === current ? "true" : "false"}
                    ?active=${item === active}
                    ?selected=${item === current}
                    @mousedown=${(e) => e.preventDefault()}
                    @click=${(e) => {
                      e.stopPropagation();
                      this.commitDropdownValue(key, service, item, current);
                    }}
                  >
                    ${item}
                  </div>`,
              )}
            </div>`
          : null
      }
    </div>`;
  }

  toggleDropdown(event, key, current) {
    event.stopPropagation();
    const dropdown =
      this._dropdown && this._dropdown.key === key
        ? this._dropdown
        : this.getDropdownState(key, current);
    this._dropdown = Object.assign({}, dropdown, {
      active: dropdown.active || dropdown.value,
      open: !dropdown.open,
    });
  }

  handleDropdownKeydown(event, key, service, list, current) {
    event.stopPropagation();
    const dropdown =
      this._dropdown && this._dropdown.key === key
        ? this._dropdown
        : this.getDropdownState(key, current);

    if (event.key === "Escape") {
      event.preventDefault();
      this._dropdown = null;
      return;
    }

    if (event.key === "Tab") {
      this._dropdown = null;
      return;
    }

    if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
      event.preventDefault();
      const next = this.getDropdownKeyboardValue(
        list,
        dropdown.open ? dropdown.active : dropdown.value,
        event.key,
      );
      const shouldOpen = event.key === "ArrowDown" || event.key === "ArrowUp";
      this._dropdown = dropdown.open
        ? Object.assign({}, dropdown, { active: next })
        : Object.assign({}, dropdown, { active: next, value: next, open: shouldOpen });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (dropdown.open) {
        this.commitDropdownValue(key, service, dropdown.active, dropdown.committed);
      } else if (dropdown.value !== dropdown.committed) {
        this.commitDropdownValue(key, service, dropdown.value, dropdown.committed);
      } else {
        this._dropdown = Object.assign({}, dropdown, { open: true });
      }
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      if (dropdown.open) {
        this.commitDropdownValue(key, service, dropdown.active, dropdown.committed);
      } else {
        this._dropdown = Object.assign({}, dropdown, { active: dropdown.value, open: true });
      }
      return;
    }
  }

  getDropdownState(key, current) {
    return { key, value: current, active: current, committed: current, open: false };
  }

  getDropdownKeyboardValue(list, value, key) {
    if (!list.length) return value;
    const index = Math.max(0, list.indexOf(value));
    if (key === "Home") return list[0];
    if (key === "End") return list[list.length - 1];
    const step = ["ArrowDown", "PageDown"].includes(key) ? 1 : -1;
    return list[Math.min(list.length - 1, Math.max(0, index + step))];
  }

  handleDropdownFocusout(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (this._dropdownCloseFrame) cancelAnimationFrame(this._dropdownCloseFrame);
    this._dropdownCloseFrame = requestAnimationFrame(() => {
      this._dropdownCloseFrame = null;
      if (this._dropdown && !this.renderRoot.activeElement) {
        this._dropdown = null;
      }
    });
  }

  disconnectedCallback() {
    if (this._dropdownCloseFrame) {
      cancelAnimationFrame(this._dropdownCloseFrame);
      this._dropdownCloseFrame = null;
    }
    if (this._activeTemplateCleanups) {
      for (const cleanup of this._activeTemplateCleanups) {
        cleanup();
      }
      this._activeTemplateCleanups.clear();
    }
    super.disconnectedCallback();
  }

  commitDropdownValue(key, service, value, committed) {
    this._dropdown = null;
    if (value !== committed) this.handleChange(value, key, service);
  }

  getCardSize() {
    if (this.config.show.name && this.config.show.buttons) return 4;
    if (this.config.show.name || this.config.show.buttons) return 3;
    return 2;
  }

  getGridOptions() {
    return {
      columns: 6,
      min_columns: 3,
      max_columns: 12,
      rows: this.getCardSize(),
      min_rows: 2,
    };
  }

  static getStubConfig(hass) {
    const entity =
      hass &&
      hass.states &&
      Object.keys(hass.states).find((entityId) => entityId.split(".")[0] === "vacuum");
    return { entity: entity || "vacuum.xiaomi_vacuum_cleaner" };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { filter: { domain: "vacuum" } } },
        },
        { name: "name", selector: { text: {} } },
        {
          name: "vendor",
          selector: { select: { mode: "dropdown", options: Object.keys(vendors) } },
        },
        {
          name: "image",
          selector: {
            media: {
              accept: ["image/*"],
              clearable: true,
              image_upload: true,
              hide_content_type: true,
            },
          },
        },
        {
          name: "buttons_state_aware",
          selector: { boolean: {} },
        },
        {
          name: "buttons_disabled_opacity",
          selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } },
        },
      ],
    };
  }

  static getConfigElement() {
    return document.createElement("xiaomi-vacuum-card-editor");
  }

  getReferencedEntities(hass = this._hass) {
    if (!this.config) return [];
    const entities = new Set();

    if (this.config.entity) {
      entities.add(this.config.entity);
    }

    if (this.config.image && String(this.config.image).startsWith("media-source://image/")) {
      const imageEntityId = this.getImageEntityId(this.config.image);
      if (imageEntityId) entities.add(imageEntityId);
    }

    const vacuumEntityId = (this.stateObj && this.stateObj.entity_id) || this.config.entity || "";
    const vacuumObjectId = vacuumEntityId.includes(".")
      ? vacuumEntityId.split(".")[1]
      : vacuumEntityId;

    const discoveredBatteryId = this.resolveDiscoveredBatteryEntity(hass);
    const discoveredChargingId = this.resolveDiscoveredChargingEntity(hass);

    const collectRowEntities = (rowGroup) => {
      if (!rowGroup || typeof rowGroup !== "object") return;
      Object.entries(rowGroup).forEach(([id, data]) => {
        if (!data || data.show === false) return;
        if (data.entity) {
          entities.add(data.entity);
          return;
        }
        const isBattery =
          id === "battery" ||
          data.id === "battery" ||
          data.key === "battery_level" ||
          data.key === "battery";
        if (isBattery) {
          if (discoveredBatteryId) {
            entities.add(discoveredBatteryId);
          }
          if (discoveredChargingId) {
            entities.add(discoveredChargingId);
          }
          if (vacuumObjectId) {
            entities.add(`sensor.${vacuumObjectId}_battery`);
            entities.add(`sensor.${vacuumObjectId}_battery_level`);
          }
        } else if (data.key && this.config.sensorEntity) {
          entities.add(`${this.config.sensorEntity}_${data.key}`);
        }
      });
    };

    if (!this.config.show || this.config.show.state !== false) {
      collectRowEntities(this.config.state);
    }
    if (!this.config.show || this.config.show.attributes !== false) {
      collectRowEntities(this.config.attributes);
    }

    return Array.from(entities);
  }

  shouldUpdate(changedProps) {
    if (
      changedProps.has("stateObj") ||
      changedProps.has("config") ||
      changedProps.has("_dropdown") ||
      changedProps.has("_resolvedImage")
    ) {
      return true;
    }

    if (changedProps.has("_hass")) {
      const oldHass = changedProps.get("_hass");
      const newHass = this._hass;
      if (!oldHass || !newHass) return true;

      if (oldHass.language !== newHass.language || oldHass.locale !== newHass.locale) {
        return true;
      }

      if (oldHass.entities !== newHass.entities || oldHass.devices !== newHass.devices) {
        return true;
      }

      const oldStates = oldHass.states || {};
      const newStates = newHass.states || {};

      const oldTracked = this.getReferencedEntities(oldHass);
      const newTracked = this.getReferencedEntities(newHass);
      const trackedEntities = new Set([...oldTracked, ...newTracked]);
      for (const entityId of trackedEntities) {
        if (oldStates[entityId] !== newStates[entityId]) {
          return true;
        }
      }
    }

    return false;
  }

  updated() {
    if (this._dropdown && this._dropdown.open) {
      this.renderRoot.querySelector(".xvc-option[active]")?.scrollIntoView({ block: "nearest" });
    }
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity.");
    const [domain, entityName] = config.entity.split(".");
    if (domain !== "vacuum" || !entityName) throw new Error("Please define a vacuum entity.");
    if (config.vendor && !(config.vendor in vendors))
      throw new Error("Please define a valid vendor.");

    const vendor = vendors[config.vendor] || vendors.xiaomi;
    const image = this.getConfigImage(config.image);
    const showName = config.name !== false;
    const showButtons = config.buttons !== false;
    const mergedButtons = this.deepMerge(buttons, vendor.buttons, config.buttons);
    if (mergedButtons && typeof mergedButtons === "object") {
      Object.entries(mergedButtons).forEach(([id, btn]) => {
        if (btn && typeof btn === "object") {
          mergedButtons[id] = Object.assign({}, btn, { id, custom: !(id in buttons) });
        }
      });
    }

    let scrim = DEFAULT_SCRIM;
    if (config.scrim === true || config.scrim === "true") {
      scrim = "true";
    } else if (config.scrim === false || config.scrim === "false") {
      scrim = "false";
    } else if (config.scrim === "auto") {
      scrim = DEFAULT_SCRIM;
    }

    let buttonsMode = DEFAULT_BUTTONS_MODE;
    if (
      config.buttons_mode === "adaptive" ||
      config.buttons_mode === "compact" ||
      config.buttons_mode === "always_active"
    ) {
      buttonsMode = config.buttons_mode;
    } else if (config.buttons_state_aware === false || config.state_aware_buttons === false) {
      buttonsMode = "always_active";
    }

    const buttonsStateAware = buttonsMode !== "always_active";
    const rawOpacity =
      config.buttons_disabled_opacity !== undefined
        ? config.buttons_disabled_opacity
        : config.disabled_opacity;
    let buttonsDisabledOpacity;
    if (rawOpacity !== undefined && rawOpacity !== null && rawOpacity !== "") {
      const num = Number(rawOpacity);
      if (Number.isFinite(num)) {
        buttonsDisabledOpacity = Math.max(0, Math.min(1, num));
      }
    }

    this.config = {
      name: config.name,
      entity: config.entity,
      image,
      scrim,
      buttons_mode: buttonsMode,
      buttons_state_aware: buttonsStateAware,
      buttons_disabled_opacity: buttonsDisabledOpacity,
      disabled_opacity: buttonsDisabledOpacity,
      sensorEntity: `sensor.${entityName}`,
      show: {
        name: showName,
        state: config.state !== false,
        attributes: config.attributes !== false,
        buttons: showButtons,
      },
      buttons: mergedButtons,
      state: this.deepMerge(state, vendor.state, config.state),
      attributes: this.deepMerge(attributes, vendor.attributes, config.attributes),
      styles: this.getCardStyles(image, showName, showButtons, buttonsDisabledOpacity),
    };
    this.resolveCardImage();
  }

  getConfigImage(image) {
    if (image && typeof image === "object") return image.media_content_id || "";
    return image || "";
  }

  getImageStyleUrl(image) {
    if (!image) return "";
    if (String(image).startsWith("media-source://")) return sanitizeStyleUrl(this._resolvedImage);
    return sanitizeStyleUrl(image);
  }

  getCardStyles(image, showName, showButtons, buttonsDisabledOpacity) {
    const styleImage = this.getImageStyleUrl(image);
    const opacityStyle =
      buttonsDisabledOpacity !== undefined
        ? `--xvc-disabled-opacity: ${buttonsDisabledOpacity}; `
        : "";
    return {
      background: `${opacityStyle}${
        styleImage
          ? `background-image: url("${styleImage}"); color: white; text-shadow: 0 0 10px black;`
          : ""
      }`,
      icon: `color: ${styleImage ? "white" : "var(--state-icon-color, var(--secondary-text-color, #727272))"};`,
      content: `padding: ${showName ? "8px" : "16px"} 16px ${showButtons ? "8px" : "16px"};`,
    };
  }

  updateImageStyles() {
    if (!this.config) return;
    this.config = Object.assign({}, this.config, {
      styles: this.getCardStyles(
        this.config.image,
        this.config.show.name,
        this.config.show.buttons,
        this.config.buttons_disabled_opacity,
      ),
    });
  }

  resolveCardImage() {
    if (!this.config || !this._hass) return;
    const image = this.config.image;
    if (!image || !String(image).startsWith("media-source://")) {
      if (this._resolvedImage || this._resolvedImageSource) {
        this._resolvedImage = "";
        this._resolvedImageSource = "";
        this.updateImageStyles();
      }
      return;
    }

    const imageEntityId = this.getImageEntityId(image);
    if (imageEntityId) {
      const nextImage = this.getImageEntityUrl(imageEntityId);
      if (this._resolvedImageSource === image && this._resolvedImage === nextImage) return;
      this._resolvedImage = nextImage;
      this._resolvedImageSource = image;
      this.updateImageStyles();
      return;
    }

    if (this._resolvedImageSource === image) return;
    this._resolvedImage = "";
    this._resolvedImageSource = image;
    this.updateImageStyles();
    this._hass
      .callWS({ type: "media_source/resolve_media", media_content_id: image })
      .then((result) => {
        if (!this.config || this.config.image !== image) return;
        this._resolvedImage = result && result.url ? result.url : "";
        this.updateImageStyles();
      })
      .catch(() => {
        if (!this.config || this.config.image !== image) return;
        this._resolvedImage = "";
        this.updateImageStyles();
      });
  }

  getImageEntityId(image) {
    const prefix = "media-source://image/";
    return String(image).startsWith(prefix) ? String(image).slice(prefix.length) : "";
  }

  getImageEntityUrl(entityId) {
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return "";
    const token = stateObj.attributes && stateObj.attributes.access_token;
    return token ? `/api/image_proxy/${entityId}?token=${token}&state=${stateObj.state}` : "";
  }

  set hass(hass) {
    this._hass = hass;
    if (hass && this.config) {
      const nextStateObj =
        this.config.entity in hass.states ? hass.states[this.config.entity] : null;
      if (
        this._dropdown &&
        nextStateObj &&
        nextStateObj.attributes &&
        nextStateObj.attributes[this._dropdown.key] !== this._dropdown.committed
      ) {
        this._dropdown = null;
      }
      this.stateObj = nextStateObj;
      this.resolveCardImage();
    }
  }

  handleChange(mode, key, service) {
    if (!this.stateObj) return;
    this.callService(service || `vacuum.set_${key}`, {
      entity_id: this.stateObj.entity_id,
      [key]: mode,
    });
  }

  renderTemplateOnce(template) {
    return new Promise((resolve, reject) => {
      if (
        !this._hass ||
        !this._hass.connection ||
        typeof this._hass.connection.subscribeMessage !== "function"
      ) {
        reject(new Error("No Home Assistant connection available"));
        return;
      }

      let unsub = null;
      let settled = false;
      let pendingUnsub = false;
      let timer = null;

      if (!this._activeTemplateCleanups) {
        this._activeTemplateCleanups = new Set();
      }

      const cleanup = async () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this._activeTemplateCleanups.delete(cleanup);
        if (unsub) {
          try {
            await unsub();
          } catch (e) {
            console.error("[xiaomi-vacuum-card] Error during template unsubscribe:", e);
          }
        } else {
          pendingUnsub = true;
        }
      };

      this._activeTemplateCleanups.add(cleanup);

      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Template render timed out"));
      }, 5000);

      const callback = (event) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (event && event.error) {
          reject(new Error(event.error));
        } else if (event && "result" in event) {
          resolve(event.result);
        } else {
          reject(new Error("Invalid template event"));
        }
      };

      try {
        const unsubPromise = this._hass.connection.subscribeMessage(
          callback,
          { type: "render_template", template, report_errors: true },
          { resubscribe: false },
        );
        if (unsubPromise && typeof unsubPromise.then === "function") {
          unsubPromise.then(
            (unsubFn) => {
              unsub = unsubFn;
              if (pendingUnsub && unsub) {
                try {
                  const res = unsub();
                  if (res && typeof res.catch === "function") {
                    res.catch((e) =>
                      console.error("[xiaomi-vacuum-card] Error during template unsubscribe:", e),
                    );
                  }
                } catch (e) {
                  console.error("[xiaomi-vacuum-card] Error during template unsubscribe:", e);
                }
              }
            },
            (err) => {
              if (!settled) {
                settled = true;
                cleanup();
                reject(err);
              }
            },
          );
        }
      } catch (err) {
        settled = true;
        cleanup();
        reject(err);
      }
    });
  }

  async callService(service, data, allowUnavailable = false) {
    if (!this.stateObj || !service) return;
    if (
      !allowUnavailable &&
      (this.stateObj.state === "unavailable" || this.stateObj.state === "unknown")
    ) {
      return;
    }
    const [domain, name] = service.split(".");
    if (!domain || !name) {
      console.error("[xiaomi-vacuum-card] Invalid service, expected 'domain.service':", service);
      return;
    }
    let resolvedData = data ?? { entity_id: this.stateObj.entity_id };
    if (typeof data === "string") {
      try {
        const rendered = await this.renderTemplateOnce(data);
        const parsed = typeof rendered === "string" ? JSON.parse(rendered) : rendered;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          console.error(
            "[xiaomi-vacuum-card] service_data_template must return a JSON object, got:",
            rendered,
          );
          return;
        }
        resolvedData = Object.assign({}, parsed, { entity_id: this.stateObj.entity_id });
      } catch (e) {
        console.error("[xiaomi-vacuum-card] Failed to render/parse service_data_template:", e);
        return;
      }
    }
    this._hass.callService(domain, name, resolvedData);
  }

  fireEvent(type, options = {}) {
    const event = new CustomEvent(type, {
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed !== false,
      detail: { entityId: this.stateObj && this.stateObj.entity_id },
    });
    this.dispatchEvent(event);
  }

  deepMerge(...sources) {
    const isObject = (obj) => obj && typeof obj === "object";
    const target = {};

    sources
      .filter((source) => isObject(source))
      .forEach((source) => {
        Object.keys(source).forEach((key) => {
          const targetValue = target[key];
          const sourceValue = source[key];

          if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
          } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = this.deepMerge(Object.assign({}, targetValue), sourceValue);
          } else {
            target[key] = sourceValue;
          }
        });
      });

    return target;
  }
}
