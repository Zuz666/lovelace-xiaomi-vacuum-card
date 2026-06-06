((LitElement) => {
    console.info(
        '%c XIAOMI-VACUUM-CARD %c 4.6.0 ',
        'color: cyan; background: black; font-weight: bold;',
        'color: darkblue; background: white; font-weight: bold;',
    );

    const state = {
        status: {
            key: 'status',
            icon: 'mdi:robot-vacuum',
        },
        battery: {
            key: 'battery_level',
            unit: '%',
            icon: 'mdi:battery-charging-80',
        },
        mode: {
            key: 'fan_speed',
            icon: 'mdi:fan',
            service: 'vacuum.set_fan_speed',
        },
    };

    const attributes = {
        main_brush: {
            key: 'main_brush_left',
            label: 'Main Brush: ',
            unit: ' h',
        },
        side_brush: {
            key: 'side_brush_left',
            label: 'Side Brush: ',
            unit: ' h',
        },
        filter: {
            key: 'filter_left',
            label: 'Filter: ',
            unit: ' h',
        },
        sensor: {
            key: 'sensor_dirty_left',
            label: 'Sensor: ',
            unit: ' h',
        },
    };

    const buttons = {
        start: {
            label: 'Start',
            icon: 'mdi:play',
            service: 'vacuum.start',
        },
        pause: {
            label: 'Pause',
            icon: 'mdi:pause',
            service: 'vacuum.pause',
        },
        stop: {
            label: 'Stop',
            icon: 'mdi:stop',
            service: 'vacuum.stop',
        },
        spot: {
            show: false,
            label: 'Clean Spot',
            icon: 'mdi:broom',
            service: 'vacuum.clean_spot',
        },
        locate: {
            label: 'Locate',
            icon: 'mdi:map-marker',
            service: 'vacuum.locate',
        },
        return: {
            label: 'Return to Base',
            icon: 'mdi:home-map-marker',
            service: 'vacuum.return_to_base',
        },
    };

    const compute = {
        trueFalse: v => (v === true ? 'Yes' : (v === false ? 'No' : '-')),
        divide100: v => {
            const n = Number(v);
            return Number.isFinite(n) ? Math.round(n / 100) : '-';
        },
        secToHour: v => {
            const n = Number(v);
            return Number.isFinite(n) ? Math.floor(n / 60 / 60) : '-';
        },
    }

    const vendors = {
        xiaomi: {
            attributes: {
                main_brush: {compute: compute.secToHour},
                side_brush: {compute: compute.secToHour},
                filter: {compute: compute.secToHour},
                sensor: {compute: compute.secToHour},
            }
        },
        xiaomi_mi: {
            attributes: {
                main_brush: {key: 'main_brush_hours'},
                side_brush: {key: 'side_brush_hours'},
                filter: {key: 'hypa_hours'},
                sensor: {
                    key: 'mop_hours',
                    label: 'Mop: ',
                },
            },
        },
        valetudo: {
            state: {
                status: {key: 'state'},
            },
            attributes: {
                main_brush: {key: 'mainBrush'},
                side_brush: {key: 'sideBrush'},
                filter: {key: 'filter'},
                sensor: {key: 'sensor'},
            },
        },
        roomba: {
            attributes: {
                main_brush: false,
                side_brush: false,
                filter: false,
                sensor: false,
                bin_present: {
                    key: 'bin_present',
                    label: 'Bin Present: ',
                    compute: compute.trueFalse,
                },
                bin_full: {
                    key: 'bin_full',
                    label: 'Bin Full: ',
                    compute: compute.trueFalse,
                },
            },
        },
        robovac: {
            attributes: false,
            buttons: {
                stop: {show: false},
                spot: {show: true},
            },
        },
        ecovacs: {
            attributes: false,
            buttons: {
                start: {service: 'vacuum.turn_on'},
                pause: {service: 'vacuum.stop'},
                stop: {service: 'vacuum.turn_off', show: false},
                spot: {show: true},
            },
        },
        deebot: {
            buttons: {
                start: {service: 'vacuum.turn_on'},
                pause: {service: 'vacuum.stop'},
                stop: {service: 'vacuum.turn_off'},
            },
            attributes: {
                main_brush: {
                    key: 'component_main_brush',
                    compute: compute.divide100,
                },
                side_brush: {
                    key: 'component_side_brush',
                    compute: compute.divide100,
                },
                filter: {
                    key: 'component_filter',
                    compute: compute.divide100,
                },
                sensor: false,
            },
        },
        deebot_slim: {
            buttons: {
                start: {service: 'vacuum.turn_on'},
                pause: {service: 'vacuum.stop'},
                stop: {service: 'vacuum.turn_off'},
            },
            attributes: {
                main_brush: false,
                side_brush: {key: 'component_side_brush'},
                filter: {key: 'component_filter'},
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
                    key: 'clean_area',
                    label: 'Cleaned area: ',
                    unit: ' m2',
                },
            },
        },
    };

    const html = LitElement.prototype.html;
    const css = LitElement.prototype.css;
    const sanitizeStyleUrl = value => {
        if (typeof value !== 'string') return '';
        const trimmed = value.trim();
        let decoded = trimmed;
        let prev;
        try {
            do {
                prev = decoded;
                decoded = decodeURIComponent(decoded);
            } while (decoded !== prev);
        } catch (e) { return ''; }
        if (decoded.includes('..')) return '';
        return /^(https?:\/\/|\/local\/|\/hacsfiles\/|\/api\/image\/serve\/|\/api\/image_proxy\/|\/api\/media_source_proxy\/|\/media\/|local\/)[\w\-./?=&#%+:@!~]+$/.test(trimmed) ? trimmed : '';
    };

    class XiaomiVacuumCard extends LitElement {

        static get properties() {
            return {
                _hass: {},
                config: {},
                stateObj: {},
                _dropdown: {type: Object},
                _resolvedImage: {},
                _resolvedImageSource: {},
            }
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
}`;
        }

        render() {
            return this.stateObj ? html`
            <ha-card class="background" style="${this.config.styles.background}">
              ${this.config.show.name ?
                html`<div class="title">${this.config.name || this.stateObj.attributes.friendly_name}</div>`
                : null}
              ${(this.config.show.state || this.config.show.attributes) ? html`
              <div class="grid" style="${this.config.styles.content}" @click="${() => this.fireEvent('hass-more-info')}">
                ${this.config.show.state ? html`
                <div class="grid-content grid-left">
                  ${Object.values(this.config.state).filter(v => v && v.show !== false).map(this.renderAttribute.bind(this))}
                </div>` : null}
                ${this.config.show.attributes ? html`
                <div class="grid-content grid-right">
                  ${Object.values(this.config.attributes).filter(v => v && v.show !== false).map(this.renderAttribute.bind(this))}
                </div>` : null}
              </div>` : null}
              ${this.config.show.buttons ? html`
              <div class="flex">
                ${Object.values(this.config.buttons).filter(v => v).map(this.renderButton.bind(this))}
              </div>` : null}
            </ha-card>` : html`<ha-card style="padding: 8px 16px">Entity '${this.config.entity}' not available...</ha-card>`;
        }

        renderAttribute(data) {
            const computeFunc = data.compute || (v => v);
            const formatValue = raw => {
                const computed = computeFunc(raw);
                return computed === '-' ? '-' : computed + (data.unit || '');
            };
            const externalEntity = data.entity && data.entity in this._hass.states ? this._hass.states[data.entity] : null;
            const isValidSensorData = data && `${this.config.sensorEntity}_${data.key}` in this._hass.states;
            const isValidAttribute = data && data.key in this.stateObj.attributes;
            const isValidEntityData = data && data.key in this.stateObj;

            let value = externalEntity
                ? formatValue(externalEntity.state)
                : isValidSensorData
                    ? formatValue(this._hass.states[`${this.config.sensorEntity}_${data.key}`].state)
                    : isValidAttribute
                        ? formatValue(this.stateObj.attributes[data.key])
                        : isValidEntityData
                            ? formatValue(this.stateObj[data.key])
                            : null;
            const list = this.stateObj.attributes[`${data.key}_list`];
            const hasDropdown = Array.isArray(list);

            if (hasDropdown && value !== null) {
                const icon = this.renderIcon(data);
                return this.renderDropdown(icon, data.key, data.service, data.label);
            }
            return html`<div>
                ${this.renderIcon(data)}
                ${(data.label || '') + (value !== null ? value : this._hass.localize('state.default.unavailable'))}
            </div>`;
        }

        renderIcon(data) {
            let icon = '';
            if (data.key === 'battery_level' && 'battery_icon' in this.stateObj.attributes) {
                icon = this.stateObj.attributes.battery_icon;
            } else if (data.icon) {
                icon = data.icon;
            } else if (data.entity && data.entity in this._hass.states) {
                const entityState = this._hass.states[data.entity];
                if (entityState.attributes && entityState.attributes.icon) icon = entityState.attributes.icon;
            }
            return icon ? html`<ha-icon icon="${icon}" style="margin-right: 10px; ${this.config.styles.icon}"></ha-icon>` : null;
        }

        renderButton(data) {
            return data && data.show !== false
                ? html`<ha-icon-button
                    @click="${() => this.callService(data.service, data.service_data)}"
                    label="${data.label || ''}"
                    title="${data.label || ''}"
                    style="${this.config.styles.icon}">
                      <ha-icon style="display:flex;" icon="${data.icon}"></ha-icon>
                    </ha-icon-button>`
                : null;
        }

        renderDropdown(attribute, key, service, label) {
            const list = Array.isArray(this.stateObj.attributes[`${key}_list`])
                ? this.stateObj.attributes[`${key}_list`]
                : [];
            const current = key in this.stateObj.attributes ? this.stateObj.attributes[key] : '';
            const dropdown = this._dropdown && this._dropdown.key === key ? this._dropdown : null;
            const value = dropdown ? dropdown.value : current;
            const active = dropdown ? dropdown.active : current;
            const isOpen = dropdown && dropdown.open;
            const ariaLabel = String(label || key).replace(/[:\s]+$/, '');
            const entitySlug = this.config.entity.replace(/[^a-z0-9]/gi, '_');
            const listboxId = `xvc-list-${entitySlug}-${key}`;
            const optionId = item => `${listboxId}-${String(item).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

            return html`
                <div class="xvc-dropdown" @focusout=${e => this.handleDropdownFocusout(e)}>
                    ${attribute}
                    <button
                      type="button"
                      class="xvc-select"
                      @click=${e => this.toggleDropdown(e, key, current)}
                      @keydown=${e => this.handleDropdownKeydown(e, key, service, list, current)}
                      role="combobox"
                      aria-label=${ariaLabel}
                      aria-haspopup="listbox"
                      aria-expanded=${isOpen ? 'true' : 'false'}
                      aria-controls=${listboxId}
                      aria-activedescendant=${isOpen ? optionId(active) : ''}>
                        ${value}
                        <span aria-hidden="true" style="pointer-events:none;margin-left:6px;display:inline-block;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid currentColor;vertical-align:middle;opacity:0.7;transform:translateY(-1px)"></span>
                    </button>
                    ${isOpen ? html`
                    <div id=${listboxId} class="xvc-options" role="listbox" aria-label=${ariaLabel}>
                        ${list.map(item => html`
                        <div
                          id=${optionId(item)}
                          class="xvc-option"
                          role="option"
                          aria-selected=${item === current ? 'true' : 'false'}
                          ?active=${item === active}
                          ?selected=${item === current}
                          @mousedown=${e => e.preventDefault()}
                          @click=${e => {
                              e.stopPropagation();
                              this.commitDropdownValue(key, service, item, current);
                          }}>
                            ${item}
                        </div>`)}
                    </div>` : null}
                </div>`;
        }

        toggleDropdown(event, key, current) {
            event.stopPropagation();
            const dropdown = this._dropdown && this._dropdown.key === key
                ? this._dropdown
                : this.getDropdownState(key, current);
            this._dropdown = Object.assign({}, dropdown, {
                active: dropdown.active || dropdown.value,
                open: !dropdown.open,
            });
        }

        handleDropdownKeydown(event, key, service, list, current) {
            event.stopPropagation();
            const dropdown = this._dropdown && this._dropdown.key === key
                ? this._dropdown
                : this.getDropdownState(key, current);

            if (event.key === 'Escape') {
                event.preventDefault();
                this._dropdown = null;
                return;
            }

            if (event.key === 'Tab') {
                this._dropdown = null;
                return;
            }

            if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
                event.preventDefault();
                const next = this.getDropdownKeyboardValue(list, dropdown.open ? dropdown.active : dropdown.value, event.key);
                this._dropdown = dropdown.open
                    ? Object.assign({}, dropdown, {active: next})
                    : Object.assign({}, dropdown, {active: next, value: next});
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                if (dropdown.open) {
                    this.commitDropdownValue(key, service, dropdown.active, dropdown.committed);
                } else if (dropdown.value !== dropdown.committed) {
                    this.commitDropdownValue(key, service, dropdown.value, dropdown.committed);
                } else {
                    this._dropdown = Object.assign({}, dropdown, {open: true});
                }
                return;
            }

            if (event.key === ' ') {
                event.preventDefault();
                if (dropdown.open) {
                    this.commitDropdownValue(key, service, dropdown.active, dropdown.committed);
                } else {
                    this._dropdown = Object.assign({}, dropdown, {active: dropdown.value, open: true});
                }
                return;
            }
        }

        getDropdownState(key, current) {
            return {key, value: current, active: current, committed: current, open: false};
        }

        getDropdownKeyboardValue(list, value, key) {
            if (!list.length) return value;
            const index = Math.max(0, list.indexOf(value));
            if (key === 'Home') return list[0];
            if (key === 'End') return list[list.length - 1];
            const step = ['ArrowDown', 'PageDown'].includes(key) ? 1 : -1;
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
            const entity = hass && hass.states && Object.keys(hass.states).find(entityId => entityId.split('.')[0] === 'vacuum');
            return {entity: entity || 'vacuum.xiaomi_vacuum_cleaner'};
        }

        static getConfigForm() {
            return {
                schema: [
                    {name: 'entity', required: true, selector: {entity: {filter: {domain: 'vacuum'}}}},
                    {name: 'name', selector: {text: {}}},
                    {name: 'vendor', selector: {select: {mode: 'dropdown', options: Object.keys(vendors)}}},
                    {name: 'image', selector: {media: {accept: ['image/*'], clearable: true, image_upload: true, hide_content_type: true}}},
                ],
            };
        }

        static getConfigElement() {
            return document.createElement('xiaomi-vacuum-card-editor');
        }

        shouldUpdate(changedProps) {
            return changedProps.has('stateObj') || changedProps.has('config') || changedProps.has('_dropdown') || changedProps.has('_resolvedImage');
        }

        updated() {
            if (this._dropdown && this._dropdown.open) {
                this.renderRoot.querySelector('.xvc-option[active]')?.scrollIntoView({block: 'nearest'});
            }
        }

        setConfig(config) {
            if (!config.entity) throw new Error('Please define an entity.');
            const [domain, entityName] = config.entity.split('.');
            if (domain !== 'vacuum' || !entityName) throw new Error('Please define a vacuum entity.');
            if (config.vendor && !(config.vendor in vendors)) throw new Error('Please define a valid vendor.');

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
            if (image && typeof image === 'object') return image.media_content_id || '';
            return image || '';
        }

        getImageStyleUrl(image) {
            if (!image) return '';
            if (String(image).startsWith('media-source://')) return sanitizeStyleUrl(this._resolvedImage);
            return sanitizeStyleUrl(image);
        }

        getCardStyles(image, showName, showButtons) {
            const styleImage = this.getImageStyleUrl(image);
            return {
                background: styleImage ? `background-image: url("${styleImage}"); color: white; text-shadow: 0 0 10px black;` : '',
                icon: `color: ${styleImage ? 'white' : 'var(--state-icon-color, var(--secondary-text-color, #727272))'};`,
                content: `padding: ${showName ? '8px' : '16px'} 16px ${showButtons ? '8px' : '16px'};`,
            };
        }

        updateImageStyles() {
            if (!this.config) return;
            this.config = Object.assign({}, this.config, {
                styles: this.getCardStyles(this.config.image, this.config.show.name, this.config.show.buttons),
            });
        }

        resolveCardImage() {
            if (!this.config || !this._hass) return;
            const image = this.config.image;
            if (!image || !String(image).startsWith('media-source://')) {
                if (this._resolvedImage || this._resolvedImageSource) {
                    this._resolvedImage = '';
                    this._resolvedImageSource = '';
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
            this._resolvedImage = '';
            this._resolvedImageSource = image;
            this.updateImageStyles();
            this._hass.callWS({type: 'media_source/resolve_media', media_content_id: image}).then(result => {
                if (!this.config || this.config.image !== image) return;
                this._resolvedImage = result && result.url ? result.url : '';
                this.updateImageStyles();
            }).catch(() => {
                if (!this.config || this.config.image !== image) return;
                this._resolvedImage = '';
                this.updateImageStyles();
            });
        }

        getImageEntityId(image) {
            const prefix = 'media-source://image/';
            return String(image).startsWith(prefix) ? String(image).slice(prefix.length) : '';
        }

        getImageEntityUrl(entityId) {
            const stateObj = this._hass.states[entityId];
            if (!stateObj) return '';
            const token = stateObj.attributes && stateObj.attributes.access_token;
            return token ? `/api/image_proxy/${entityId}?token=${token}&state=${stateObj.state}` : '';
        }

        set hass(hass) {
            this._hass = hass;
            if (hass && this.config) {
                const nextStateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
                if (this._dropdown && nextStateObj && nextStateObj.attributes[this._dropdown.key] !== this._dropdown.committed) {
                    this._dropdown = null;
                }
                this.stateObj = nextStateObj;
                this.resolveCardImage();
            }
        }

        handleChange(mode, key, service) {
            if (!this.stateObj) return;
            this.callService(service || `vacuum.set_${key}`, {entity_id: this.stateObj.entity_id, [key]: mode});
        }

        async callService(service, data) {
            if (!this.stateObj || !service) return;
            const [domain, name] = service.split('.');
            let resolvedData = data ?? {entity_id: this.stateObj.entity_id};
            if (typeof data === 'string') {
                try {
                    const rendered = await this._hass.callWS({type: 'render_template', template: data});
                    const parsed = JSON.parse(rendered);
                    if (!parsed || typeof parsed !== 'object') {
                        console.error('[xiaomi-vacuum-card] service_data_template must return a JSON object, got:', rendered);
                        return;
                    }
                    resolvedData = Object.assign({}, parsed, {entity_id: this.stateObj.entity_id});
                } catch (e) {
                    console.error('[xiaomi-vacuum-card] Failed to render/parse service_data_template:', e);
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
            event.detail = {entityId: this.stateObj && this.stateObj.entity_id};
            this.dispatchEvent(event);
        }

        deepMerge(...sources) {
            const isObject = (obj) => obj && typeof obj === 'object';
            const target = {};

            sources.filter(source => isObject(source)).forEach(source => {
                Object.keys(source).forEach(key => {
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
                .editor { display: block; }
                ha-expansion-panel { margin-bottom: 8px; }
                h4 { margin: 16px 0 8px; }
                .row { border: 1px solid var(--divider-color, #e0e0e0); border-radius: 8px; margin: 8px 0; padding: 8px; }
                .row-title { align-items: center; display: flex; justify-content: space-between; margin-bottom: 4px; }
                .row-title span { font-weight: 500; }
                .service-data-header { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; width: 100%; }
                .service-data-mode { display: inline-flex; }
                .service-data-mode-button:first-child { --_button-start-end-radius: 0; --_button-end-end-radius: 0; }
                .service-data-mode-button:last-child { --_button-start-start-radius: 0; --_button-end-start-radius: 0; }
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
            this._expandedSections = Object.assign({}, this._expandedSections, { [key]: !this._expandedSections[key] });
        }

        render() {
            if (!this.hass || !this._model) return html``;
            return html`
                <div class="editor">
                    ${this.renderBasicSection()}
                    ${this.renderVisibilitySection()}
                    ${this.renderStateSection()}
                    ${this.renderAttributesSection()}
                    ${this.renderButtonsSection()}
                </div>
            `;
        }

        processData(config) {
            const data = Object.assign({}, config);
            if (typeof data.image === 'string') {
                data.image = {media_content_id: data.image};
            }
            return data;
        }

        configToEditorModel(config) {
            return {
                type: config.type,
                entity: config.entity,
                vendor: config.vendor,
                name: config.name === false ? '' : config.name,
                image: this.processData(config).image,
                show_name: config.name !== false,
                show_state: config.state !== false,
                show_attributes: config.attributes !== false,
                show_buttons: config.buttons !== false,
                state: this.entityDataRows('state', state, config.state),
                attributes: this.entityDataRows('attributes', attributes, config.attributes),
                buttons: this.buttonRows(config.buttons),
                extra: this.extraFields(config, ['type', 'entity', 'vendor', 'name', 'image', 'state', 'attributes', 'buttons']),
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

            this.assignEntityDataConfig(config, 'state', state, model.show_state, model.state);
            this.assignEntityDataConfig(config, 'attributes', attributes, model.show_attributes, model.attributes);
            this.assignButtonConfig(config, model.show_buttons, model.buttons);
            return config;
        }

        entityDataRows(group, defaults, configValue) {
            const configObject = configValue && typeof configValue === 'object' ? configValue : {};
            const ids = Object.keys(defaults).concat(Object.keys(configObject).filter(id => !(id in defaults)));
            return ids.map(id => {
                const defaultValue = defaults[id] || {};
                const override = configObject[id];
                const overrideObject = override && typeof override === 'object' ? override : {};
                const custom = !(id in defaults);
                return {
                    id,
                    group,
                    custom,
                    show: override === false ? false : overrideObject.show !== false,
                    key: this.configField(overrideObject, defaultValue, 'key', custom ? id : ''),
                    entity: this.configField(overrideObject, defaultValue, 'entity', ''),
                    icon: this.configField(overrideObject, defaultValue, 'icon', ''),
                    label: this.configField(overrideObject, defaultValue, 'label', ''),
                    label_kind: this.configField(overrideObject, defaultValue, 'service', '') ? 'accessible' : 'visible',
                    unit: this.configField(overrideObject, defaultValue, 'unit', ''),
                    extra: this.extraFields(overrideObject, ['key', 'entity', 'icon', 'label', 'unit', 'show']),
                };
            });
        }

        buttonRows(configValue) {
            const configObject = configValue && typeof configValue === 'object' ? configValue : {};
            const ids = Object.keys(buttons).concat(Object.keys(configObject).filter(id => !(id in buttons)));
            return ids.map(id => {
                const defaultValue = buttons[id] || {};
                const override = configObject[id];
                const overrideObject = override && typeof override === 'object' ? override : {};
                return {
                    id,
                    custom: !(id in buttons),
                    show: override === false ? false : (overrideObject.show !== undefined ? overrideObject.show !== false : defaultValue.show !== false),
                    icon: this.configField(overrideObject, defaultValue, 'icon', ''),
                    label: this.configField(overrideObject, defaultValue, 'label', ''),
                    service: this.configField(overrideObject, defaultValue, 'service', ''),
                    service_data_mode: overrideObject.service_data_mode || 'static',
                    service_data: overrideObject.service_data || {},
                    service_data_template: overrideObject.service_data_template || '',
                    extra: this.extraFields(overrideObject, ['icon', 'label', 'service', 'show', 'service_data_mode', 'service_data', 'service_data_template']),
                };
            });
        }

        configField(override, defaultValue, key, fallback) {
            return key in override ? override[key] : (key in defaultValue ? defaultValue[key] : fallback);
        }

        extraFields(config, knownKeys) {
            const extra = {};
            Object.keys(config).forEach(key => {
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
            rows.forEach(row => {
                const rowConfig = this.entityDataRowToConfig(row, defaults[row.id] || {});
                if (rowConfig !== undefined) groupConfig[row.id] = rowConfig;
            });
            if (Object.keys(groupConfig).length) config[name] = groupConfig;
        }

        entityDataRowToConfig(row, defaultValue) {
            const rowConfig = Object.assign({}, row.extra || {});
            ['key', 'entity', 'icon', 'label', 'unit'].forEach(key => {
                if (this.hasConfigChange(row[key], defaultValue[key])) rowConfig[key] = row[key];
            });
            if (row.custom && !rowConfig.key) rowConfig.key = row.key || row.id;
            if (!row.show) return Object.keys(rowConfig).length ? Object.assign({show: false}, rowConfig) : false;
            return Object.keys(rowConfig).length ? rowConfig : undefined;
        }

        assignButtonConfig(config, showGroup, rows) {
            if (showGroup === false) {
                config.buttons = false;
                return;
            }

            const buttonConfig = {};
            rows.forEach(row => {
                const rowConfig = this.buttonRowToConfig(row, buttons[row.id] || {});
                if (rowConfig !== undefined) buttonConfig[row.id] = rowConfig;
            });
            if (Object.keys(buttonConfig).length) config.buttons = buttonConfig;
        }

        buttonRowToConfig(row, defaultValue) {
            const rowConfig = Object.assign({}, row.extra || {});
            ['icon', 'label', 'service'].forEach(key => {
                if (this.hasConfigChange(row[key], defaultValue[key])) rowConfig[key] = row[key];
            });
            const mode = row.service_data_mode || 'static';
            if (mode === 'dynamic') {
                if (row.service_data_template && row.service_data_template.trim()) {
                    rowConfig.service_data_mode = 'dynamic';
                    rowConfig.service_data_template = row.service_data_template;
                }
            } else {
                if (row.service_data && typeof row.service_data === 'object' && Object.keys(row.service_data).length) {
                    rowConfig.service_data = row.service_data;
                }
            }
            if (!row.show) return Object.keys(rowConfig).length ? Object.assign({show: false}, rowConfig) : (defaultValue.show === false ? undefined : false);
            if (defaultValue.show === false) rowConfig.show = true;
            return Object.keys(rowConfig).length ? rowConfig : undefined;
        }

        hasConfigChange(value, defaultValue) {
            return value !== undefined && value !== '' && value !== defaultValue;
        }

        renderBasicSection() {
            return html`
                <ha-expansion-panel outlined .expanded=${this._expandedSections.basic} @expanded-changed=${ev => this._toggleSection('basic', ev)}>
                    <ha-icon slot="leading-icon" icon="mdi:tune-variant"></ha-icon>
                    <h3 slot="header">Basic</h3>
                    ${this.renderForm([
                        {name: 'entity', required: true, selector: {entity: {filter: {domain: 'vacuum'}}}},
                        {name: 'name', selector: {text: {}}},
                        {name: 'vendor', selector: {select: {mode: 'dropdown', options: Object.keys(vendors)}}},
                        {name: 'image', selector: {media: {accept: ['image/*'], clearable: true, image_upload: true, hide_content_type: true}}},
                    ], {
                        entity: this._model.entity,
                        name: this._model.name,
                        vendor: this._model.vendor,
                        image: this._model.image,
                    }, ev => this.updateBasic(ev))}
                </ha-expansion-panel>
            `;
        }

        renderVisibilitySection() {
            return html`
                <ha-expansion-panel outlined .expanded=${this._expandedSections.visibility} @expanded-changed=${ev => this._toggleSection('visibility', ev)}>
                    <ha-icon slot="leading-icon" icon="mdi:eye-outline"></ha-icon>
                    <h3 slot="header">Visibility</h3>
                    ${this.renderForm([
                        {name: 'show_name', selector: {boolean: {}}},
                        {name: 'show_state', selector: {boolean: {}}},
                        {name: 'show_attributes', selector: {boolean: {}}},
                        {name: 'show_buttons', selector: {boolean: {}}},
                    ], {
                        show_name: this._model.show_name,
                        show_state: this._model.show_state,
                        show_attributes: this._model.show_attributes,
                        show_buttons: this._model.show_buttons,
                    }, ev => this.updateVisibility(ev))}
                </ha-expansion-panel>
            `;
        }

        renderStateSection() {
            return html`
                <ha-expansion-panel outlined .expanded=${this._expandedSections.state} @expanded-changed=${ev => this._toggleSection('state', ev)}>
                    <ha-icon slot="leading-icon" icon="mdi:card-text-outline"></ha-icon>
                    <h3 slot="header">State</h3>
                    ${this._model.state.map((row, index) => this.renderEntityDataRow('state', row, index))}
                    <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow('state')}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add custom state
                    </ha-button>
                </ha-expansion-panel>
            `;
        }

        renderAttributesSection() {
            return html`
                <ha-expansion-panel outlined .expanded=${this._expandedSections.attributes} @expanded-changed=${ev => this._toggleSection('attributes', ev)}>
                    <ha-icon slot="leading-icon" icon="mdi:format-list-bulleted-type"></ha-icon>
                    <h3 slot="header">Attributes</h3>
                    ${this._model.attributes.map((row, index) => this.renderEntityDataRow('attributes', row, index))}
                    <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow('attributes')}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add custom attribute
                    </ha-button>
                </ha-expansion-panel>
            `;
        }

        renderButtonsSection() {
            return html`
                <ha-expansion-panel outlined .expanded=${this._expandedSections.buttons} @expanded-changed=${ev => this._toggleSection('buttons', ev)}>
                    <ha-icon slot="leading-icon" icon="mdi:gesture-tap-button"></ha-icon>
                    <h3 slot="header">Buttons</h3>
                    ${this._model.buttons.map((row, index) => this.renderButtonRow(row, index))}
                    <ha-button appearance="filled" size="s" @click=${() => this.addCustomRow('buttons')}>
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
                        ${row.custom ? html`
                            <ha-button appearance="filled" variant="danger" size="s" @click=${() => this.removeCustomRow(group, index)}>
                                <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                                Remove
                            </ha-button>
                        ` : ''}
                    </div>
                    ${this.renderForm(this.entityDataRowSchema(row), row, ev => this.updateRow(group, index, ev))}
                </div>
            `;
        }

        entityDataRowSchema(row) {
            const entityState = this.hass && this._model && this._model.entity ? this.hass.states[this._model.entity] : null;
            const hasDynamicBatteryIcon = row.key === 'battery_level' && entityState && 'battery_icon' in entityState.attributes;
            return [
                ...(row.custom ? [{name: 'id', selector: {text: {}}}] : []),
                {name: 'show', selector: {boolean: {}}},
                {name: 'key', selector: {text: {}}},
                {name: 'entity', selector: {entity: {}}},
                ...(hasDynamicBatteryIcon ? [] : [{name: 'icon', selector: {icon: {}}}]),
                {name: 'label', label: row.label_kind === 'accessible' ? 'Accessible label' : 'Visible label', selector: {text: {}}},
                {name: 'unit', selector: {text: {}}},
            ];
        }

        renderButtonRow(row, index) {
            const serviceDataMode = row.service_data_mode || 'static';
            const dataSchema = serviceDataMode !== 'dynamic'
                ? [{name: 'service_data', label: '', selector: {object: {}}}]
                : [{name: 'service_data_template', label: '', selector: {template: {}}}];
            const dataModel = serviceDataMode !== 'dynamic'
                ? {service_data: row.service_data}
                : {service_data_template: row.service_data_template};
            return html`
                <div class="row">
                    <div class="row-title">
                        <span>${row.id}</span>
                        ${row.custom ? html`
                            <ha-button appearance="filled" variant="danger" size="s" @click=${() => this.removeCustomRow('buttons', index)}>
                                <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                                Remove
                            </ha-button>
                        ` : ''}
                    </div>
                    ${this.renderForm(this.buttonRowSchema(row), row, ev => this.updateRow('buttons', index, ev))}
                    <ha-expansion-panel outlined>
                        <div slot="header" class="service-data-header">
                            <span>Service data</span>
                            <div class="service-data-mode">
                                <ha-button
                                    class="service-data-mode-button"
                                    size="s"
                                    variant="brand"
                                    appearance=${serviceDataMode === 'static' ? 'accent' : 'filled'}
                                    @mousedown=${ev => ev.stopPropagation()}
                                    @click=${ev => this.updateServiceDataMode(index, 'static', ev)}
                                >Static</ha-button>
                                <ha-button
                                    class="service-data-mode-button"
                                    size="s"
                                    variant="brand"
                                    appearance=${serviceDataMode === 'dynamic' ? 'accent' : 'filled'}
                                    @mousedown=${ev => ev.stopPropagation()}
                                    @click=${ev => this.updateServiceDataMode(index, 'dynamic', ev)}
                                >Dynamic</ha-button>
                            </div>
                        </div>
                        ${this.renderForm(dataSchema, dataModel, ev => this.updateRow('buttons', index, ev))}
                    </ha-expansion-panel>
                </div>
            `;
        }

        buttonRowSchema(row) {
            return [
                ...(row.custom ? [{name: 'id', selector: {text: {}}}] : []),
                {name: 'show', selector: {boolean: {}}},
                {name: 'icon', selector: {icon: {}}},
                {name: 'label', label: 'Tooltip', selector: {text: {}}},
                {name: 'service', selector: {text: {}}},
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
            return 'label' in schema ? schema.label : schema.name;
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
            const panel = ev && ev.currentTarget && ev.currentTarget.closest('ha-expansion-panel');
            if (panel && panel.expanded !== true) panel.expanded = true;
            const rows = this._model.buttons.slice();
            rows[index] = Object.assign({}, rows[index], {service_data_mode: mode || 'static'});
            this._model = Object.assign({}, this._model, {buttons: rows});
            this.dispatchModelConfig();
        }

        updateRow(group, index, ev) {
            const rows = this._model[group].slice();
            rows[index] = Object.assign({}, rows[index], ev.detail.value);
            if (rows[index].custom) {
            const prefixes = {buttons: 'custom_button', attributes: 'custom_attribute', state: 'custom_state'};
            const prefix = prefixes[group];
            if (rows[index].entity && rows[index].id.startsWith(prefix)) {
                    rows[index].id = rows[index].entity.split('.').pop().replace(/[^a-z0-9_]/gi, '_');
                } else {
                    rows[index].id = this.normalizeCustomId(rows[index].id, prefix);
                }
            }
            this._model = Object.assign({}, this._model, {[group]: rows});
            this.dispatchModelConfig();
        }

        addCustomRow(group) {
            const rows = this._model[group].slice();
            const prefixes = {buttons: 'custom_button', attributes: 'custom_attribute', state: 'custom_state'};
            const id = this.nextCustomId(rows, prefixes[group]);
            rows.push(group === 'buttons'
                ? {id, custom: true, show: true, icon: '', label: '', service: '', service_data_mode: 'static', service_data: {}, service_data_template: '', extra: {}}
                : {id, group, custom: true, show: true, key: id, entity: '', icon: '', label: '', unit: '', extra: {}});
            this._model = Object.assign({}, this._model, {[group]: rows});
            this.dispatchModelConfig();
        }

        removeCustomRow(group, index) {
            const rows = this._model[group].slice();
            rows.splice(index, 1);
            this._model = Object.assign({}, this._model, {[group]: rows});
            this.dispatchModelConfig();
        }

        nextCustomId(rows, base) {
            const ids = new Set(rows.map(row => row.id));
            let id = base;
            let index = 2;
            while (ids.has(id)) id = `${base}_${index++}`;
            return id;
        }

        normalizeCustomId(value, fallback) {
            return String(value || fallback).trim().replace(/[^a-zA-Z0-9_]+/g, '_') || fallback;
        }

        dispatchModelConfig() {
            this.dispatchConfig(this.editorModelToConfig(this._model));
        }

        valueChanged(ev) {
            this.dispatchConfig(this.editorModelToConfig(this.configToEditorModel(ev.detail.value)));
        }

        dispatchConfig(config) {
            this.dispatchEvent(new CustomEvent('config-changed', {
                bubbles: true,
                composed: true,
                detail: {config},
            }));
        }

        cleanImageConfig(image) {
            if (!image) return undefined;
            if (typeof image === 'string') return image || undefined;
            if (typeof image !== 'object') return undefined;

            const clean = {};
            Object.keys(image).forEach(key => {
                if (!/^\d+$/.test(key) && image[key] !== undefined) clean[key] = image[key];
            });

            const mediaContentId = clean.media_content_id;
            if (!mediaContentId) return undefined;
            return String(mediaContentId).startsWith('media-source://') ? clean : mediaContentId;
        }
    }

    customElements.define('xiaomi-vacuum-card-editor', XiaomiVacuumCardEditor);
    customElements.define('xiaomi-vacuum-card', XiaomiVacuumCard);

    window.customCards = window.customCards || [];
    if (!window.customCards.some(c => c.type === 'xiaomi-vacuum-card')) {
        window.customCards.push({
            type: 'xiaomi-vacuum-card',
            name: 'Xiaomi Vacuum Card',
            description: 'Card for Xiaomi/Roborock/iRobot/Ecovacs vacuum cleaners',
            preview: true,
            documentationURL: 'https://github.com/3ative/lovelace-xiaomi-vacuum-card',
            getEntitySuggestion: (hass, entityId) => entityId.split('.')[0] === 'vacuum'
                ? {config: {type: 'custom:xiaomi-vacuum-card', entity: entityId}}
                : null,
        });
    }
})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view")));
