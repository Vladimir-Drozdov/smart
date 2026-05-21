// node_modules/@formatjs/intl-utils/lib/src/diff.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var MS_PER_SECOND = 1e3;
var SECS_PER_MIN = 60;
var SECS_PER_HOUR = SECS_PER_MIN * 60;
var SECS_PER_DAY = SECS_PER_HOUR * 24;
var SECS_PER_WEEK = SECS_PER_DAY * 7;
function selectUnit(from, to, thresholds) {
  if (to === void 0) {
    to = Date.now();
  }
  if (thresholds === void 0) {
    thresholds = {};
  }
  var resolvedThresholds = __assign(__assign({}, DEFAULT_THRESHOLDS), thresholds || {});
  var secs = (+from - +to) / MS_PER_SECOND;
  if (Math.abs(secs) < resolvedThresholds.second) {
    return {
      value: Math.round(secs),
      unit: "second"
    };
  }
  var mins = secs / SECS_PER_MIN;
  if (Math.abs(mins) < resolvedThresholds.minute) {
    return {
      value: Math.round(mins),
      unit: "minute"
    };
  }
  var hours = secs / SECS_PER_HOUR;
  if (Math.abs(hours) < resolvedThresholds.hour) {
    return {
      value: Math.round(hours),
      unit: "hour"
    };
  }
  var days = secs / SECS_PER_DAY;
  if (Math.abs(days) < resolvedThresholds.day) {
    return {
      value: Math.round(days),
      unit: "day"
    };
  }
  var fromDate = new Date(from);
  var toDate = new Date(to);
  var years = fromDate.getFullYear() - toDate.getFullYear();
  if (Math.round(Math.abs(years)) > 0) {
    return {
      value: Math.round(years),
      unit: "year"
    };
  }
  var months = years * 12 + fromDate.getMonth() - toDate.getMonth();
  if (Math.round(Math.abs(months)) > 0) {
    return {
      value: Math.round(months),
      unit: "month"
    };
  }
  var weeks = secs / SECS_PER_WEEK;
  return {
    value: Math.round(weeks),
    unit: "week"
  };
}
var DEFAULT_THRESHOLDS = {
  second: 45,
  minute: 45,
  hour: 22,
  day: 5
};

// node_modules/custom-card-helpers/dist/index.m.js
var applyThemesOnElement = (element, themes, localTheme, updateMeta = false) => {
  if (!element._themes) {
    element._themes = {};
  }
  let themeName = themes.default_theme;
  if (localTheme === "default" || localTheme && themes.themes[localTheme]) {
    themeName = localTheme;
  }
  const styles = Object.assign({}, element._themes);
  if (themeName !== "default") {
    const theme = themes.themes[themeName];
    Object.keys(theme).forEach((key) => {
      const prefixedKey = "--" + key;
      element._themes[prefixedKey] = "";
      styles[prefixedKey] = theme[key];
    });
  }
  if (element.updateStyles) {
    element.updateStyles(styles);
  } else if (window.ShadyCSS) {
    window.ShadyCSS.styleSubtree(
      /** @type {!HTMLElement} */
      element,
      styles
    );
  }
  if (!updateMeta) {
    return;
  }
  const meta = document.querySelector("meta[name=theme-color]");
  if (meta) {
    if (!meta.hasAttribute("default-content")) {
      meta.setAttribute("default-content", meta.getAttribute("content"));
    }
    const themeColor = styles["--primary-color"] || meta.getAttribute("default-content");
    meta.setAttribute("content", themeColor);
  }
};
var computeCardSize = (card) => {
  return typeof card.getCardSize === "function" ? card.getCardSize() : 4;
};
function computeDomain(entityId) {
  return entityId.substr(0, entityId.indexOf("."));
}
function computeEntity(entityId) {
  return entityId.substr(entityId.indexOf(".") + 1);
}
var DOMAIN_ICONS = {
  light: "mdi:lightbulb",
  switch: "mdi:toggle-switch",
  sensor: "mdi:gauge",
  binary_sensor: "mdi:checkbox-marked-circle",
  climate: "mdi:thermostat",
  cover: "mdi:window-shutter",
  fan: "mdi:fan",
  lock: "mdi:lock",
  media_player: "mdi:cast",
  vacuum: "mdi:robot-vacuum",
  camera: "mdi:camera",
  person: "mdi:account",
  device_tracker: "mdi:account-circle",
  sun: "mdi:white-balance-sunny",
  weather: "mdi:weather-cloudy"
};
var computeIcon = (stateObj, icon) => {
  if (icon) {
    return icon;
  }
  if (stateObj.attributes.icon) {
    return stateObj.attributes.icon;
  }
  const domain = stateObj.entity_id.split(".")[0];
  return DOMAIN_ICONS[domain] || "mdi:bookmark";
};
var computeName = (stateObj) => stateObj.attributes.friendly_name || stateObj.entity_id;
function computeRTL(hass) {
  var _a;
  const lang = ((_a = hass === null || hass === void 0 ? void 0 : hass.locale) === null || _a === void 0 ? void 0 : _a.language) || "en";
  if (hass.translationMetadata.translations[lang]) {
    return hass.translationMetadata.translations[lang].isRTL || false;
  }
  return false;
}
function computeRTLDirection(hass) {
  return computeRTL(hass) ? "rtl" : "ltr";
}
var CAP_STATE = [
  "on",
  "off",
  "open",
  "closed",
  "locked",
  "unlocked"
];
var computeState = (stateObj) => {
  const state = stateObj.state;
  const unit = stateObj.attributes.unit_of_measurement;
  if (unit) {
    return `${state} ${unit}`;
  }
  if (CAP_STATE.includes(state)) {
    return state.charAt(0).toUpperCase() + state.slice(1);
  }
  return state;
};
var NumberFormat;
(function(NumberFormat2) {
  NumberFormat2["language"] = "language";
  NumberFormat2["system"] = "system";
  NumberFormat2["comma_decimal"] = "comma_decimal";
  NumberFormat2["decimal_comma"] = "decimal_comma";
  NumberFormat2["space_comma"] = "space_comma";
  NumberFormat2["none"] = "none";
})(NumberFormat || (NumberFormat = {}));
var TimeFormat;
(function(TimeFormat2) {
  TimeFormat2["language"] = "language";
  TimeFormat2["system"] = "system";
  TimeFormat2["am_pm"] = "12";
  TimeFormat2["twenty_four"] = "24";
})(TimeFormat || (TimeFormat = {}));
var useAmPm = (locale) => {
  if (locale.time_format === TimeFormat.language || locale.time_format === TimeFormat.system) {
    const testLanguage = locale.time_format === TimeFormat.language ? locale.language : void 0;
    const test = (/* @__PURE__ */ new Date()).toLocaleString(testLanguage);
    return test.includes("AM") || test.includes("PM");
  }
  return locale.time_format === TimeFormat.am_pm;
};
var formatDateTime = (dateObj, locale) => formatDateTimeMem(locale).format(dateObj);
var formatDateTimeMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: useAmPm(locale) ? "numeric" : "2-digit",
  minute: "2-digit",
  hour12: useAmPm(locale)
});
var formatDateTimeWithSeconds = (dateObj, locale) => formatDateTimeWithSecondsMem(locale).format(dateObj);
var formatDateTimeWithSecondsMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: useAmPm(locale) ? "numeric" : "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: useAmPm(locale)
});
var formatDateTimeNumeric = (dateObj, locale) => formatDateTimeNumericMem(locale).format(dateObj);
var formatDateTimeNumericMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: useAmPm(locale)
});
var formatDateWeekday = (dateObj, locale) => formatDateWeekdayMem(locale).format(dateObj);
var formatDateWeekdayMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  weekday: "long",
  month: "long",
  day: "numeric"
});
var formatDate = (dateObj, locale) => formatDateMem(locale).format(dateObj);
var formatDateMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric",
  month: "long",
  day: "numeric"
});
var formatDateNumeric = (dateObj, locale) => formatDateNumericMem(locale).format(dateObj);
var formatDateNumericMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric",
  month: "numeric",
  day: "numeric"
});
var formatDateShort = (dateObj, locale) => formatDateShortMem(locale).format(dateObj);
var formatDateShortMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  day: "numeric",
  month: "short"
});
var formatDateMonthYear = (dateObj, locale) => formatDateMonthYearMem(locale).format(dateObj);
var formatDateMonthYearMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  month: "long",
  year: "numeric"
});
var formatDateMonth = (dateObj, locale) => formatDateMonthMem(locale).format(dateObj);
var formatDateMonthMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  month: "long"
});
var formatDateYear = (dateObj, locale) => formatDateYearMem(locale).format(dateObj);
var formatDateYearMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  year: "numeric"
});
var formatTime = (dateObj, locale) => formatTimeMem(locale).format(dateObj);
var formatTimeMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  hour: "numeric",
  minute: "2-digit",
  hour12: useAmPm(locale)
});
var formatTimeWithSeconds = (dateObj, locale) => formatTimeWithSecondsMem(locale).format(dateObj);
var formatTimeWithSecondsMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  hour: useAmPm(locale) ? "numeric" : "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: useAmPm(locale)
});
var formatTimeWeekday = (dateObj, locale) => formatTimeWeekdayMem(locale).format(dateObj);
var formatTimeWeekdayMem = (locale) => new Intl.DateTimeFormat(locale.language, {
  hour: useAmPm(locale) ? "numeric" : "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: useAmPm(locale)
});
function computeStateDomain(stateObj) {
  return computeDomain(stateObj.entity_id);
}
var isNumericState = (stateObj) => !!stateObj.attributes.unit_of_measurement || !!stateObj.attributes.state_class;
var numberFormatToLocale = (localeOptions) => {
  switch (localeOptions.number_format) {
    case NumberFormat.comma_decimal:
      return ["en-US", "en"];
    // Use United States with fallback to English formatting 1,234,567.89
    case NumberFormat.decimal_comma:
      return ["de", "es", "it"];
    // Use German with fallback to Spanish then Italian formatting 1.234.567,89
    case NumberFormat.space_comma:
      return ["fr", "sv", "cs"];
    // Use French with fallback to Swedish and Czech formatting 1 234 567,89
    case NumberFormat.system:
      return void 0;
    default:
      return localeOptions.language;
  }
};
var round = (value, precision = 2) => Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
var formatNumber = (num, localeOptions, options) => {
  const locale = localeOptions ? numberFormatToLocale(localeOptions) : void 0;
  Number.isNaN = Number.isNaN || function isNaN2(input) {
    return typeof input === "number" && isNaN2(input);
  };
  if ((localeOptions === null || localeOptions === void 0 ? void 0 : localeOptions.number_format) !== NumberFormat.none && !Number.isNaN(Number(num)) && Intl) {
    try {
      return new Intl.NumberFormat(locale, getDefaultFormatOptions(num, options)).format(Number(num));
    } catch (err) {
      console.error(err);
      return new Intl.NumberFormat(void 0, getDefaultFormatOptions(num, options)).format(Number(num));
    }
  }
  if (typeof num === "string") {
    return num;
  }
  return `${round(num, options === null || options === void 0 ? void 0 : options.maximumFractionDigits).toString()}${(options === null || options === void 0 ? void 0 : options.style) === "currency" ? ` ${options.currency}` : ""}`;
};
var getDefaultFormatOptions = (num, options) => {
  const defaultOptions = Object.assign({ maximumFractionDigits: 2 }, options);
  if (typeof num !== "string") {
    return defaultOptions;
  }
  if (!options || !options.minimumFractionDigits && !options.maximumFractionDigits) {
    const digits = num.indexOf(".") > -1 ? num.split(".")[1].length : 0;
    defaultOptions.minimumFractionDigits = digits;
    defaultOptions.maximumFractionDigits = digits;
  }
  return defaultOptions;
};
var computeStateDisplay = (localize, stateObj, locale, state) => {
  const compareState = state !== void 0 ? state : stateObj.state;
  if (compareState === "unknown" || compareState === "unavailable") {
    return localize(`state.default.${compareState}`);
  }
  if (isNumericState(stateObj)) {
    if (stateObj.attributes.device_class === "monetary") {
      try {
        return formatNumber(compareState, locale, {
          style: "currency",
          currency: stateObj.attributes.unit_of_measurement
        });
      } catch (_err) {
      }
    }
    return `${formatNumber(compareState, locale)}${stateObj.attributes.unit_of_measurement ? " " + stateObj.attributes.unit_of_measurement : ""}`;
  }
  const domain = computeStateDomain(stateObj);
  if (domain === "input_datetime") {
    if (state !== void 0) {
      try {
        const components = state.split(" ");
        if (components.length === 2) {
          return formatDateTime(new Date(components.join("T")), locale);
        }
        if (components.length === 1) {
          if (state.includes("-")) {
            return formatDate(/* @__PURE__ */ new Date(`${state}T00:00`), locale);
          }
          if (state.includes(":")) {
            const now = /* @__PURE__ */ new Date();
            return formatTime(/* @__PURE__ */ new Date(`${now.toISOString().split("T")[0]}T${state}`), locale);
          }
        }
        return state;
      } catch (_e) {
        return state;
      }
    } else {
      let date;
      if (stateObj.attributes.has_date && stateObj.attributes.has_time) {
        date = new Date(stateObj.attributes.year, stateObj.attributes.month - 1, stateObj.attributes.day, stateObj.attributes.hour, stateObj.attributes.minute);
        return formatDateTime(date, locale);
      }
      if (stateObj.attributes.has_date) {
        date = new Date(stateObj.attributes.year, stateObj.attributes.month - 1, stateObj.attributes.day);
        return formatDate(date, locale);
      }
      if (stateObj.attributes.has_time) {
        date = /* @__PURE__ */ new Date();
        date.setHours(stateObj.attributes.hour, stateObj.attributes.minute);
        return formatTime(date, locale);
      }
      return stateObj.state;
    }
  }
  if (domain === "humidifier") {
    if (compareState === "on" && stateObj.attributes.humidity) {
      return `${stateObj.attributes.humidity} %`;
    }
  }
  if (domain === "counter" || domain === "number" || domain === "input_number") {
    return formatNumber(compareState, locale);
  }
  return (
    // Return device class translation
    stateObj.attributes.device_class && localize(`component.${domain}.state.${stateObj.attributes.device_class}.${compareState}`) || // Return default translation
    localize(`component.${domain}.state._.${compareState}`) || // We don't know! Return the raw state.
    compareState
  );
};
var DEFAULT_DOMAIN_ICON = "mdi:bookmark";
var DEFAULT_PANEL = "lovelace";
var DOMAINS_WITH_CARD = [
  "climate",
  "cover",
  "configurator",
  "input_select",
  "input_number",
  "input_text",
  "lock",
  "media_player",
  "scene",
  "script",
  "timer",
  "vacuum",
  "water_heater",
  "weblink"
];
var DOMAINS_WITH_MORE_INFO = [
  "alarm_control_panel",
  "automation",
  "camera",
  "climate",
  "configurator",
  "cover",
  "fan",
  "group",
  "history_graph",
  "input_datetime",
  "light",
  "lock",
  "media_player",
  "script",
  "sun",
  "updater",
  "vacuum",
  "water_heater",
  "weather"
];
var DOMAINS_HIDE_MORE_INFO = [
  "input_number",
  "input_select",
  "input_text",
  "scene",
  "weblink"
];
var DOMAINS_MORE_INFO_NO_HISTORY = [
  "camera",
  "configurator",
  "history_graph",
  "scene"
];
var STATES_OFF = ["closed", "locked", "off"];
var DOMAINS_TOGGLE = /* @__PURE__ */ new Set([
  "fan",
  "input_boolean",
  "light",
  "switch",
  "group",
  "automation"
]);
var UNIT_C = "\xB0C";
var UNIT_F = "\xB0F";
var DEFAULT_VIEW_ENTITY_ID = "group.default_view";
var fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === void 0 ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === void 0 ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === void 0 ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};
var SPECIAL_TYPES = /* @__PURE__ */ new Set([
  "call-service",
  "divider",
  "section",
  "weblink",
  "cast",
  "select"
]);
var DOMAIN_TO_ELEMENT_TYPE = {
  alert: "toggle",
  automation: "toggle",
  climate: "climate",
  cover: "cover",
  fan: "toggle",
  group: "group",
  input_boolean: "toggle",
  input_number: "input-number",
  input_select: "input-select",
  input_text: "input-text",
  light: "toggle",
  lock: "lock",
  media_player: "media-player",
  remote: "toggle",
  scene: "scene",
  script: "script",
  sensor: "sensor",
  timer: "timer",
  switch: "toggle",
  vacuum: "toggle",
  // Temporary. Once climate is rewritten,
  // water heater should get it's own row.
  water_heater: "climate",
  input_datetime: "input-datetime"
};
var createThing = (cardConfig, isRow = false) => {
  const _createError = (error, config) => {
    return _createThing("hui-error-card", {
      type: "error",
      error,
      config
    });
  };
  const _createThing = (tag2, config) => {
    const element2 = window.document.createElement(tag2);
    try {
      if (!element2.setConfig)
        return;
      element2.setConfig(config);
    } catch (err) {
      console.error(tag2, err);
      return _createError(err.message, config);
    }
    return element2;
  };
  if (!cardConfig || typeof cardConfig !== "object" || !isRow && !cardConfig.type)
    return _createError("No type defined", cardConfig);
  let tag = cardConfig.type;
  if (tag && tag.startsWith("custom:")) {
    tag = tag.substr("custom:".length);
  } else if (isRow) {
    if (SPECIAL_TYPES.has(tag)) {
      tag = `hui-${tag}-row`;
    } else {
      if (!cardConfig.entity) {
        return _createError("Invalid config given.", cardConfig);
      }
      const domain = cardConfig.entity.split(".", 1)[0];
      tag = `hui-${DOMAIN_TO_ELEMENT_TYPE[domain] || "text"}-entity-row`;
    }
  } else {
    tag = `hui-${tag}-card`;
  }
  if (customElements.get(tag))
    return _createThing(tag, cardConfig);
  const element = _createError(`Custom element doesn't exist: ${cardConfig.type}.`, cardConfig);
  element.style.display = "None";
  const timer = setTimeout(() => {
    element.style.display = "";
  }, 2e3);
  customElements.whenDefined(cardConfig.type).then(() => {
    clearTimeout(timer);
    fireEvent(element, "ll-rebuild", {}, element);
  });
  return element;
};
function durationToSeconds(duration) {
  const parts = duration.split(":").map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
var formatRelTimeMem = (locale) => new Intl.RelativeTimeFormat(locale.language, { numeric: "auto" });
var relativeTime = (from, locale, to, includeTense = true) => {
  const diff = selectUnit(from, to);
  if (includeTense) {
    return formatRelTimeMem(locale).format(diff.value, diff.unit);
  }
  return Intl.NumberFormat(locale.language, {
    style: "unit",
    unit: diff.unit,
    unitDisplay: "long"
  }).format(Math.abs(diff.value));
};
function timerTimeRemaining(stateObj) {
  let timeRemaining = durationToSeconds(stateObj.attributes.remaining);
  if (stateObj.state === "active") {
    const now = (/* @__PURE__ */ new Date()).getTime();
    const madeActive = new Date(stateObj.last_changed).getTime();
    timeRemaining = Math.max(timeRemaining - (now - madeActive) / 1e3, 0);
  }
  return timeRemaining;
}
var debounce = (func, wait, immediate = false) => {
  let timeout;
  return function(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
};
var compareArrayBufferViews = (a, b) => {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const viewA = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const viewB = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  for (let index = 0; index < viewA.length; index++) {
    if (viewA[index] !== viewB[index]) {
      return false;
    }
  }
  return true;
};
var deepEqual = (a, b) => {
  if (a === b) {
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) {
      return false;
    }
    let i;
    let length;
    if (Array.isArray(a)) {
      const bArray = b;
      length = a.length;
      if (length !== bArray.length) {
        return false;
      }
      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], bArray[i])) {
          return false;
        }
      }
      return true;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) {
        return false;
      }
      for (i of a.entries()) {
        if (!b.has(i[0])) {
          return false;
        }
      }
      for (i of a.entries()) {
        if (!deepEqual(i[1], b.get(i[0]))) {
          return false;
        }
      }
      return true;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      for (i of a.entries()) {
        if (!b.has(i[0])) {
          return false;
        }
      }
      return true;
    }
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      return compareArrayBufferViews(a, b);
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    if (a.valueOf !== Object.prototype.valueOf) {
      return a.valueOf() === b.valueOf();
    }
    if (a.toString !== Object.prototype.toString) {
      return a.toString() === b.toString();
    }
    const aRecord = a;
    const bRecord = b;
    const keys = Object.keys(aRecord);
    length = keys.length;
    if (length !== Object.keys(bRecord).length) {
      return false;
    }
    for (i = length; i-- !== 0; ) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }
    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      if (!deepEqual(aRecord[key], bRecord[key])) {
        return false;
      }
    }
    return true;
  }
  return a !== a && b !== b;
};
var fixedIcons = {
  alert: "mdi:alert",
  automation: "mdi:playlist-play",
  calendar: "mdi:calendar",
  camera: "mdi:video",
  climate: "mdi:thermostat",
  configurator: "mdi:settings",
  conversation: "mdi:text-to-speech",
  device_tracker: "mdi:account",
  fan: "mdi:fan",
  group: "mdi:google-circles-communities",
  history_graph: "mdi:chart-line",
  homeassistant: "mdi:home-assistant",
  homekit: "mdi:home-automation",
  image_processing: "mdi:image-filter-frames",
  input_boolean: "mdi:drawing",
  input_datetime: "mdi:calendar-clock",
  input_number: "mdi:ray-vertex",
  input_select: "mdi:format-list-bulleted",
  input_text: "mdi:textbox",
  light: "mdi:lightbulb",
  mailbox: "mdi:mailbox",
  notify: "mdi:comment-alert",
  person: "mdi:account",
  plant: "mdi:flower",
  proximity: "mdi:apple-safari",
  remote: "mdi:remote",
  scene: "mdi:google-pages",
  script: "mdi:file-document",
  sensor: "mdi:eye",
  simple_alarm: "mdi:bell",
  sun: "mdi:white-balance-sunny",
  switch: "mdi:flash",
  timer: "mdi:timer",
  updater: "mdi:cloud-upload",
  vacuum: "mdi:robot-vacuum",
  water_heater: "mdi:thermometer",
  weblink: "mdi:open-in-new"
};
function domainIcon(domain, state) {
  if (domain in fixedIcons) {
    return fixedIcons[domain];
  }
  switch (domain) {
    case "alarm_control_panel":
      switch (state) {
        case "armed_home":
          return "mdi:bell-plus";
        case "armed_night":
          return "mdi:bell-sleep";
        case "disarmed":
          return "mdi:bell-outline";
        case "triggered":
          return "mdi:bell-ring";
        default:
          return "mdi:bell";
      }
    case "binary_sensor":
      return state && state === "off" ? "mdi:radiobox-blank" : "mdi:checkbox-marked-circle";
    case "cover":
      return state === "closed" ? "mdi:window-closed" : "mdi:window-open";
    case "lock":
      return state && state === "unlocked" ? "mdi:lock-open" : "mdi:lock";
    case "media_player":
      return state && state !== "off" && state !== "idle" ? "mdi:cast-connected" : "mdi:cast";
    case "zwave":
      switch (state) {
        case "dead":
          return "mdi:emoticon-dead";
        case "sleeping":
          return "mdi:sleep";
        case "initializing":
          return "mdi:timer-sand";
        default:
          return "mdi:z-wave";
      }
    default:
      console.warn("Unable to find icon for domain " + domain + " (" + state + ")");
      return DEFAULT_DOMAIN_ICON;
  }
}
var evaluateFilter = (stateObj, filter) => {
  const operator = filter.operator || "==";
  const value = filter.value || filter;
  const state = filter.attribute ? stateObj.attributes[filter.attribute] : stateObj.state;
  switch (operator) {
    case "==":
      return state === value;
    case "<=":
      return state <= value;
    case "<":
      return state < value;
    case ">=":
      return state >= value;
    case ">":
      return state > value;
    case "!=":
      return state !== value;
    case "regex": {
      return state.match(value);
    }
    default:
      return false;
  }
};
var formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) {
    return `${diffSec} seconds ago`;
  }
  if (diffMin < 60) {
    return `${diffMin} minutes ago`;
  }
  if (diffHour < 24) {
    return `${diffHour} hours ago`;
  }
  if (diffDay < 7) {
    return `${diffDay} days ago`;
  }
  return date.toLocaleString();
};
var getLovelace = () => {
  let root = document.querySelector("home-assistant");
  root = root && root.shadowRoot;
  root = root && root.querySelector("home-assistant-main");
  root = root && root.shadowRoot;
  root = root && root.querySelector("app-drawer-layout partial-panel-resolver");
  root = root && root.shadowRoot || root;
  root = root && root.querySelector("ha-panel-lovelace");
  root = root && root.shadowRoot;
  root = root && root.querySelector("hui-root");
  if (root) {
    const ll = root.lovelace;
    ll.current_view = root.___curView;
    return ll;
  }
  return null;
};
var forwardHaptic = (hapticType) => {
  fireEvent(window, "haptic", hapticType);
};
var navigate = (_node, path, replace = false) => {
  if (replace) {
    history.replaceState(null, "", path);
  } else {
    history.pushState(null, "", path);
  }
  fireEvent(window, "location-changed", {
    replace
  });
};
var turnOnOffEntity = (hass, entityId, turnOn = true) => {
  const stateDomain = computeDomain(entityId);
  const serviceDomain = stateDomain === "group" ? "homeassistant" : stateDomain;
  let service;
  switch (stateDomain) {
    case "lock":
      service = turnOn ? "unlock" : "lock";
      break;
    case "cover":
      service = turnOn ? "open_cover" : "close_cover";
      break;
    default:
      service = turnOn ? "turn_on" : "turn_off";
  }
  return hass.callService(serviceDomain, service, { entity_id: entityId });
};
var toggleEntity = (hass, entityId) => {
  const turnOn = STATES_OFF.includes(hass.states[entityId].state);
  return turnOnOffEntity(hass, entityId, turnOn);
};
var handleActionConfig = (node, hass, config, actionConfig) => {
  if (!actionConfig) {
    actionConfig = {
      action: "more-info"
    };
  }
  if (actionConfig.confirmation && (!actionConfig.confirmation.exemptions || !actionConfig.confirmation.exemptions.some((e) => e.user === hass.user.id))) {
    forwardHaptic("warning");
    if (!confirm(actionConfig.confirmation.text || `Are you sure you want to ${actionConfig.action}?`)) {
      return;
    }
  }
  switch (actionConfig.action) {
    case "more-info":
      if (config.entity || config.camera_image) {
        fireEvent(node, "hass-more-info", {
          entityId: config.entity ? config.entity : config.camera_image
        });
      }
      break;
    case "navigate":
      if (actionConfig.navigation_path) {
        navigate(node, actionConfig.navigation_path);
      }
      break;
    case "url":
      if (actionConfig.url_path) {
        window.open(actionConfig.url_path);
      }
      break;
    case "toggle":
      if (config.entity) {
        toggleEntity(hass, config.entity);
        forwardHaptic("success");
      }
      break;
    case "call-service": {
      if (!actionConfig.service) {
        forwardHaptic("failure");
        return;
      }
      const [domain, service] = actionConfig.service.split(".", 2);
      hass.callService(domain, service, actionConfig.service_data, actionConfig.target);
      forwardHaptic("success");
      break;
    }
    case "fire-dom-event": {
      fireEvent(node, "ll-custom", actionConfig);
    }
  }
};
var handleAction = (node, hass, config, action) => {
  let actionConfig;
  if (action === "double_tap" && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === "hold" && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === "tap" && config.tap_action) {
    actionConfig = config.tap_action;
  }
  handleActionConfig(node, hass, config, actionConfig);
};
var handleClick = (node, hass, config, hold, dblClick) => {
  let actionConfig;
  if (dblClick && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (hold && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (!hold && config.tap_action) {
    actionConfig = config.tap_action;
  }
  if (!actionConfig) {
    actionConfig = {
      action: "more-info"
    };
  }
  if (actionConfig.confirmation && (!actionConfig.confirmation.exemptions || !actionConfig.confirmation.exemptions.some((e) => e.user === hass.user.id))) {
    if (!confirm(actionConfig.confirmation.text || `Are you sure you want to ${actionConfig.action}?`)) {
      return;
    }
  }
  switch (actionConfig.action) {
    case "more-info":
      if (actionConfig.entity || config.entity || config.camera_image) {
        fireEvent(node, "hass-more-info", {
          entityId: actionConfig.entity ? actionConfig.entity : config.entity ? config.entity : config.camera_image
        });
        if (actionConfig.haptic)
          forwardHaptic(actionConfig.haptic);
      }
      break;
    case "navigate":
      if (actionConfig.navigation_path) {
        navigate(node, actionConfig.navigation_path);
        if (actionConfig.haptic)
          forwardHaptic(actionConfig.haptic);
      }
      break;
    case "url":
      actionConfig.url_path && window.open(actionConfig.url_path);
      if (actionConfig.haptic)
        forwardHaptic(actionConfig.haptic);
      break;
    case "toggle":
      if (config.entity) {
        toggleEntity(hass, config.entity);
        if (actionConfig.haptic)
          forwardHaptic(actionConfig.haptic);
      }
      break;
    case "call-service": {
      if (!actionConfig.service) {
        return;
      }
      const [domain, service] = actionConfig.service.split(".", 2);
      const serviceData = Object.assign({}, actionConfig.service_data);
      if (serviceData.entity_id === "entity") {
        serviceData.entity_id = config.entity;
      }
      hass.callService(domain, service, serviceData, actionConfig.target);
      if (actionConfig.haptic)
        forwardHaptic(actionConfig.haptic);
      break;
    }
    case "fire-dom-event": {
      fireEvent(node, "ll-custom", actionConfig);
      if (actionConfig.haptic)
        forwardHaptic(actionConfig.haptic);
      break;
    }
  }
};
function hasAction(config) {
  return config !== void 0 && config.action !== "none";
}
function hasConfigOrEntityChanged(element, changedProps, forceUpdate) {
  if (changedProps.has("config") || forceUpdate) {
    return true;
  }
  if (element.config.entity) {
    const oldHass = changedProps.get("hass");
    if (oldHass) {
      return oldHass.states[element.config.entity] !== element.hass.states[element.config.entity];
    }
    return true;
  } else {
    return false;
  }
}
function hasDoubleClick(config) {
  return config !== void 0 && config.action !== "none";
}
var binarySensorIcon = (state, stateObj) => {
  const is_off = state === "off";
  switch (stateObj === null || stateObj === void 0 ? void 0 : stateObj.attributes.device_class) {
    case "battery":
      return is_off ? "mdi:battery" : "mdi:battery-outline";
    case "battery_charging":
      return is_off ? "mdi:battery" : "mdi:battery-charging";
    case "cold":
      return is_off ? "mdi:thermometer" : "mdi:snowflake";
    case "connectivity":
      return is_off ? "mdi:server-network-off" : "mdi:server-network";
    case "door":
      return is_off ? "mdi:door-closed" : "mdi:door-open";
    case "garage_door":
      return is_off ? "mdi:garage" : "mdi:garage-open";
    case "power":
      return is_off ? "mdi:power-plug-off" : "mdi:power-plug";
    case "gas":
    case "problem":
    case "safety":
    case "tamper":
      return is_off ? "mdi:check-circle" : "mdi:alert-circle";
    case "smoke":
      return is_off ? "mdi:check-circle" : "mdi:smoke";
    case "heat":
      return is_off ? "mdi:thermometer" : "mdi:fire";
    case "light":
      return is_off ? "mdi:brightness-5" : "mdi:brightness-7";
    case "lock":
      return is_off ? "mdi:lock" : "mdi:lock-open";
    case "moisture":
      return is_off ? "mdi:water-off" : "mdi:water";
    case "motion":
      return is_off ? "mdi:walk" : "mdi:run";
    case "occupancy":
      return is_off ? "mdi:home-outline" : "mdi:home";
    case "opening":
      return is_off ? "mdi:square" : "mdi:square-outline";
    case "plug":
      return is_off ? "mdi:power-plug-off" : "mdi:power-plug";
    case "presence":
      return is_off ? "mdi:home-outline" : "mdi:home";
    case "running":
      return is_off ? "mdi:stop" : "mdi:play";
    case "sound":
      return is_off ? "mdi:music-note-off" : "mdi:music-note";
    case "update":
      return is_off ? "mdi:package" : "mdi:package-up";
    case "vibration":
      return is_off ? "mdi:crop-portrait" : "mdi:vibrate";
    case "window":
      return is_off ? "mdi:window-closed" : "mdi:window-open";
    default:
      return is_off ? "mdi:radiobox-blank" : "mdi:checkbox-marked-circle";
  }
};
var coverIcon = (state) => {
  const open = state.state !== "closed";
  switch (state.attributes.device_class) {
    case "garage":
      return open ? "mdi:garage-open" : "mdi:garage";
    case "door":
      return open ? "mdi:door-open" : "mdi:door-closed";
    case "shutter":
      return open ? "mdi:window-shutter-open" : "mdi:window-shutter";
    case "blind":
      return open ? "mdi:blinds-open" : "mdi:blinds";
    case "window":
      return open ? "mdi:window-open" : "mdi:window-closed";
    default:
      return domainIcon("cover", state.state);
  }
};
var fixedDeviceClassIcons = {
  humidity: "mdi:water-percent",
  illuminance: "mdi:brightness-5",
  temperature: "mdi:thermometer",
  pressure: "mdi:gauge",
  power: "mdi:flash",
  signal_strength: "mdi:wifi"
};
var sensorIcon = (state) => {
  const dclass = state.attributes.device_class;
  if (dclass && dclass in fixedDeviceClassIcons) {
    return fixedDeviceClassIcons[dclass];
  }
  if (dclass === "battery") {
    const battery = Number(state.state);
    if (isNaN(battery)) {
      return "mdi:battery-unknown";
    }
    const batteryRound = Math.round(battery / 10) * 10;
    if (batteryRound >= 100) {
      return "mdi:battery";
    }
    if (batteryRound <= 0) {
      return "mdi:battery-alert";
    }
    return `${"hass"}:battery-${batteryRound}`;
  }
  const unit = state.attributes.unit_of_measurement;
  if (unit === UNIT_C || unit === UNIT_F) {
    return "mdi:thermometer";
  }
  return domainIcon("sensor");
};
var inputDateTimeIcon = (state) => {
  if (!state.attributes.has_date) {
    return "mdi:clock";
  }
  if (!state.attributes.has_time) {
    return "mdi:calendar";
  }
  return domainIcon("input_datetime");
};
var domainIcons = {
  binary_sensor: binarySensorIcon,
  cover: coverIcon,
  sensor: sensorIcon,
  input_datetime: inputDateTimeIcon
};
var stateIcon = (state) => {
  if (!state) {
    return DEFAULT_DOMAIN_ICON;
  }
  if (state.attributes.icon) {
    return state.attributes.icon;
  }
  const domain = computeDomain(state.entity_id);
  if (domain in domainIcons) {
    return domainIcons[domain](state);
  }
  return domainIcon(domain, state.state);
};
var turnOnOffEntities = (hass, entityIds, turnOn = true) => {
  const domainsToCall = {};
  entityIds.forEach((entityId) => {
    if (STATES_OFF.includes(hass.states[entityId].state) === turnOn) {
      const stateDomain = computeDomain(entityId);
      const serviceDomain = ["cover", "lock"].includes(stateDomain) ? stateDomain : "homeassistant";
      if (!(serviceDomain in domainsToCall)) {
        domainsToCall[serviceDomain] = [];
      }
      domainsToCall[serviceDomain].push(entityId);
    }
  });
  Object.keys(domainsToCall).forEach((domain) => {
    let service;
    switch (domain) {
      case "lock":
        service = turnOn ? "unlock" : "lock";
        break;
      case "cover":
        service = turnOn ? "open_cover" : "close_cover";
        break;
      default:
        service = turnOn ? "turn_on" : "turn_off";
    }
    const entities = domainsToCall[domain];
    hass.callService(domain, service, { entity_id: entities });
  });
};
export {
  DEFAULT_DOMAIN_ICON,
  DEFAULT_PANEL,
  DEFAULT_VIEW_ENTITY_ID,
  DOMAINS_HIDE_MORE_INFO,
  DOMAINS_MORE_INFO_NO_HISTORY,
  DOMAINS_TOGGLE,
  DOMAINS_WITH_CARD,
  DOMAINS_WITH_MORE_INFO,
  NumberFormat,
  STATES_OFF,
  TimeFormat,
  UNIT_C,
  UNIT_F,
  applyThemesOnElement,
  computeCardSize,
  computeDomain,
  computeEntity,
  computeIcon,
  computeName,
  computeRTL,
  computeRTLDirection,
  computeState,
  computeStateDisplay,
  computeStateDomain,
  createThing,
  debounce,
  deepEqual,
  domainIcon,
  evaluateFilter,
  fireEvent,
  fixedIcons,
  formatDate,
  formatDateMonth,
  formatDateMonthYear,
  formatDateNumeric,
  formatDateShort,
  formatDateTime,
  formatDateTimeNumeric,
  formatDateTimeWithSeconds,
  formatDateWeekday,
  formatDateYear,
  formatNumber,
  formatTime,
  formatTimeWeekday,
  formatTimeWithSeconds,
  formatTimestamp,
  forwardHaptic,
  getLovelace,
  handleAction,
  handleActionConfig,
  handleClick,
  hasAction,
  hasConfigOrEntityChanged,
  hasDoubleClick,
  isNumericState,
  navigate,
  numberFormatToLocale,
  relativeTime,
  round,
  stateIcon,
  timerTimeRemaining,
  toggleEntity,
  turnOnOffEntities,
  turnOnOffEntity
};
