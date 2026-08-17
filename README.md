# Xiaomi Vacuum Card

Maintained fork of the unsupported [benct/lovelace-xiaomi-vacuum-card](https://github.com/benct/lovelace-xiaomi-vacuum-card), updated for modern Home Assistant versions and direct HACS/browser loading.

## Changes from upstream

- **Fixed fan speed control**: Home Assistant 2026.02+ removed the `mwc-menu` and `mwc-list-item` web components that the original card relied on. This fork uses a dependency-free custom dropdown with keyboard support, labelled actions, safer blur handling, and no dependency on removed HA internals.
- **Added modern HA card picker support**: the card registers `window.customCards` metadata, preview support, vacuum entity suggestions, `getStubConfig()`, and sections-view grid sizing.
- **Added GUI configuration support**: Home Assistant can configure the card through `getConfigForm()` and a custom `getConfigElement()` editor using the same `ha-form` pattern as standard HA cards, including visibility controls, custom state/attribute/button rows, entity-backed values, and static or template-based button service data.
- **Added modern media image handling**: uploaded images and media sources such as `media-source://image_upload/...`, `media-source://media_source/...`, and `media-source://image/<entity_id>` are resolved for card backgrounds.
- **Hardened rendering and configuration**: image URLs are sanitized before use in inline CSS, encoded traversal is blocked, vendor/entity validation is stricter, unavailable values are handled more safely, and modern HA theme variables are supported.

## Installation

### HACS (Custom Repository)

1. Open HACS in Home Assistant.
2. Click the three dots menu (top right) and select **Custom repositories**.
3. Add repository URL `https://github.com/Zuz666/lovelace-xiaomi-vacuum-card` with category **Dashboard**.
4. Search for "Xiaomi Vacuum Card" and install.

### Manual

1. Download `xiaomi-vacuum-card.js` from the [latest release](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/releases/latest).
2. Place it in `www/community/lovelace-xiaomi-vacuum-card/`.
3. Add the resource in Settings > Dashboards > Resources:
   - URL: `/hacsfiles/lovelace-xiaomi-vacuum-card/xiaomi-vacuum-card.js`
   - Type: JavaScript Module

## Configuration

See the [original documentation](https://github.com/benct/lovelace-xiaomi-vacuum-card#readme) for configuration options.

## Supported vendors

xiaomi, xiaomi_mi, valetudo, roomba, robovac, ecovacs, deebot, deebot_slim, neato
