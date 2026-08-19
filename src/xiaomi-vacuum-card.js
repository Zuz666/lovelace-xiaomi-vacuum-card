((LitElement) => {
  console.info(
    "%c XIAOMI-VACUUM-CARD-REBORN %c 4.6.2 ",
    "color: cyan; background: black; font-weight: bold;",
    "color: darkblue; background: white; font-weight: bold;",
  );

  const state = {
    status: {
      key: "status",
      icon: "mdi:robot-vacuum",
    },
    battery: {
      key: "battery_level",
      unit: "%",
      icon: "mdi:battery-charging-80",
    },
    mode: {
      key: "fan_speed",
      icon: "mdi:fan",
      service: "vacuum.set_fan_speed",
    },
  };

  const attributes = {
    main_brush: {
      key: "main_brush_left",
      label: "Main Brush: ",
      unit: " h",
    },
    side_brush: {
      key: "side_brush_left",
      label: "Side Brush: ",
      unit: " h",
    },
    filter: {
      key: "filter_left",
      label: "Filter: ",
      unit: " h",
    },
    sensor: {
      key: "sensor_dirty_left",
      label: "Sensor: ",
      unit: " h",
    },
  };

  const VACUUM_FEATURES = {
    TURN_ON: 1,
    TURN_OFF: 2,
    PAUSE: 4,
    STOP: 8,
    RETURN_HOME: 16,
    FAN_SPEED: 32,
    STATUS: 128,
    SEND_COMMAND: 256,
    LOCATE: 512,
    CLEAN_SPOT: 1024,
    MAP: 2048,
    STATE: 4096,
    START: 8192,
    CLEAN_AREA: 16384,
  };

  const SERVICE_TO_FEATURE = {
    "vacuum.start": VACUUM_FEATURES.START,
    "vacuum.pause": VACUUM_FEATURES.PAUSE,
    "vacuum.stop": VACUUM_FEATURES.STOP,
    "vacuum.return_to_base": VACUUM_FEATURES.RETURN_HOME,
    "vacuum.locate": VACUUM_FEATURES.LOCATE,
    "vacuum.clean_spot": VACUUM_FEATURES.CLEAN_SPOT,
  };

  const buttons = {
    start: {
      label: "Start",
      icon: "mdi:play",
      service: "vacuum.start",
    },
    pause: {
      label: "Pause",
      icon: "mdi:pause",
      service: "vacuum.pause",
    },
    stop: {
      label: "Stop",
      icon: "mdi:stop",
      service: "vacuum.stop",
    },
    spot: {
      label: "Clean Spot",
      icon: "mdi:broom",
      service: "vacuum.clean_spot",
    },
    locate: {
      label: "Locate",
      icon: "mdi:map-marker",
      service: "vacuum.locate",
    },
    return: {
      label: "Return to Base",
      icon: "mdi:home-map-marker",
      service: "vacuum.return_to_base",
    },
  };

  const compute = {
    trueFalse: (v) => (v === true ? "Yes" : v === false ? "No" : "-"),
    divide100: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n / 100) : "-";
    },
    secToHour: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.floor(n / 60 / 60) : "-";
    },
  };

  const vendors = {
    xiaomi: {
      attributes: {
        main_brush: { compute: compute.secToHour },
        side_brush: { compute: compute.secToHour },
        filter: { compute: compute.secToHour },
        sensor: { compute: compute.secToHour },
      },
    },
    xiaomi_mi: {
      attributes: {
        main_brush: { key: "main_brush_hours" },
        side_brush: { key: "side_brush_hours" },
        filter: { key: "hypa_hours" },
        sensor: {
          key: "mop_hours",
          label: "Mop: ",
        },
      },
    },
    valetudo: {
      state: {
        status: { key: "state" },
      },
      attributes: {
        main_brush: { key: "mainBrush" },
        side_brush: { key: "sideBrush" },
        filter: { key: "filter" },
        sensor: { key: "sensor" },
      },
    },
    roomba: {
      attributes: {
        main_brush: false,
        side_brush: false,
        filter: false,
        sensor: false,
        bin_present: {
          key: "bin_present",
          label: "Bin Present: ",
          compute: compute.trueFalse,
        },
        bin_full: {
          key: "bin_full",
          label: "Bin Full: ",
          compute: compute.trueFalse,
        },
      },
    },
    robovac: {
      attributes: false,
      buttons: {
        stop: { show: false },
        spot: { show: true },
      },
    },
    ecovacs: {
      attributes: false,
      buttons: {
        start: { service: "vacuum.turn_on" },
        pause: { service: "vacuum.stop" },
        stop: { service: "vacuum.turn_off", show: false },
        spot: { show: true },
      },
    },
    deebot: {
      buttons: {
        start: { service: "vacuum.turn_on" },
        pause: { service: "vacuum.stop" },
        stop: { service: "vacuum.turn_off" },
      },
      attributes: {
        main_brush: {
          key: "component_main_brush",
          compute: compute.divide100,
        },
        side_brush: {
          key: "component_side_brush",
          compute: compute.divide100,
        },
        filter: {
          key: "component_filter",
          compute: compute.divide100,
        },
        sensor: false,
      },
    },
    deebot_slim: {
      buttons: {
        start: { service: "vacuum.turn_on" },
        pause: { service: "vacuum.stop" },
        stop: { service: "vacuum.turn_off" },
      },
      attributes: {
        main_brush: false,
        side_brush: { key: "component_side_brush" },
        filter: { key: "component_filter" },
        sensor: false,
      },
    },
    neato: {
      state: {
        mode: false,
      },
      attributes: {
        main_brush: false,
        side_brush: false,
        filter: false,
        sensor: false,
        clean_area: {
          key: "clean_area",
          label: "Cleaned area: ",
          unit: " m2",
        },
      },
    },
  };

  const html = LitElement.prototype.html;
  const css = LitElement.prototype.css;
  const sanitizeStyleUrl = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    let decoded = trimmed;
    let prev;
    try {
      do {
        prev = decoded;
        decoded = decodeURIComponent(decoded);
      } while (decoded !== prev);
    } catch (e) {
      return "";
    }
    if (decoded.includes("..")) return "";
    return /^(https?:\/\/|\/local\/|\/hacsfiles\/|\/api\/image\/serve\/|\/api\/image_proxy\/|\/api\/media_source_proxy\/|\/media\/|local\/)[\w\-./?=&#%+:@!~]+$/.test(
      trimmed,
    )
      ? trimmed
      : "";
  };

  class XiaomiVacuumCard extends LitElement {
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
      return css`
        .background {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
        }
        .title {
          font-size: 20px;
          padding: 12px 16px 8px;
          text-align: center;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .flex {
          display: flex;
          align-items: center;
          justify-content: space-evenly;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, auto);
          cursor: pointer;
        }
        .grid-content {
          display: grid;
          align-content: space-between;
          row-gap: 6px;
        }
        .grid-left {
          grid-column: 1;
          text-align: left;
          font-size: 1.1em;
          padding-left: 10px;
          border-left: 2px solid var(--primary-color, #03a9f4);
        }
        .grid-right {
          grid-column: 2;
          text-align: right;
          padding-right: 10px;
          border-right: 2px solid var(--primary-color, #03a9f4);
        }
        .xvc-dropdown {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          position: relative;
          width: max-content;
          max-width: 100%;
        }
        .xvc-dropdown:focus-within {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          border-radius: 2px;
        }
        .xvc-select {
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          color: inherit;
          border: 0;
          border-bottom: 1px solid currentColor;
          border-radius: 0;
          padding: 2px 4px;
          font: inherit;
          line-height: inherit;
          cursor: pointer;
          margin-left: 4px;
          max-width: 100%;
        }
        .xvc-select:focus {
          outline: none;
          box-shadow: none;
        }
        .xvc-options {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 3;
          width: max-content;
          min-width: 100%;
          max-width: 200px;
          box-sizing: border-box;
          max-height: 200px;
          overflow-y: auto;
          background: var(--ha-card-background, var(--card-background-color, white));
          color: var(--primary-text-color, #212121);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 4px;
          text-align: left;
          text-shadow: none;
        }
        .xvc-option {
          padding: 4px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        .xvc-option:hover,
        .xvc-option[active] {
          background: var(--secondary-background-color, #f5f5f5);
        }
        .xvc-option[selected] {
          color: var(--primary-color, #03a9f4);
        }
        ha-icon-button[disabled] {
          opacity: var(--disabled-opacity, 0.4);
          cursor: not-allowed;
          pointer-events: none;
        }
      `;
    }

    render() {
      return this.stateObj
        ? html` <ha-card class="background" style="${this.config.styles.background}">
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
                              .map(([id, data]) =>
                                this.renderAttribute(Object.assign({ id }, data)),
                              )}
                          </div>`
                        : null
                    }
                    ${
                      this.config.show.attributes
                        ? html` <div class="grid-content grid-right">
                            ${Object.entries(this.config.attributes)
                              .filter(([k, v]) => v && v.show !== false)
                              .map(([id, data]) =>
                                this.renderAttribute(Object.assign({ id }, data)),
                              )}
                          </div>`
                        : null
                    }
                  </div>`
                : null
            }
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
      const candidates = this.resolveSameDeviceCandidates(
        "binary_sensor",
        "battery_charging",
        hass,
      );
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
            if (
              localized &&
              !localized.startsWith("component.") &&
              !localized.startsWith("state.")
            ) {
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

      const service = data.service || "";
      const isLegacyToggle = service === "vacuum.turn_on" || service === "vacuum.turn_off";
      const explicitShow =
        data.show === true ||
        isLegacyToggle ||
        (data.custom && !(service in SERVICE_TO_FEATURE) && data.show !== "auto");

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
        return { visible: true, disabled: true, callable: false };
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
        visible: true,
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
        <ha-icon style="display:flex;" icon="${data.icon}"></ha-icon>
      </ha-icon-button>`;
    }

    async callActionButton(data) {
      if (!data) return;
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
        this._dropdown = dropdown.open
          ? Object.assign({}, dropdown, { active: next })
          : Object.assign({}, dropdown, { active: next, value: next });
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

      this.config = {
        name: config.name,
        entity: config.entity,
        image,
        sensorEntity: `sensor.${entityName}`,
        show: {
          name: showName,
          state: config.state !== false,
          attributes: config.attributes !== false,
          buttons: showButtons,
        },
        buttons: this.deepMerge(buttons, vendor.buttons, config.buttons),
        state: this.deepMerge(state, vendor.state, config.state),
        attributes: this.deepMerge(attributes, vendor.attributes, config.attributes),
        styles: this.getCardStyles(image, showName, showButtons),
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

    getCardStyles(image, showName, showButtons) {
      const styleImage = this.getImageStyleUrl(image);
      return {
        background: styleImage
          ? `background-image: url("${styleImage}"); color: white; text-shadow: 0 0 10px black;`
          : "",
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

        const cleanup = async () => {
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
                  reject(err);
                }
              },
            );
          }
        } catch (err) {
          settled = true;
          reject(err);
        }
      });
    }

    async callService(service, data) {
      if (!this.stateObj || !service) return;
      if (this.stateObj.state === "unavailable" || this.stateObj.state === "unknown") return;
      const [domain, name] = service.split(".");
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
      const event = new Event(type, {
        bubbles: options.bubbles !== false,
        cancelable: options.cancelable !== false,
        composed: options.composed !== false,
      });
      event.detail = { entityId: this.stateObj && this.stateObj.entity_id };
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

  class XiaomiVacuumCardEditor extends LitElement {
    static get properties() {
      return {
        hass: {},
        _config: {},
        _model: {},
        _expandedSections: {},
      };
    }

    static get styles() {
      return css`
        .editor {
          display: block;
        }
        ha-expansion-panel {
          margin-bottom: 8px;
        }
        h4 {
          margin: 16px 0 8px;
        }
        .row {
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          margin: 8px 0;
          padding: 8px;
        }
        .row-title {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .row-title span {
          font-weight: 500;
        }
        .service-data-header {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: space-between;
          width: 100%;
        }
        .service-data-mode {
          display: inline-flex;
        }
        .service-data-mode-button:first-child {
          --_button-start-end-radius: 0;
          --_button-end-end-radius: 0;
        }
        .service-data-mode-button:last-child {
          --_button-start-start-radius: 0;
          --_button-end-start-radius: 0;
        }
      `;
    }

    setConfig(config) {
      this._config = config;
      this._model = this.configToEditorModel(config || {});
      if (this._expandedSections === undefined) {
        this._expandedSections = { basic: true };
      }
    }

    _toggleSection(key, ev) {
      if (ev && ev.target !== ev.currentTarget) return;
      this._expandedSections = Object.assign({}, this._expandedSections, {
        [key]: !this._expandedSections[key],
      });
    }

    render() {
      if (!this.hass || !this._model) return html``;
      return html`
        <div class="editor">
          ${this.renderBasicSection()} ${this.renderVisibilitySection()}
          ${this.renderStateSection()} ${this.renderAttributesSection()}
          ${this.renderButtonsSection()}
        </div>
      `;
    }

    processData(config) {
      const data = Object.assign({}, config);
      if (typeof data.image === "string") {
        data.image = { media_content_id: data.image };
      }
      return data;
    }

    configToEditorModel(config) {
      return {
        type: config.type,
        entity: config.entity,
        vendor: config.vendor,
        name: config.name === false ? "" : config.name,
        image: this.processData(config).image,
        show_name: config.name !== false,
        show_state: config.state !== false,
        show_attributes: config.attributes !== false,
        show_buttons: config.buttons !== false,
        state: this.entityDataRows("state", state, config.state),
        attributes: this.entityDataRows("attributes", attributes, config.attributes),
        buttons: this.buttonRows(config.buttons),
        extra: this.extraFields(config, [
          "type",
          "entity",
          "vendor",
          "name",
          "image",
          "state",
          "attributes",
          "buttons",
        ]),
      };
    }

    editorModelToConfig(model) {
      const config = Object.assign({}, model.extra || {});
      if (model.type) config.type = model.type;
      if (model.entity) config.entity = model.entity;
      if (model.vendor) config.vendor = model.vendor;

      const image = this.cleanImageConfig(model.image);
      if (image) config.image = image;

      if (model.show_name === false) {
        config.name = false;
      } else if (model.name) {
        config.name = model.name;
      }

      this.assignEntityDataConfig(config, "state", state, model.show_state, model.state);
      this.assignEntityDataConfig(
        config,
        "attributes",
        attributes,
        model.show_attributes,
        model.attributes,
      );
      this.assignButtonConfig(config, model.show_buttons, model.buttons);
      return config;
    }

    entityDataRows(group, defaults, configValue) {
      const configObject = configValue && typeof configValue === "object" ? configValue : {};
      const ids = Object.keys(defaults).concat(
        Object.keys(configObject).filter((id) => !(id in defaults)),
      );
      return ids.map((id) => {
        const defaultValue = defaults[id] || {};
        const override = configObject[id];
        const overrideObject = override && typeof override === "object" ? override : {};
        const custom = !(id in defaults);
        return {
          id,
          group,
          custom,
          show: override === false ? false : overrideObject.show !== false,
          key: this.configField(overrideObject, defaultValue, "key", custom ? id : ""),
          entity: this.configField(overrideObject, defaultValue, "entity", ""),
          icon: this.configField(overrideObject, defaultValue, "icon", ""),
          label: this.configField(overrideObject, defaultValue, "label", ""),
          label_kind: this.configField(overrideObject, defaultValue, "service", "")
            ? "accessible"
            : "visible",
          unit: this.configField(overrideObject, defaultValue, "unit", ""),
          extra: this.extraFields(overrideObject, [
            "key",
            "entity",
            "icon",
            "label",
            "unit",
            "show",
          ]),
        };
      });
    }

    buttonRows(configValue) {
      const configObject = configValue && typeof configValue === "object" ? configValue : {};
      const ids = Object.keys(buttons).concat(
        Object.keys(configObject).filter((id) => !(id in buttons)),
      );
      return ids.map((id) => {
        const defaultValue = buttons[id] || {};
        const override = configObject[id];
        const overrideObject = override && typeof override === "object" ? override : {};
        return {
          id,
          custom: !(id in buttons),
          show:
            override === false
              ? false
              : overrideObject.show !== undefined
                ? overrideObject.show !== false
                : defaultValue.show !== false,
          icon: this.configField(overrideObject, defaultValue, "icon", ""),
          label: this.configField(overrideObject, defaultValue, "label", ""),
          service: this.configField(overrideObject, defaultValue, "service", ""),
          service_data_mode: overrideObject.service_data_mode || "static",
          service_data: overrideObject.service_data || {},
          service_data_template: overrideObject.service_data_template || "",
          extra: this.extraFields(overrideObject, [
            "icon",
            "label",
            "service",
            "show",
            "service_data_mode",
            "service_data",
            "service_data_template",
          ]),
        };
      });
    }

    configField(override, defaultValue, key, fallback) {
      return key in override ? override[key] : key in defaultValue ? defaultValue[key] : fallback;
    }

    extraFields(config, knownKeys) {
      const extra = {};
      Object.keys(config).forEach((key) => {
        if (!knownKeys.includes(key)) extra[key] = config[key];
      });
      return extra;
    }

    assignEntityDataConfig(config, name, defaults, showGroup, rows) {
      if (showGroup === false) {
        config[name] = false;
        return;
      }

      const groupConfig = {};
      rows.forEach((row) => {
        const rowConfig = this.entityDataRowToConfig(row, defaults[row.id] || {});
        if (rowConfig !== undefined) groupConfig[row.id] = rowConfig;
      });
      if (Object.keys(groupConfig).length) config[name] = groupConfig;
    }

    entityDataRowToConfig(row, defaultValue) {
      const rowConfig = Object.assign({}, row.extra || {});
      ["key", "entity", "icon", "label", "unit"].forEach((key) => {
        if (this.hasConfigChange(row[key], defaultValue[key])) rowConfig[key] = row[key];
      });
      if (row.custom && !rowConfig.key) rowConfig.key = row.key || row.id;
      if (!row.show)
        return Object.keys(rowConfig).length ? Object.assign({ show: false }, rowConfig) : false;
      return Object.keys(rowConfig).length ? rowConfig : undefined;
    }

    assignButtonConfig(config, showGroup, rows) {
      if (showGroup === false) {
        config.buttons = false;
        return;
      }

      const buttonConfig = {};
      rows.forEach((row) => {
        const rowConfig = this.buttonRowToConfig(row, buttons[row.id] || {});
        if (rowConfig !== undefined) buttonConfig[row.id] = rowConfig;
      });
      if (Object.keys(buttonConfig).length) config.buttons = buttonConfig;
    }

    buttonRowToConfig(row, defaultValue) {
      const rowConfig = Object.assign({}, row.extra || {});
      ["icon", "label", "service"].forEach((key) => {
        if (this.hasConfigChange(row[key], defaultValue[key])) rowConfig[key] = row[key];
      });
      const mode = row.service_data_mode || "static";
      if (mode === "dynamic") {
        if (row.service_data_template && row.service_data_template.trim()) {
          rowConfig.service_data_mode = "dynamic";
          rowConfig.service_data_template = row.service_data_template;
        }
      } else {
        if (
          row.service_data &&
          typeof row.service_data === "object" &&
          Object.keys(row.service_data).length
        ) {
          rowConfig.service_data = row.service_data;
        }
      }
      if (!row.show)
        return Object.keys(rowConfig).length ? Object.assign({ show: false }, rowConfig) : false;
      if (row.show && defaultValue.show === false) rowConfig.show = true;
      return Object.keys(rowConfig).length ? rowConfig : undefined;
    }

    hasConfigChange(value, defaultValue) {
      return value !== undefined && value !== "" && value !== defaultValue;
    }

    renderBasicSection() {
      return html`
        <ha-expansion-panel
          outlined
          .expanded=${this._expandedSections.basic}
          @expanded-changed=${(ev) => this._toggleSection("basic", ev)}
        >
          <ha-icon slot="leading-icon" icon="mdi:tune-variant"></ha-icon>
          <h3 slot="header">Basic</h3>
          ${this.renderForm(
            [
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
            ],
            {
              entity: this._model.entity,
              name: this._model.name,
              vendor: this._model.vendor,
              image: this._model.image,
            },
            (ev) => this.updateBasic(ev),
          )}
        </ha-expansion-panel>
      `;
    }

    renderVisibilitySection() {
      return html`
        <ha-expansion-panel
          outlined
          .expanded=${this._expandedSections.visibility}
          @expanded-changed=${(ev) => this._toggleSection("visibility", ev)}
        >
          <ha-icon slot="leading-icon" icon="mdi:eye-outline"></ha-icon>
          <h3 slot="header">Visibility</h3>
          ${this.renderForm(
            [
              { name: "show_name", selector: { boolean: {} } },
              { name: "show_state", selector: { boolean: {} } },
              { name: "show_attributes", selector: { boolean: {} } },
              { name: "show_buttons", selector: { boolean: {} } },
            ],
            {
              show_name: this._model.show_name,
              show_state: this._model.show_state,
              show_attributes: this._model.show_attributes,
              show_buttons: this._model.show_buttons,
            },
            (ev) => this.updateVisibility(ev),
          )}
        </ha-expansion-panel>
      `;
    }

    renderStateSection() {
      return html`
        <ha-expansion-panel
          outlined
          .expanded=${this._expandedSections.state}
          @expanded-changed=${(ev) => this._toggleSection("state", ev)}
        >
          <ha-icon slot="leading-icon" icon="mdi:card-text-outline"></ha-icon>
          <h3 slot="header">State</h3>
          ${this._model.state.map((row, index) => this.renderEntityDataRow("state", row, index))}
          <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow("state")}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add custom state
          </ha-button>
        </ha-expansion-panel>
      `;
    }

    renderAttributesSection() {
      return html`
        <ha-expansion-panel
          outlined
          .expanded=${this._expandedSections.attributes}
          @expanded-changed=${(ev) => this._toggleSection("attributes", ev)}
        >
          <ha-icon slot="leading-icon" icon="mdi:format-list-bulleted-type"></ha-icon>
          <h3 slot="header">Attributes</h3>
          ${this._model.attributes.map((row, index) => this.renderEntityDataRow("attributes", row, index))}
          <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow("attributes")}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add custom attribute
          </ha-button>
        </ha-expansion-panel>
      `;
    }

    renderButtonsSection() {
      return html`
        <ha-expansion-panel
          outlined
          .expanded=${this._expandedSections.buttons}
          @expanded-changed=${(ev) => this._toggleSection("buttons", ev)}
        >
          <ha-icon slot="leading-icon" icon="mdi:gesture-tap-button"></ha-icon>
          <h3 slot="header">Buttons</h3>
          ${this._model.buttons.map((row, index) => this.renderButtonRow(row, index))}
          <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow("buttons")}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add custom button
          </ha-button>
        </ha-expansion-panel>
      `;
    }

    renderEntityDataRow(group, row, index) {
      return html`
        <div class="row">
          <div class="row-title">
            <span>${row.id}</span>
            ${
              row.custom
                ? html`
                    <ha-button
                      appearance="filled"
                      variant="danger"
                      size="s"
                      @click=${() => this.removeCustomRow(group, index)}
                    >
                      <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                      Remove
                    </ha-button>
                  `
                : ""
            }
          </div>
          ${this.renderForm(this.entityDataRowSchema(row), row, (ev) => this.updateRow(group, index, ev))}
        </div>
      `;
    }

    entityDataRowSchema(row) {
      const isBattery =
        row && (row.id === "battery" || row.key === "battery_level" || row.key === "battery");
      const entitySelector = isBattery
        ? { entity: { filter: { domain: "sensor", device_class: "battery" } } }
        : { entity: {} };
      return [
        ...(row.custom ? [{ name: "id", selector: { text: {} } }] : []),
        { name: "show", selector: { boolean: {} } },
        { name: "key", selector: { text: {} } },
        { name: "entity", selector: entitySelector },
        { name: "icon", selector: { icon: {} } },
        {
          name: "label",
          label: row.label_kind === "accessible" ? "Accessible label" : "Visible label",
          selector: { text: {} },
        },
        { name: "unit", selector: { text: {} } },
      ];
    }

    renderButtonRow(row, index) {
      const serviceDataMode = row.service_data_mode || "static";
      const dataSchema =
        serviceDataMode !== "dynamic"
          ? [{ name: "service_data", label: "", selector: { object: {} } }]
          : [{ name: "service_data_template", label: "", selector: { template: {} } }];
      const dataModel =
        serviceDataMode !== "dynamic"
          ? { service_data: row.service_data }
          : { service_data_template: row.service_data_template };
      return html`
        <div class="row">
          <div class="row-title">
            <span>${row.id}</span>
            ${
              row.custom
                ? html`
                    <ha-button
                      appearance="filled"
                      variant="danger"
                      size="s"
                      @click=${() => this.removeCustomRow("buttons", index)}
                    >
                      <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                      Remove
                    </ha-button>
                  `
                : ""
            }
          </div>
          ${this.renderForm(this.buttonRowSchema(row), row, (ev) => this.updateRow("buttons", index, ev))}
          <ha-expansion-panel outlined>
            <div slot="header" class="service-data-header">
              <span>Service data</span>
              <div class="service-data-mode">
                <ha-button
                  class="service-data-mode-button"
                  size="s"
                  variant="brand"
                  appearance=${serviceDataMode === "static" ? "accent" : "filled"}
                  @mousedown=${(ev) => ev.stopPropagation()}
                  @click=${(ev) => this.updateServiceDataMode(index, "static", ev)}
                  >Static</ha-button
                >
                <ha-button
                  class="service-data-mode-button"
                  size="s"
                  variant="brand"
                  appearance=${serviceDataMode === "dynamic" ? "accent" : "filled"}
                  @mousedown=${(ev) => ev.stopPropagation()}
                  @click=${(ev) => this.updateServiceDataMode(index, "dynamic", ev)}
                  >Dynamic</ha-button
                >
              </div>
            </div>
            ${this.renderForm(dataSchema, dataModel, (ev) => this.updateRow("buttons", index, ev))}
          </ha-expansion-panel>
        </div>
      `;
    }

    buttonRowSchema(row) {
      return [
        ...(row.custom ? [{ name: "id", selector: { text: {} } }] : []),
        { name: "show", selector: { boolean: {} } },
        { name: "icon", selector: { icon: {} } },
        { name: "label", label: "Tooltip", selector: { text: {} } },
        { name: "service", selector: { text: {} } },
      ];
    }

    renderForm(schema, data, handler) {
      return html`
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schema}
          .computeLabel=${this.computeLabel}
          @value-changed=${handler}
        ></ha-form>
      `;
    }

    computeLabel(schema) {
      return "label" in schema ? schema.label : schema.name;
    }

    updateBasic(ev) {
      this._model = Object.assign({}, this._model, ev.detail.value);
      this.dispatchModelConfig();
    }

    updateVisibility(ev) {
      this._model = Object.assign({}, this._model, ev.detail.value);
      this.dispatchModelConfig();
    }

    updateServiceDataMode(index, mode, ev) {
      if (ev) ev.stopPropagation();
      const panel = ev && ev.currentTarget && ev.currentTarget.closest("ha-expansion-panel");
      if (panel && panel.expanded !== true) panel.expanded = true;
      const rows = this._model.buttons.slice();
      rows[index] = Object.assign({}, rows[index], { service_data_mode: mode || "static" });
      this._model = Object.assign({}, this._model, { buttons: rows });
      this.dispatchModelConfig();
    }

    updateRow(group, index, ev) {
      const rows = this._model[group].slice();
      rows[index] = Object.assign({}, rows[index], ev.detail.value);
      if (rows[index].custom) {
        const prefixes = {
          buttons: "custom_button",
          attributes: "custom_attribute",
          state: "custom_state",
        };
        const prefix = prefixes[group];
        if (rows[index].entity && rows[index].id.startsWith(prefix)) {
          rows[index].id = rows[index].entity
            .split(".")
            .pop()
            .replace(/[^a-z0-9_]/gi, "_");
        } else {
          rows[index].id = this.normalizeCustomId(rows[index].id, prefix);
        }
      }
      this._model = Object.assign({}, this._model, { [group]: rows });
      this.dispatchModelConfig();
    }

    addCustomRow(group) {
      const rows = this._model[group].slice();
      const prefixes = {
        buttons: "custom_button",
        attributes: "custom_attribute",
        state: "custom_state",
      };
      const id = this.nextCustomId(rows, prefixes[group]);
      rows.push(
        group === "buttons"
          ? {
              id,
              custom: true,
              show: true,
              icon: "",
              label: "",
              service: "",
              service_data_mode: "static",
              service_data: {},
              service_data_template: "",
              extra: {},
            }
          : {
              id,
              group,
              custom: true,
              show: true,
              key: id,
              entity: "",
              icon: "",
              label: "",
              unit: "",
              extra: {},
            },
      );
      this._model = Object.assign({}, this._model, { [group]: rows });
      this.dispatchModelConfig();
    }

    removeCustomRow(group, index) {
      const rows = this._model[group].slice();
      rows.splice(index, 1);
      this._model = Object.assign({}, this._model, { [group]: rows });
      this.dispatchModelConfig();
    }

    nextCustomId(rows, base) {
      const ids = new Set(rows.map((row) => row.id));
      let id = base;
      let index = 2;
      while (ids.has(id)) id = `${base}_${index++}`;
      return id;
    }

    normalizeCustomId(value, fallback) {
      return (
        String(value || fallback)
          .trim()
          .replace(/[^a-zA-Z0-9_]+/g, "_") || fallback
      );
    }

    dispatchModelConfig() {
      this.dispatchConfig(this.editorModelToConfig(this._model));
    }

    valueChanged(ev) {
      this.dispatchConfig(this.editorModelToConfig(this.configToEditorModel(ev.detail.value)));
    }

    dispatchConfig(config) {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          bubbles: true,
          composed: true,
          detail: { config },
        }),
      );
    }

    cleanImageConfig(image) {
      if (!image) return undefined;
      if (typeof image === "string") return image || undefined;
      if (typeof image !== "object") return undefined;

      const clean = {};
      Object.keys(image).forEach((key) => {
        if (!/^\d+$/.test(key) && image[key] !== undefined) clean[key] = image[key];
      });

      const mediaContentId = clean.media_content_id;
      if (!mediaContentId) return undefined;
      return String(mediaContentId).startsWith("media-source://") ? clean : mediaContentId;
    }
  }

  customElements.define("xiaomi-vacuum-card-editor", XiaomiVacuumCardEditor);
  customElements.define("xiaomi-vacuum-card", XiaomiVacuumCard);

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
})(
  window.LitElement ||
    Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view")),
);
