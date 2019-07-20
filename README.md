# Taro Router Hook

router hook for TaroJS

## Install

```bash
yarn add taro-router-hook
```

## Usage

```jsx
import useRouter from 'taro-router-hook'

const Component = () => {
  const [routeState, router] = useRouter()

  return <View>// jsx here</View>
}
```

### routeState

由于 Taro 的组件初始化和路由机制，请注意做好安全取值方案

routeState 的默认值为 `{route: null, name: null, from: null, query: null, depth: 0}`

- `route` 原生路由名称 /page/{pageName}/index 默认值 null

- `name` 简短的 pageName 默认值 null

- `from` 上一个页面的 pageName 默认值 null

- `query` 传入的路由参数对象 默认值 null

- `depth` 当前路由栈深度 默认值 0

### router

路由方法集合

- `push(pageName: string, query?: Object): Promise<any>`

- `redirect(pageName: string, query?: Object): Promise<any>`

- `pop(data?: Object, delta?: number = 1): Promise<any>`

- `popToRoot(): Promise<any>`

## Example

In PageA (src/pages/pageA/index.jsx)

```jsx
import useRouter from 'taro-router-hook'

const PageA = () => {
  const [routeState, router] = useRouter()

  // 状态对象
  // routeState = {
  //   route: 'pages/pageA/index',
  //   name: 'pageA',
  //   query: {},
  //   from: null,
  //   depth: 1
  // }

  return (
    <View>
      <Button onClick={() => {
        const resp = await router.push('pageA', {hello: 'world'})
        // when PageB call pop, resp will be assigned with {foo: 'bar'}
      }}>To PageB</Button>
    </View>
  )
}
```

In PageB (src/pages/pageB/index.jsx)

```jsx
import useRouter from 'taro-router-hook'

const PageB = () => {
  const [routeState, router] = useRouter()

  // 状态对象
  // routeState = {
  //   route: 'pages/pageB/index',
  //   name: 'pageB',
  //   query: {hello: 'world'},
  //   from: pageA,
  //   depth: 2
  // }

  return (
    <View>
      <Button
        onClick={() => {
          router.pop({ foo: 'bar' })
        }}
      >
        Back
      </Button>
    </View>
  )
}
```

## TODO

- Unit Test
