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
        if (trimmed.includes('..')) return '';
        if (/(%2e){2}/i.test(trimmed)) return '';
        return /^(https?:\/\/|\/local\/|\/hacsfiles\/|local\/)[\w\-./?=&#%+:@!~]+$/.test(trimmed) ? trimmed : '';
    };

    class XiaomiVacuumCard extends LitElement {

        static get properties() {
            return {
                _hass: {},
                config: {},
                stateObj: {},
                _dropdown: {},
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
  text-align: left;
  font-size: 1.1em;
  padding-left: 10px;
  border-left: 2px solid var(--primary-color, #03a9f4);
}
.grid-right {
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
  position: relative;
  background: transparent;
  color: inherit;
  border: 0;
  border-bottom: 1px solid currentColor;
  border-radius: 0;
  padding: 2px 18px 2px 4px;
  font: inherit;
  line-height: inherit;
  cursor: pointer;
  margin-left: 4px;
  max-width: 100%;
}
.xvc-select::after {
  content: "";
  position: absolute;
  right: 6px;
  top: 50%;
  margin-top: -2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  pointer-events: none;
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
                  ${Object.values(this.config.state).filter(v => v).map(this.renderAttribute.bind(this))}
                </div>` : null}
                ${this.config.show.attributes ? html`
                <div class="grid-content grid-right">
                  ${Object.values(this.config.attributes).filter(v => v).map(this.renderAttribute.bind(this))}
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
            const isValidSensorData = data && `${this.config.sensorEntity}_${data.key}` in this._hass.states;
            const isValidAttribute = data && data.key in this.stateObj.attributes;
            const isValidEntityData = data && data.key in this.stateObj;

            const value = isValidSensorData
                ? formatValue(this._hass.states[`${this.config.sensorEntity}_${data.key}`].state)
                : isValidAttribute
                    ? formatValue(this.stateObj.attributes[data.key])
                    : isValidEntityData
                        ? formatValue(this.stateObj[data.key])
                        : null;
            const attribute = html`<div>
                ${data.icon && this.renderIcon(data)}
                ${(data.label || '') + (value !== null ? value : this._hass.localize('state.default.unavailable'))}
            </div>`;

            const list = this.stateObj.attributes[`${data.key}_list`];
            const hasDropdown = Array.isArray(list);

            if (hasDropdown && value !== null) {
                const icon = data.icon ? this.renderIcon(data) : null;
                return this.renderDropdown(icon, data.key, data.service, data.label);
            }
            return attribute;
        }

        renderIcon(data) {
            const icon = (data.key === 'battery_level' && 'battery_icon' in this.stateObj.attributes)
                ? this.stateObj.attributes.battery_icon
                : data.icon;
            return html`<ha-icon icon="${icon}" style="margin-right: 10px; ${this.config.styles.icon}"></ha-icon>`;
        }

        renderButton(data) {
            return data && data.show !== false
                ? html`<ha-icon-button
                    @click="${() => this.callService(data.service, data.service_data)}"
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
            const listboxId = `xvc-list-${key}`;
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
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this._dropdown = null;
            }
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

        shouldUpdate(changedProps) {
            return changedProps.has('stateObj') || changedProps.has('config') || changedProps.has('_dropdown');
        }

        setConfig(config) {
            if (!config.entity) throw new Error('Please define an entity.');
            if (config.entity.split('.')[0] !== 'vacuum') throw new Error('Please define a vacuum entity.');
            if (config.vendor && !(config.vendor in vendors)) throw new Error('Please define a valid vendor.');

            const vendor = vendors[config.vendor] || vendors.xiaomi;
            const image = config.image ? sanitizeStyleUrl(config.image) : '';

            this.config = {
                name: config.name,
                entity: config.entity,
                sensorEntity: `sensor.${config.entity.split('.')[1]}`,
                show: {
                    name: config.name !== false,
                    state: config.state !== false,
                    attributes: config.attributes !== false,
                    buttons: config.buttons !== false,
                },
                buttons: this.deepMerge(buttons, vendor.buttons, config.buttons),
                state: this.deepMerge(state, vendor.state, config.state),
                attributes: this.deepMerge(attributes, vendor.attributes, config.attributes),
                styles: {
                    background: image ? `background-image: url("${image}"); color: white; text-shadow: 0 0 10px black;` : '',
                    icon: `color: ${image ? 'white' : 'var(--state-icon-color, var(--secondary-text-color, #727272))'};`,
                    content: `padding: ${config.name !== false ? '8px' : '16px'} 16px ${config.buttons !== false ? '8px' : '16px'};`,
                },
            };
        }

        set hass(hass) {
            if (hass && this.config) {
                const nextStateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
                if (this._dropdown && nextStateObj && nextStateObj.attributes[this._dropdown.key] !== this._dropdown.committed) {
                    this._dropdown = null;
                }
                this.stateObj = nextStateObj;
            }
            this._hass = hass;
        }

        handleChange(mode, key, service) {
            if (!this.stateObj) return;
            this.callService(service || `vacuum.set_${key}`, {entity_id: this.stateObj.entity_id, [key]: mode});
        }

        callService(service, data) {
            if (!this.stateObj || !service) return;
            const [domain, name] = service.split('.');
            this._hass.callService(domain, name, data ?? {entity_id: this.stateObj.entity_id});
        }

        fireEvent(type, options = {}) {
            const event = new Event(type, {
                bubbles: options.bubbles !== false,
                cancelable: options.cancelable !== false,
                composed: options.composed !== false,
            });
            event.detail = {entityId: this.stateObj.entity_id};
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

    customElements.define('xiaomi-vacuum-card', XiaomiVacuumCard);
})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view")));
