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
    // 由于taro设计缺陷
    // https://nervjs.github.io/taro/docs/best-practice.html#%E7%BB%84%E4%BB%B6%E7%9A%84-constructor-%E4%B8%8E-render-%E6%8F%90%E5%89%8D%E8%B0%83%E7%94%A8
    // hook第一次执行时还获取不到路由信息
    // 故延迟执行
    setTimeout(() => {
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
    }, 0)
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
