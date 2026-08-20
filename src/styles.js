import { css } from "./lit.js";
import { DEFAULT_BUTTONS_DISABLED_OPACITY } from "./constants.js";
export const cardStyles = css`
  .background {
    position: relative;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
  }
  .scrim {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 96px;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.55) 35%,
      rgba(0, 0, 0, 0.2) 70%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
    border-bottom-left-radius: var(--ha-card-border-radius, 12px);
    border-bottom-right-radius: var(--ha-card-border-radius, 12px);
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
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }
  .flex ha-icon-button {
    color: inherit;
    --ha-icon-button-color: inherit;
    --mdc-icon-button-color: inherit;
  }
  .flex ha-icon-button > ha-icon,
  .flex ha-icon-button > ha-svg-icon {
    display: flex;
    color: inherit;
    fill: currentColor;
  }
  .has-image .flex ha-icon-button > ha-icon,
  .has-image .flex ha-icon-button > ha-svg-icon,
  .has-scrim .flex ha-icon-button > ha-icon,
  .has-scrim .flex ha-icon-button > ha-svg-icon {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.6));
  }
  .grid {
    position: relative;
    z-index: 4;
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
    z-index: 5;
    width: max-content;
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
    opacity: var(
      --xvc-disabled-opacity,
      var(--disabled-opacity, ${DEFAULT_BUTTONS_DISABLED_OPACITY})
    );
    --ha-icon-button-disabled-color: inherit !important;
    --mdc-icon-button-color: inherit !important;
    --mdc-theme-text-disabled-on-light: inherit !important;
    --mdc-theme-text-disabled-on-dark: inherit !important;
    cursor: not-allowed;
    pointer-events: none;
  }
  ha-icon-button[disabled] > ha-icon,
  ha-icon-button[disabled] > ha-svg-icon {
    color: inherit !important;
    fill: currentColor !important;
  }
  .has-image ha-icon-button[disabled] > ha-icon,
  .has-image ha-icon-button[disabled] > ha-svg-icon,
  .has-scrim ha-icon-button[disabled] > ha-icon,
  .has-scrim ha-icon-button[disabled] > ha-svg-icon {
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.95));
  }
`;

export const editorStyles = css`
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
