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
const taro_1 = __importStar(require("@tarojs/taro"));
const query_string_1 = __importDefault(require("query-string"));
const utils_1 = require("./utils");
// 队列用于存放push/redirect的回调函数
const pageNavigationCallbacks = {
    __callbacks: [],
    add(callback) {
        this.__callbacks.push(callback);
    },
    resolve(name, data) {
        const callback = this.__callbacks.find((callback) => callback.name === name);
        if (callback) {
            callback.resolve(data);
        }
    },
    remove(name) {
        const index = this.__callbacks.findIndex((callback) => callback.name === name);
        if (index >= 0) {
            this.__callbacks.splice(index, 1);
        }
    },
    empty() {
        this.__callbacks = [];
    },
};
const initialPageState = {
    name: null,
    query: null,
    from: null,
    route: null,
    depth: 0,
};
function useRouter() {
    const [pageState, updatePageState] = taro_1.useState(initialPageState); // 页面状态
    taro_1.useEffect(() => {
        const routeStack = taro_1.default.getCurrentPages(); // 获取页面栈
        const pageOnTop = routeStack[routeStack.length - 1] || {}; // 获取顶部页面
        const shortenPageName = utils_1.getRouteName(pageOnTop.route); // 获取pageName
        const query = pageOnTop.options || {};
        updatePageState({
            name: shortenPageName,
            route: pageOnTop.route,
            query,
            from: query.__from,
            depth: routeStack.length,
        });
    }, [updatePageState]);
    taro_1.useEffect(() => {
        return () => {
            // 销毁时移除本页面的pushCallback，适用于popToRoot返回首页
            pageState.name && pageNavigationCallbacks.remove(pageState.name);
            // 销毁时移除上页的pushCallback，适用于左上角标题箭头返回
            pageState.from && pageNavigationCallbacks.remove(pageState.from);
        };
    }, [pageState.from, pageState.name]);
    const routeMethods = taro_1.useMemo(() => {
        return {
            push(path, data = {}, redirect = false) {
                return new Promise((resolve, reject) => {
                    const queryObj = Object.assign(data, {
                        __from: pageState.name,
                    });
                    taro_1.default[redirect ? 'redirectTo' : 'navigateTo']({
                        url: `/pages/${path}/index?${query_string_1.default.stringify(queryObj, { encode: false })}`,
                        success: () => {
                            if (pageState.name) {
                                pageNavigationCallbacks.add({
                                    resolve,
                                    name: pageState.name,
                                });
                            }
                        },
                        fail: e => reject(e),
                    });
                });
            },
            redirect(path, data = {}) {
                this.push(path, data, true);
            },
            pop(data, delta = 1) {
                pageState.from && pageNavigationCallbacks.resolve(pageState.from, data);
                return taro_1.default.navigateBack({
                    delta,
                });
            },
            popToRoot() {
                return taro_1.default.navigateBack({ delta: pageState.depth - 1 });
            },
        };
    }, [pageState.from, pageState.name, pageState.depth]);
    return [pageState, routeMethods];
}
exports.default = useRouter;
