"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var taro_1 = __importStar(require("@tarojs/taro"));
var query_string_1 = __importDefault(require("query-string"));
var utils_1 = require("./utils");
// 队列用于存放push/redirect的回调函数
var pageNavigationCallbacks = {
    __callbacks: [],
    add: function (callback) {
        this.__callbacks.push(callback);
    },
    resolve: function (name, data) {
        var callback = this.__callbacks.find(function (callback) { return callback.name === name; });
        if (callback) {
            callback.resolve(data);
        }
    },
    remove: function (name) {
        var index = this.__callbacks.findIndex(function (callback) { return callback.name === name; });
        if (index >= 0) {
            this.__callbacks.splice(index, 1);
        }
    },
    empty: function () {
        this.__callbacks = [];
    },
};
var initialPageState = {
    name: null,
    query: null,
    from: null,
    route: null,
    depth: 0,
};
function useRouter() {
    var _a = taro_1.useState(initialPageState), pageState = _a[0], updatePageState = _a[1]; // 页面状态
    taro_1.useEffect(function () {
        var routeStack = taro_1.default.getCurrentPages(); // 获取页面栈
        var pageOnTop = routeStack[routeStack.length - 1] || {}; // 获取顶部页面
        var shortenPageName = utils_1.getRouteName(pageOnTop.route); // 获取pageName
        var query = pageOnTop.options || {};
        updatePageState({
            name: shortenPageName,
            route: pageOnTop.route,
            query: query,
            from: query.__from,
            depth: routeStack.length,
        });
    }, [updatePageState]);
    taro_1.useEffect(function () {
        return function () {
            // 销毁时移除本页面的pushCallback，适用于popToRoot返回首页
            pageState.name && pageNavigationCallbacks.remove(pageState.name);
            // 销毁时移除上页的pushCallback，适用于左上角标题箭头返回
            pageState.from && pageNavigationCallbacks.remove(pageState.from);
        };
    }, [pageState.from, pageState.name]);
    var routeMethods = taro_1.useMemo(function () {
        return {
            push: function (path, data, redirect) {
                if (data === void 0) { data = {}; }
                if (redirect === void 0) { redirect = false; }
                return new Promise(function (resolve, reject) {
                    var queryObj = Object.assign(data, {
                        __from: pageState.name,
                    });
                    taro_1.default[redirect ? 'redirectTo' : 'navigateTo']({
                        url: "/pages/" + path + "/index?" + query_string_1.default.stringify(queryObj, { encode: false }),
                        success: function () {
                            if (pageState.name) {
                                pageNavigationCallbacks.add({
                                    resolve: resolve,
                                    name: pageState.name,
                                });
                            }
                        },
                        fail: function (e) { return reject(e); },
                    });
                });
            },
            redirect: function (path, data) {
                if (data === void 0) { data = {}; }
                this.push(path, data, true);
            },
            pop: function (data, delta) {
                if (delta === void 0) { delta = 1; }
                pageState.from && pageNavigationCallbacks.resolve(pageState.from, data);
                return taro_1.default.navigateBack({
                    delta: delta,
                });
            },
            popToRoot: function () {
                return taro_1.default.navigateBack({ delta: pageState.depth - 1 });
            },
        };
    }, [pageState.from, pageState.name, pageState.depth]);
    return [pageState, routeMethods];
}
exports.default = useRouter;
