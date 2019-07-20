export interface Dictionary<T> {
  [key: string]: T;
}

export interface PageQuery {
  __from?: string | null;

  [key: string]: any;
}

export interface PageState {
  name: string | null;
  query: Dictionary<string> | null;
  from: string | null;
  route: string | null;
  depth: number;
}

export interface PageNavigationCallback {
  name: string;
  resolve: Function;
}
