# Xiaomi Vacuum Card

Fork of [benct/lovelace-xiaomi-vacuum-card](https://github.com/benct/lovelace-xiaomi-vacuum-card) with fixes for modern Home Assistant versions.

## Changes from upstream

- **Fixed fan speed dropdown** — Home Assistant 2026.02+ removed the `mwc-menu` and `mwc-list-item` web components that the original card relied on. The dropdown has been replaced with a native HTML `<select>` element that has no dependency on HA internal frontend components.

## Installation

### HACS (Custom Repository)

1. Open HACS in Home Assistant
2. Click the three dots menu (top right) and select **Custom repositories**
3. Add this repository URL with category **Dashboard**
4. Search for "Xiaomi Vacuum Card" and install

### Manual

1. Download `xiaomi-vacuum-card.js` from the [latest release](../../releases/latest)
2. Place it in `www/community/lovelace-xiaomi-vacuum-card/`
3. Add the resource in Settings > Dashboards > Resources:
   - URL: `/hacsfiles/lovelace-xiaomi-vacuum-card/xiaomi-vacuum-card.js`
   - Type: JavaScript Module

## Configuration

See the [original documentation](https://github.com/benct/lovelace-xiaomi-vacuum-card#readme) for configuration options.

## Supported vendors

xiaomi, xiaomi_mi, valetudo, roomba, robovac, ecovacs, deebot, deebot_slim, neato
