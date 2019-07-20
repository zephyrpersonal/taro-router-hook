import { PageState, Dictionary } from './types';
export default function useRouter(): (PageState | {
    push(path: string, data?: Dictionary<string>, redirect?: boolean): Promise<unknown>;
    redirect(path: string, data?: Dictionary<string>): void;
    pop(data: Dictionary<string>, delta?: number): Promise<unknown>;
    popToRoot(): Promise<unknown>;
})[];
