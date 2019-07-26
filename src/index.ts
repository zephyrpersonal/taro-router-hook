import Taro, { useState, useEffect, useMemo } from '@tarojs/taro'
import queryString from 'query-string'
import { getRouteName } from './utils'
import { PageNavigationCallback, PageState, Dictionary } from './types'

// 队列用于存放push/redirect的回调函数
const pageNavigationCallbacks = {
  __callbacks: [],
  add(callback: PageNavigationCallback) {
    this.__callbacks.push(callback)
  },
  resolve(name: string, data?: Dictionary<any> | null) {
    const callback = this.__callbacks.find((callback: PageNavigationCallback) => callback.name === name)
    if (callback) {
      callback.resolve(data)
    }
  },
  remove(name: string) {
    const index = this.__callbacks.findIndex((callback: PageNavigationCallback) => callback.name === name)
    if (index >= 0) {
      this.__callbacks.splice(index, 1)
    }
  },
  empty() {
    this.__callbacks = []
  },
}

const initialPageState = {
  name: null,
  query: null,
  from: null,
  route: null,
  depth: 0,
}

export default function useRouter() {
  const [pageState, updatePageState] = useState<PageState>(initialPageState) // 页面状态

  useEffect(() => {
    const routeStack = Taro.getCurrentPages() // 获取页面栈
    const pageOnTop = routeStack[routeStack.length - 1] || {} // 获取顶部页面
    const shortenPageName = getRouteName(pageOnTop.route) // 获取pageName
    const query = pageOnTop.options || {}
    updatePageState({
      name: shortenPageName,
      route: pageOnTop.route,
      query,
      from: query.__from,
      depth: routeStack.length,
    })
  }, [updatePageState])

  useEffect(() => {
    return () => {
      // 销毁时移除本页面的pushCallback，适用于popToRoot返回首页
      pageState.name && pageNavigationCallbacks.remove(pageState.name)
      // 销毁时移除上页的pushCallback，适用于左上角标题箭头返回
      pageState.from && pageNavigationCallbacks.remove(pageState.from)
    }
  }, [pageState.from, pageState.name])

  const routeMethods = useMemo(() => {
    return {
      push(path: string, data: Dictionary<any> = {}, redirect = false) {
        return new Promise((resolve, reject) => {
          const queryObj = Object.assign(data, {
            __from: pageState.name,
          })

          Taro[redirect ? 'redirectTo' : 'navigateTo']({
            url: `/pages/${path}/index?${queryString.stringify(queryObj, { encode: false })}`,
            success: () => {
              if (pageState.name) {
                pageNavigationCallbacks.add({
                  resolve,
                  name: pageState.name,
                })
              }
            },
            fail: e => reject(e),
          })
        })
      },
      redirect(path: string, data: Dictionary<string> = {}) {
        this.push(path, data, true)
      },
      pop(data: Dictionary<any> | null, delta: number = 1) {
        pageState.from && pageNavigationCallbacks.resolve(pageState.from, data)
        return Taro.navigateBack({
          delta,
        })
      },
      popToRoot() {
        return Taro.navigateBack({ delta: pageState.depth - 1 })
      },
    }
  }, [pageState.from, pageState.name, pageState.depth])

  return [pageState, routeMethods]
}
