import { DEFAULT_BUTTONS_MODE, DEFAULT_SCRIM } from "./constants.js";
export const sanitizeStyleUrl = (value) => {
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

export const parseOpacity = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.min(Math.max(parsed, 0), 1);
};

export const resolveButtonsDisabledOpacity = (config) => {
  if (!config || typeof config !== "object") return undefined;
  const modern = parseOpacity(config.buttons_disabled_opacity);
  if (modern !== undefined) return modern;
  const legacy = parseOpacity(config.disabled_opacity);
  if (legacy !== undefined) return legacy;
  return undefined;
};

export const resolveScrim = (config) => {
  if (!config || typeof config !== "object") return DEFAULT_SCRIM;
  if (config.scrim === true || config.scrim === "true") return "true";
  if (config.scrim === false || config.scrim === "false") return "false";
  return DEFAULT_SCRIM;
};

export const resolveButtonsMode = (config) => {
  if (!config || typeof config !== "object") return DEFAULT_BUTTONS_MODE;
  if (
    config.buttons_mode === "adaptive" ||
    config.buttons_mode === "compact" ||
    config.buttons_mode === "always_active"
  ) {
    return config.buttons_mode;
  }
  if (config.buttons_state_aware === false || config.state_aware_buttons === false) {
    return "always_active";
  }
  return DEFAULT_BUTTONS_MODE;
};
