import { useEffect, useState, useCallback } from 'react'
import { Spin, Table } from 'antd'
import dayjs from 'dayjs'
import { getStatisAPI } from '@/api/Statis'
import * as echarts from 'echarts'

interface RegionData {
  name: string
  value: number
}

const RegionDistribution = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RegionData[]>([])
  const endDate = dayjs(new Date()).format('YYYY/MM/DD')
  const startDate = dayjs(new Date()).subtract(6, 'day').format('YYYY/MM/DD')

  const getRegionData = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await getStatisAPI('distribution', startDate, endDate)
      console.log('获取地域分布数据', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { result } = data as any

      // 解析数据
      const regionList: RegionData[] = result.items[1].map((item: string[], idx: number) => {
        const name = result.items[0][idx][0].name
        // 根据省份名称添加对应的后缀
        let fullName = name
        if (['北京', '天津', '上海', '重庆'].includes(name)) {
          fullName = name + '市'
        } else if (['内蒙古', '广西', '西藏', '宁夏', '新疆'].includes(name)) {
          fullName = name + '自治区'
        } else if (['香港', '澳门'].includes(name)) {
          fullName = name + '特别行政区'
        } else {
          fullName = name + '省'
        }
        return {
          name: fullName,
          value: item[0]
        }
      })
      console.log('regionList', regionList)
      setLoading(false)
      setData(regionList)
    } catch {
      setLoading(false)
      setData([])
    }
  }, [startDate])

  useEffect(() => {
    getRegionData()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const chartDom = document.getElementById('mapChart')
      if (chartDom) {
        const myChart = echarts.init(chartDom)
        // 动态加载中国地图数据
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
          .then((response) => response.json())
          .then((chinaJson) => {
            echarts.registerMap('china', chinaJson)
            const option = {
              title: {
                text: '地域分布',
                left: 'center'
              },
              tooltip: {
                trigger: 'item' as const,
                formatter: '{b}: {c}'
              },
              visualMap: [
                {
                  min: 0,
                  max: Math.max(...data.map((item) => item.value)),
                  left: 'left',
                  top: 'bottom',
                  text: ['高', '低'],
                  calculable: true,
                  inRange: {
                    color: ['#e0f3f8', '#045a8d']
                  }
                }
              ],
              series: [
                {
                  name: '访问量',
                  type: 'map',
                  map: 'china',
                  roam: true,
                  emphasis: {
                    label: {
                      show: true
                    }
                  },
                  data: data
                }
              ]
            }
            myChart.setOption(option)
          })

        // 组件卸载时销毁 echarts 实例
        return () => {
          myChart.dispose()
        }
      }
    }
  }, [data])

  const columns = [
    {
      title: '省份',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '访问量',
      dataIndex: 'value',
      key: 'value',
      sorter: (a: RegionData, b: RegionData) => a.value - b.value
    }
  ]

  return (
    <div className="col-span-12 rounded-2xl border border-stroke px-5 pt-7.5 pb-5 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient sm:px-7.5">
      <Spin spinning={loading}>
        <h5 className="text-xl font-semibold text-black dark:text-white mb-4">地域分布</h5>
        <div className="flex gap-4">
          <div className="w-2/3">
            <div id="mapChart" style={{ height: 350 }} />
          </div>
          <div className="w-1/3">
            <Table
              dataSource={data}
              columns={columns}
              rowKey="name"
              pagination={false}
              size="small"
              scroll={{ y: 350 }}
            />
          </div>
        </div>
      </Spin>
    </div>
  )
}

export default RegionDistribution
