export const VERSION = "4.6.4";

export const state = {
  status: {
    key: "status",
    icon: "mdi:robot-vacuum",
  },
  battery: {
    key: "battery_level",
    unit: "%",
    icon: "mdi:battery-charging-80",
  },
  mode: {
    key: "fan_speed",
    icon: "mdi:fan",
    service: "vacuum.set_fan_speed",
  },
};

export const attributes = {
  main_brush: {
    key: "main_brush_left",
    label: "Main Brush: ",
    unit: " h",
  },
  side_brush: {
    key: "side_brush_left",
    label: "Side Brush: ",
    unit: " h",
  },
  filter: {
    key: "filter_left",
    label: "Filter: ",
    unit: " h",
  },
  sensor: {
    key: "sensor_dirty_left",
    label: "Sensor: ",
    unit: " h",
  },
};

export const VACUUM_FEATURES = {
  TURN_ON: 1,
  TURN_OFF: 2,
  PAUSE: 4,
  STOP: 8,
  RETURN_HOME: 16,
  FAN_SPEED: 32,
  STATUS: 128,
  SEND_COMMAND: 256,
  LOCATE: 512,
  CLEAN_SPOT: 1024,
  MAP: 2048,
  STATE: 4096,
  START: 8192,
  CLEAN_AREA: 16384,
};

export const SERVICE_TO_FEATURE = {
  "vacuum.start": VACUUM_FEATURES.START,
  "vacuum.pause": VACUUM_FEATURES.PAUSE,
  "vacuum.stop": VACUUM_FEATURES.STOP,
  "vacuum.return_to_base": VACUUM_FEATURES.RETURN_HOME,
  "vacuum.locate": VACUUM_FEATURES.LOCATE,
  "vacuum.clean_spot": VACUUM_FEATURES.CLEAN_SPOT,
};

export const buttons = {
  start: {
    label: "Start",
    icon: "mdi:play",
    service: "vacuum.start",
  },
  pause: {
    label: "Pause",
    icon: "mdi:pause",
    service: "vacuum.pause",
  },
  stop: {
    label: "Stop",
    icon: "mdi:stop",
    service: "vacuum.stop",
  },
  spot: {
    label: "Clean Spot",
    icon: "mdi:broom",
    service: "vacuum.clean_spot",
  },
  locate: {
    label: "Locate",
    icon: "mdi:map-marker",
    service: "vacuum.locate",
  },
  return: {
    label: "Return to Base",
    icon: "mdi:home-map-marker",
    service: "vacuum.return_to_base",
  },
};

export const compute = {
  trueFalse: (v) => (v === true ? "Yes" : v === false ? "No" : "-"),
  divide100: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n / 100) : "-";
  },
  secToHour: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.floor(n / 60 / 60) : "-";
  },
};

export const vendors = {
  xiaomi: {
    attributes: {
      main_brush: { compute: compute.secToHour },
      side_brush: { compute: compute.secToHour },
      filter: { compute: compute.secToHour },
      sensor: { compute: compute.secToHour },
    },
  },
  xiaomi_mi: {
    attributes: {
      main_brush: { key: "main_brush_hours" },
      side_brush: { key: "side_brush_hours" },
      filter: { key: "hypa_hours" },
      sensor: {
        key: "mop_hours",
        label: "Mop: ",
      },
    },
  },
  valetudo: {
    state: {
      status: { key: "state" },
    },
    attributes: {
      main_brush: { key: "mainBrush" },
      side_brush: { key: "sideBrush" },
      filter: { key: "filter" },
      sensor: { key: "sensor" },
    },
  },
  roomba: {
    attributes: {
      main_brush: false,
      side_brush: false,
      filter: false,
      sensor: false,
      bin_present: {
        key: "bin_present",
        label: "Bin Present: ",
        compute: compute.trueFalse,
      },
      bin_full: {
        key: "bin_full",
        label: "Bin Full: ",
        compute: compute.trueFalse,
      },
    },
  },
  robovac: {
    attributes: false,
    buttons: {
      stop: { show: false },
      spot: { show: true },
    },
  },
  ecovacs: {
    attributes: false,
    buttons: {
      start: { service: "vacuum.turn_on" },
      pause: { service: "vacuum.stop" },
      stop: { service: "vacuum.turn_off", show: false },
      spot: { show: true },
    },
  },
  deebot: {
    buttons: {
      start: { service: "vacuum.turn_on" },
      pause: { service: "vacuum.stop" },
      stop: { service: "vacuum.turn_off" },
    },
    attributes: {
      main_brush: {
        key: "component_main_brush",
        compute: compute.divide100,
      },
      side_brush: {
        key: "component_side_brush",
        compute: compute.divide100,
      },
      filter: {
        key: "component_filter",
        compute: compute.divide100,
      },
      sensor: false,
    },
  },
  deebot_slim: {
    buttons: {
      start: { service: "vacuum.turn_on" },
      pause: { service: "vacuum.stop" },
      stop: { service: "vacuum.turn_off" },
    },
    attributes: {
      main_brush: false,
      side_brush: { key: "component_side_brush" },
      filter: { key: "component_filter" },
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
        key: "clean_area",
        label: "Cleaned area: ",
        unit: " m2",
      },
    },
  },
};
