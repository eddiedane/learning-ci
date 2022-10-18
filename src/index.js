"use strict";
var __assign = (this && this.__assign) || function () {
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
exports.__esModule = true;
var axios_1 = require("axios");
var SpecialConfigKey;
(function (SpecialConfigKey) {
    SpecialConfigKey["vars"] = "vars";
    SpecialConfigKey["routes"] = "routes";
    SpecialConfigKey["cache"] = "cache";
})(SpecialConfigKey || (SpecialConfigKey = {}));
var globalAxiosPlux;
var getData$Config = function (data$Config, includesData) {
    if (includesData === void 0) { includesData = false; }
    var parts = {
        config: {},
        special: {},
        data: {}
    };
    if (typeof window !== 'undefined' && data$Config instanceof FormData) {
        parts.data = parts.data;
        return parts;
    }
    else {
        data$Config = data$Config;
        for (var key in data$Config) {
            if (!key)
                continue;
            var value = data$Config[key];
            var is$Config = key[0] === '$';
            if (includesData && !is$Config) {
                parts.data = parts.data || {};
                parts.data[key] = value;
            }
            else {
                var configName = is$Config ? key.substring(1) : key;
                if (configName in SpecialConfigKey) {
                    parts.special[configName] = value;
                }
                else {
                    parts.config[configName] = value;
                }
            }
        }
        return parts;
    }
};
var resolveNamedRouteConfig = function (url, args) {
    var config = {};
    if (args[0] == null ||
        (typeof args[0] === 'object' && !Array.isArray(args[0]))) {
        config = mergeConfigs(args[0] || {}, args[1]);
        if (Array.isArray(config.vars || config.$vars)) {
            if ('vars' in config)
                config.vars = getPathPlaceholders(url, config.vars);
            else
                config.vars = getPathPlaceholders(url, config.$vars);
        }
    }
    else {
        config = {
            vars: getPathPlaceholders(url, Array.isArray(args[0]) ? args[0] : args)
        };
    }
    return config;
};
var getPathPlaceholders = function (url, arr) {
    var match = url.match(/\:(\w+)/g);
    if (!match || !match.length)
        return {};
    return match.reduce(function (obj, placeholder, i) {
        var _a;
        placeholder = placeholder.replace(':', '');
        var value = arr[i];
        return value === undefined ? obj : __assign(__assign({}, obj), (_a = {}, _a[placeholder] = value, _a));
    }, {});
};
var mergeConfigs = function (config1, config2) {
    var config;
    config = __assign(__assign({}, config1), config2);
    return config;
};
var strrep = function (str, placeholdersData, options) {
    if (placeholdersData === void 0) { placeholdersData = {}; }
    if (options === void 0) { options = { rgx: /:(\w+)/g, valueCaptureIndex: 0 }; }
    return str.replace(options.rgx, function (match) {
        var matchData = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            matchData[_i - 1] = arguments[_i];
        }
        var replacement = placeholdersData[matchData[options.valueCaptureIndex]] || match;
        if (replacement === match) {
            throw new Error("\"".concat(match, "\" has no matching replacement value"));
        }
        return placeholdersData[matchData[options.valueCaptureIndex]] || match;
    });
};
var includes = function (needle, haystack) {
    return haystack.findIndex(function (item) { return item === needle; }) >= 0;
};
var createResolvePromise = function (res) {
    return new Promise(function (resolve) {
        resolve(res);
    });
};
var cacheRequest = function (axiosInstance, config, cacheStore, memoize) {
    var key = JSON.stringify(config);
    var storedResponse = cacheStore.responses[key];
    var expired = false;
    var onUpdate = typeof memoize === 'function' ? memoize : null;
    if (storedResponse) {
        var expiresAt = storedResponse.expiresAt, storedAt = storedResponse.storedAt;
        if (Date.now() - storedAt >= expiresAt)
            expired = true;
    }
    if (!storedResponse || expired || onUpdate) {
        if (expired && storedResponse.waiting) {
            return storedResponse.waiting;
        }
        if (onUpdate && storedResponse && storedResponse.waiting) {
            return createResolvePromise(storedResponse.data);
        }
        var promise = axiosInstance(config).then(function (res) {
            var storedAt = Date.now();
            var expiresAt = typeof memoize === 'number' ? memoize : 10e100;
            cacheStore.responses[key] = {
                expiresAt: expiresAt,
                storedAt: storedAt,
                waiting: undefined,
                data: res
            };
            if (onUpdate && storedResponse)
                onUpdate(res);
            return res;
        });
        if (expired || (onUpdate && storedResponse)) {
            storedResponse.waiting = promise;
        }
        return onUpdate && storedResponse
            ? createResolvePromise(storedResponse.data)
            : promise;
    }
    return createResolvePromise(storedResponse.data);
};
var create = function (instanceConfig) {
    if (instanceConfig === void 0) { instanceConfig = {}; }
    var dataConfig = getData$Config(instanceConfig);
    var defaultConfig = dataConfig.config;
    var defaultSpecialConfig = dataConfig.special;
    var globalRoutes = typeof globalAxiosPlux === 'undefined' ? {} : globalAxiosPlux.routes;
    var routes = __assign(__assign({}, globalRoutes), (defaultSpecialConfig.routes || {}));
    var cacheStore = { responses: {} };
    var _axios = axios_1["default"].create(defaultConfig);
    var axiosPluxInstance = function (url, config) {
        if (typeof url !== 'string') {
            config = url;
            url = config.url || config.$url || '';
        }
        return request(url, config);
    };
    var api = {};
    Object.keys(routes).forEach(function (routeName) {
        var routeOrString = routes[routeName];
        var route;
        if (typeof routeOrString === 'string') {
            route = { path: routeOrString };
        }
        else {
            route = routeOrString;
        }
        var method = route.method || 'get';
        api[routeName] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var config = resolveNamedRouteConfig(route.path, args);
            return request(route.path, config, method);
        };
    });
    axiosPluxInstance.axios = _axios;
    axiosPluxInstance.api = api;
    axiosPluxInstance.get = generateHTTPMethod0('get');
    axiosPluxInstance.head = generateHTTPMethod0('head');
    axiosPluxInstance["delete"] = generateHTTPMethod0('delete');
    axiosPluxInstance.options = generateHTTPMethod0('options');
    axiosPluxInstance.post = generateHTTPMethod1('post');
    axiosPluxInstance.put = generateHTTPMethod1('put');
    axiosPluxInstance.patch = generateHTTPMethod1('patch');
    axiosPluxInstance.postForm = generateHTTPMethod1('post');
    axiosPluxInstance.putForm = generateHTTPMethod1('put');
    axiosPluxInstance.patchForm = generateHTTPMethod1('patch');
    axiosPluxInstance.onRequest = function (interceptor) {
        _axios.interceptors.request.use(interceptor, function (err) { return err; });
    };
    axiosPluxInstance.onRequestError = function (interceptor) {
        _axios.interceptors.request.use(function (config) { return config; }, interceptor);
    };
    axiosPluxInstance.onResponse = function (interceptor) {
        _axios.interceptors.response.use(interceptor, function (err) { return err; });
    };
    axiosPluxInstance.onResponseError = function (interceptor) {
        _axios.interceptors.response.use(function (res) { return res; }, function (err) {
            interceptor(err);
            return Promise.reject(err);
        });
    };
    return axiosPluxInstance;
    function generateHTTPMethod0(method) {
        return function (url, data$Config) {
            return request(url, data$Config, method);
        };
    }
    function generateHTTPMethod1(method, isForm) {
        if (isForm === void 0) { isForm = false; }
        return function (url, data$Config, config) {
            config = mergeConfigs(data$Config, config);
            config = mergeConfigs(config, {
                headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {}
            });
            return request(url, config, method);
        };
    }
    function request(url, data$Config, method) {
        if (data$Config === void 0) { data$Config = {}; }
        method = method || data$Config.method || data$Config.$method || 'get';
        var isMethod1 = includes(method.toLowerCase(), ['post', 'patch', 'put']);
        var configParts = getData$Config(data$Config, isMethod1);
        var config = configParts.config;
        var specialConfig = configParts.special;
        if (typeof url === 'string') {
            url = strrep(url, __assign(__assign({}, defaultSpecialConfig.vars), specialConfig.vars));
        }
        var fullConfig = __assign(__assign(__assign({}, defaultConfig), config), { params: __assign(__assign({}, defaultConfig.params), config.params), data: configParts.data, method: method, url: url });
        var requestCaching = specialConfig.cache || defaultSpecialConfig.cache;
        if (requestCaching) {
            return cacheRequest(_axios, fullConfig, cacheStore, requestCaching);
        }
        var promise = _axios(fullConfig).then(function (res) { return res; });
        return promise;
    }
};
var axiosPlux = create();
globalAxiosPlux = axiosPlux;
axiosPlux.create = create;
axiosPlux.routes = {};
exports["default"] = axiosPlux;
