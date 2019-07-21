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
const pageNavigationCallbacks = [];
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
        // 销毁时移除
        return () => {
            const index = pageNavigationCallbacks.findIndex(callback => callback.name === pageState.name);
            if (index >= 0) {
                pageNavigationCallbacks.splice(index, 1);
            }
        };
    }, [pageState.name]);
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
                                pageNavigationCallbacks.push({
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
                return new Promise((resolve, reject) => {
                    taro_1.default.navigateBack({
                        delta,
                        success: res => {
                            const storedCallbackIndex = pageNavigationCallbacks.findIndex(callback => callback.name === pageState.from);
                            if (storedCallbackIndex >= 0) {
                                pageNavigationCallbacks[storedCallbackIndex].resolve(data);
                                pageNavigationCallbacks.splice(storedCallbackIndex, 1);
                            }
                            resolve(res);
                        },
                        fail: reject,
                    });
                });
            },
            popToRoot() {
                return new Promise((resolve, reject) => {
                    taro_1.default.navigateBack({ delta: pageState.depth - 1, success: resolve, fail: reject });
                });
            },
        };
    }, [pageState.from, pageState.name, pageState.depth]);
    return [pageState, routeMethods];
}
exports.default = useRouter;
