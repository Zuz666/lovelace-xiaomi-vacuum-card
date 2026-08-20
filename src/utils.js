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
