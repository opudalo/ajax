"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var extend = _interopRequire(require("extend"));

module.exports = ajax;

var DEFAULTS = {
  type: "GET",
  success: empty,
  error: empty,
  complete: empty,
  accepts: {
    script: "text/javascript, application/javascript",
    json: "application/json",
    xml: "application/xml, text/xml",
    html: "text/html",
    text: "text/plain"
  },
  crossDomain: false,
  async: true,
  timeout: 0
};

var jsonpID = 0;

function ajax() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  var settings = extend({}, options);
  for (var key in DEFAULTS) {
    if (settings[key] === undefined) settings[key] = DEFAULTS[key];
  }if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host;
  if (isJsonP(settings)) {
    return sendJsonP(settings);
  }if (!settings.url) settings.url = window.location.toString();
  serializeData(settings);

  var dataType = settings.dataType,
      mime = settings.accepts[dataType],
      xhr = req(),
      abortTimeout;

  if (mime) {
    if (mime.indexOf(",") > -1) mime = mime.split(",", 2)[0];
    xhr.overrideMimeType && xhr.overrideMimeType(mime);
  }

  settings.headers = getHeaders(settings);

  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;

    clearTimeout(abortTimeout);
    var protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        reqSucceed = xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || xhr.status == 0 && protocol == "file:",
        result = xhr.responseText,
        blankRE = /^\s*$/,
        noErrors = true;

    if (!reqSucceed) return ajaxError(null, "error", xhr, settings);

    dataType = dataType || mimeToDataType(xhr.getResponseHeader("content-type"));

    try {
      if (dataType == "script") (1, eval)(result);else if (dataType == "xml") result = xhr.responseXML;else if (dataType == "json") result = blankRE.test(result) ? null : JSON.parse(result);
    } catch (e) {
      noErrors = false;
      ajaxError(e, "parsererror", xhr, settings);
    }

    if (noErrors) ajaxSuccess(result, xhr, settings);
  };

  xhr.open(settings.type, settings.url, settings.async);

  for (var name in settings.headers) xhr.setRequestHeader(name, settings.headers[name]);

  if (settings.timeout > 0) abortTimeout = setTimeout(function () {
    xhr.onreadystatechange = empty;
    xhr.abort();
    ajaxError(null, "timeout", xhr, settings);
  }, settings.timeout);

  xhr.send(settings.data ? settings.data : null);
  return xhr;
}

function ajaxSuccess(data, xhr, settings) {
  var status = "success";
  settings.success(data, status, xhr);
  ajaxComplete(status, xhr, settings);
}

function ajaxError(error, status, xhr, settings) {
  console.error && console.error("Ajax error appeared", error, status, settings);
  // status: "timeout", "error", "abort", "parsererror"
  settings.error(xhr, status, error);
  ajaxComplete(status, xhr, settings);
}

function ajaxComplete(status, xhr, settings) {
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  settings.complete(xhr, status);
}

function isJsonP(settings) {
  var dataType = settings.dataType,
      hasPlaceholder = /=\?/.test(settings.url);

  return dataType == "jsonp" || hasPlaceholder;
}

function sendJsonP(settings) {
  var hasPlaceholder = /=\?/.test(settings.url);
  if (!hasPlaceholder) settings.url = appendQuery(settings.url, "callback=?");
  return ajax.JSONP(settings);
}

ajax.JSONP = function (options) {
  if (!("type" in options)) return ajax(options);

  var callbackName = "jsonp" + ++jsonpID,
      script = document.createElement("script"),
      abort = function abort() {
    if (callbackName in window) window[callbackName] = empty;
    ajaxComplete("abort", xhr, options);
  },
      xhr = { abort: abort },
      abortTimeout,
      head = document.getElementsByTagName("head")[0] || document.documentElement;

  if (options.error) script.onerror = function () {
    xhr.abort();
    options.error();
  };

  window[callbackName] = function (data) {
    clearTimeout(abortTimeout);
    delete window[callbackName];
    ajaxSuccess(data, xhr, options);
  };

  serializeData(options);
  script.src = options.url.replace(/=\?/, "=" + callbackName);

  // Use insertBefore instead of appendChild to circumvent an IE6 bug.
  // This arises when a base node is used (see jQuery bugs #2709 and #4378).
  head.insertBefore(script, head.firstChild);

  if (options.timeout > 0) abortTimeout = setTimeout(function () {
    xhr.abort();
    ajaxComplete("timeout", xhr, options);
  }, options.timeout);

  return xhr;
};

ajax.get = function (url, success) {
  return ajax({
    url: url,
    success: success
  });
};

ajax.post = function (url, data, success, dataType) {
  if (data instanceof Function) dataType = dataType || success, success = data, data = null;
  return ajax({
    type: "POST",
    url: url,
    data: data,
    success: success,
    dataType: dataType
  });
};

ajax.getJSON = function (url, success) {
  return ajax({
    url: url,
    success: success,
    dataType: "json"
  });
};

function empty() {}

function req() {
  return new window.XMLHttpRequest();
}

function mimeToDataType(mime) {
  var scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = "application/json",
      htmlType = "text/html";

  return mime && (mime == htmlType ? "html" : mime == jsonType ? "json" : scriptTypeRE.test(mime) ? "script" : xmlTypeRE.test(mime) && "xml") || "text";
}

function getHeaders(settings) {
  var mime = settings.accepts[settings.dataType],
      baseHeaders = {};

  if (mime) baseHeaders.Accept = mime;
  if (!settings.crossDomain) baseHeaders["X-Requested-With"] = "XMLHttpRequest";
  if (settings.contentType || settings.data && settings.type.toUpperCase() != "GET") baseHeaders["Content-Type"] = settings.contentType || "application/x-www-form-urlencoded";

  return extend(baseHeaders, settings.headers || {});
}

function appendQuery(url, query) {
  return (url + "&" + query).replace(/[&?]{1,2}/, "?");
}

function serializeData(options) {
  if (options.data instanceof Object) options.data = param(options.data);
  if (options.data && options.type.toUpperCase() == "GET") options.url = appendQuery(options.url, options.data);
}

function serialize(params, obj, scope) {
  var array = obj instanceof Array;
  for (var key in obj) {
    var value = obj[key];

    if (scope) key = scope + "[" + (array ? key + "" : key) + "]";

    if (!scope && array) add(value.name, value.value);else if (value instanceof Object) serialize(params, value, key);else add(key, value);
  }

  function add(key, value) {
    var escape = encodeURIComponent;
    params.push(escape(key) + "=" + escape(value));
  }
}

function param(obj) {
  var params = [];
  serialize(params, obj);
  return params.join("&").replace("%20", "+");
}