import Request from '@/utils/request'

// 获取项目配置
export const getConfigDataAPI = <T>(type: string) => Request<T>("GET", `/config/list/${type}`)

// 修改项目配置
export const editConfigDataAPI = (type: string, data: object) => Request<{ [string: string]: string }>("PATCH", `/config/${type}`, { data })