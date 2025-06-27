import Request from '@/utils/request';

type StatisType = "overview" | "new-visitor" | "basic-overview" | "distribution";

// overview(概览趋势), new-visitor(新访客趋势), basic-overview(基础概览趋势), distribution(地域分布)
// 获取 PV量、IP量、跳出率、平均访问时长
export const getStatisAPI = (type: StatisType, startDate: string, endDate: string) => Request("GET", `/baidu/data`, {
  params: {
    startDate,
    endDate,
    type
  },
})