// 对象转url参数
export const ObjectToUrlParam = (obj: Object): string => {
    return obj && new URLSearchParams(
        Object.keys(obj).reduce((acc, key) => {
            acc[key] = String(obj[key as keyof Object]);
            return acc;
        }, {} as Record<string, string>)
    ).toString();
}