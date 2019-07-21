import Taro, { useState, useEffect, useMemo } from '@tarojs/taro'
import queryString from 'query-string'
import { getRouteName } from './utils'
import { PageNavigationCallback, PageState, Dictionary } from './types'

// 队列用于存放push/redirect的回调函数
const pageNavigationCallbacks: PageNavigationCallback[] = []

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
    // 销毁时移除
    return () => {
      const index = pageNavigationCallbacks.findIndex(callback => callback.name === pageState.name)
      if (index >= 0) {
        pageNavigationCallbacks.splice(index, 1)
      }
    }
  }, [pageState.name])

  const routeMethods = useMemo(() => {
    return {
      push(path: string, data: Dictionary<string> = {}, redirect = false) {
        return new Promise((resolve, reject) => {
          const queryObj = Object.assign(data, {
            __from: pageState.name,
          })

          Taro[redirect ? 'redirectTo' : 'navigateTo']({
            url: `/pages/${path}/index?${queryString.stringify(queryObj, { encode: false })}`,
            success: () => {
              if (pageState.name) {
                pageNavigationCallbacks.push({
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
      pop(data: Dictionary<string>, delta: number = 1) {
        return new Promise((resolve, reject) => {
          Taro.navigateBack({
            delta,
            success: res => {
              const storedCallbackIndex = pageNavigationCallbacks.findIndex(
                callback => callback.name === pageState.from
              )
              if (storedCallbackIndex >= 0) {
                pageNavigationCallbacks[storedCallbackIndex].resolve(data)
                pageNavigationCallbacks.splice(storedCallbackIndex, 1)
              }
              resolve(res)
            },
            fail: reject,
          })
        })
      },
      popToRoot() {
        return new Promise((resolve, reject) => {
          Taro.navigateBack({ delta: pageState.depth - 1, success: resolve, fail: reject })
        })
      },
    }
  }, [pageState.from, pageState.name, pageState.depth])

  return [pageState, routeMethods]
}
