import { PageState, Dictionary } from './types';
export default function useRouter(): (PageState | {
    push(path: string, data?: Dictionary<any>, redirect?: boolean): Promise<unknown>;
    redirect(path: string, data?: Dictionary<string>): void;
    pop(data: Dictionary<any> | null, delta?: number): Promise<any>;
    popToRoot(): Promise<any>;
})[];
