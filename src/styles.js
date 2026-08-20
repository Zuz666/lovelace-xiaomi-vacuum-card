import { css } from "./lit.js";

export const cardStyles = css`
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
    opacity: var(--xvc-disabled-opacity, var(--disabled-opacity, 0.55));
    filter: grayscale(100%);
    cursor: not-allowed;
    pointer-events: none;
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
