import { LitElement, html } from "./lit.js";
import {
  state,
  attributes,
  buttons,
  vendors,
  DEFAULT_BUTTONS_DISABLED_OPACITY,
  DEFAULT_BUTTONS_MODE,
  DEFAULT_SCRIM,
} from "./constants.js";
import { editorStyles } from "./styles.js";
import { parseOpacity, resolveButtonsDisabledOpacity } from "./utils.js";
export class XiaomiVacuumCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _model: {},
      _expandedSections: {},
    };
  }

  static get styles() {
    return editorStyles;
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
        ${this.renderBasicSection()} ${this.renderVisibilitySection()} ${this.renderStateSection()}
        ${this.renderAttributesSection()} ${this.renderButtonsSection()}
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

    const resolvedOpacity = resolveButtonsDisabledOpacity(config);
    const disabledOpacity =
      resolvedOpacity !== undefined ? resolvedOpacity : DEFAULT_BUTTONS_DISABLED_OPACITY;
    return {
      type: config.type,
      entity: config.entity,
      vendor: config.vendor,
      name: config.name === false ? "" : config.name,
      image: this.processData(config).image,
      scrim,
      buttons_mode: buttonsMode,
      buttons_state_aware: buttonsMode !== "always_active",
      buttons_disabled_opacity: disabledOpacity,
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
        "scrim",
        "buttons_mode",
        "buttons_state_aware",
        "state_aware_buttons",
        "buttons_disabled_opacity",
        "disabled_opacity",
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

    if (model.scrim === "true" || model.scrim === true) {
      config.scrim = true;
    } else if (model.scrim === "false" || model.scrim === false) {
      config.scrim = false;
    }

    if (model.buttons_mode && model.buttons_mode !== DEFAULT_BUTTONS_MODE) {
      config.buttons_mode = model.buttons_mode;
    }

    const parsedOpacity = parseOpacity(model.buttons_disabled_opacity);
    if (parsedOpacity !== undefined && parsedOpacity !== DEFAULT_BUTTONS_DISABLED_OPACITY) {
      config.buttons_disabled_opacity = parsedOpacity;
    }
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
        extra: this.extraFields(overrideObject, ["key", "entity", "icon", "label", "unit", "show"]),
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
    if (row.custom && row.show === true) rowConfig.show = true;
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
    const showButtons = this._model.show_buttons !== false;
    const buttonsMode = this._model.buttons_mode || DEFAULT_BUTTONS_MODE;
    const isAdaptiveMode = buttonsMode === "adaptive";

    const schema = [
      { name: "show_name", selector: { boolean: {} } },
      { name: "show_state", selector: { boolean: {} } },
      { name: "show_attributes", selector: { boolean: {} } },
      { name: "show_buttons", selector: { boolean: {} } },
      {
        name: "scrim",
        helper: "Bottom gradient overlay for button contrast (auto: enabled with background image)",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "auto", label: "auto (default)" },
              { value: "true", label: "true (always on)" },
              { value: "false", label: "false (always off)" },
            ],
          },
        },
      },
      ...(showButtons
        ? [
            {
              name: "buttons_mode",
              helper:
                "Button behavior: adaptive (disable invalid), compact (hide invalid), or always_active (legacy)",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "adaptive", label: "adaptive (disable invalid)" },
                    { value: "compact", label: "compact (hide invalid)" },
                    { value: "always_active", label: "always_active (legacy all active)" },
                  ],
                },
              },
            },
          ]
        : []),
      ...(showButtons && isAdaptiveMode
        ? [
            {
              name: "buttons_disabled_opacity",
              helper: `Opacity for disabled buttons in adaptive mode (0.0 to 1.0, default: ${DEFAULT_BUTTONS_DISABLED_OPACITY})`,
              selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } },
            },
          ]
        : []),
    ];

    const data = {
      show_name: this._model.show_name,
      show_state: this._model.show_state,
      show_attributes: this._model.show_attributes,
      show_buttons: this._model.show_buttons,
      scrim: this._model.scrim || "auto",
      buttons_mode: buttonsMode,
      buttons_disabled_opacity: this._model.buttons_disabled_opacity,
    };

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${this._expandedSections.visibility}
        @expanded-changed=${(ev) => this._toggleSection("visibility", ev)}
      >
        <ha-icon slot="leading-icon" icon="mdi:eye-outline"></ha-icon>
        <h3 slot="header">Visibility</h3>
        ${this.renderForm(schema, data, (ev) => this.updateVisibility(ev))}
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
                aria-pressed=${serviceDataMode === "static" ? "true" : "false"}
                appearance=${serviceDataMode === "static" ? "accent" : "filled"}
                @mousedown=${(ev) => ev.stopPropagation()}
                @click=${(ev) => this.updateServiceDataMode(index, "static", ev)}
                >Static</ha-button
              >
              <ha-button
                class="service-data-mode-button"
                size="s"
                variant="brand"
                aria-pressed=${serviceDataMode === "dynamic" ? "true" : "false"}
                appearance=${serviceDataMode === "dynamic" ? "accent" : "filled"}
                @mousedown=${(ev) => ev.stopPropagation()}
                @click=${(ev) => this.updateServiceDataMode(index, "dynamic", ev)}
                >Dynamic</ha-button
              >
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
        .computeHelper=${this.computeHelper}
        @value-changed=${handler}
      ></ha-form>
    `;
  }

  computeLabel(schema) {
    return "label" in schema ? schema.label : schema.name;
  }

  computeHelper(schema) {
    return "helper" in schema ? schema.helper : undefined;
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
