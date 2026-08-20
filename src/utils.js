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
