import { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, notification, Popconfirm, Form, Input, DatePicker, Modal, Spin, message, Tooltip, Space, Divider } from 'antd';
import { GiPositionMarker } from 'react-icons/gi';
import { IoSearch } from 'react-icons/io5';
import dayjs from 'dayjs';
import axios from 'axios';
import { CloudUploadOutlined, DeleteOutlined, FormOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';

import Title from '@/components/Title';
import Material from '@/components/Material';
import { delFootprintDataAPI, getFootprintListAPI, addFootprintDataAPI, editFootprintDataAPI, getFootprintDataAPI } from '@/api/footprint';
import { getEnvConfigDataAPI } from '@/api/config';
import type { FilterForm, Footprint } from '@/types/app/footprint';
import { ColumnType } from 'antd/es/table';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [gaodeApKey, setGaodeApKey] = useState<string>('');
  const [footprintList, setFootprintList] = useState<Footprint[]>([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [footprint, setFootprint] = useState<Footprint>({} as Footprint);
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');
  const [form] = Form.useForm();

  const [filterForm] = Form.useForm();

  const onFilterReset = () => {
    filterForm.resetFields();
    getFootprintList();
  };

  const columns: ColumnType<Footprint>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (text: string) => <span className="text-gray-700 dark:text-gray-200 font-medium">{text || '-'}</span>,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 220,
      ellipsis: true,
      render: (text: string) => (
        <div>
          {text ? (
            <Tooltip title={text}>
              <div className="max-w-[220px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">
                {text}
              </div>
            </Tooltip>
          ) : (
            <span className="text-gray-300 dark:text-gray-500 italic">暂无地址</span>
          )}
        </div>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 320,
      render: (value: string) => (
        <div>
          {value ? (
            <Tooltip title={value}>
              <div className="max-w-[320px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">
                {value}
              </div>
            </Tooltip>
          ) : (
            <span className="text-gray-300 dark:text-gray-500 italic">暂无内容</span>
          )}
        </div>
      ),
    },
    {
      title: '坐标',
      dataIndex: 'position',
      key: 'position',
      align: 'center',
      width: 160,
      render: (value: string) => <Tag className="!m-0">{value || '-'}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: (text: string) => (
        <div className="flex flex-col">
          <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(+text).format('YYYY-MM-DD')}</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(+text).format('HH:mm:ss')}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_: string, record: Footprint) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip title="编辑">
            <Button type="text" onClick={() => editFootprintData(record.id!)} icon={<FormOutlined className="text-primary" />} />
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delFootprintData(record.id!)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const { RangePicker } = DatePicker;

  // 获取高德地图秘钥
  const getEnvConfigData = async () => {
    const { data } = await getEnvConfigDataAPI('gaode_coordinate');
    setGaodeApKey((data.value as { key: string }).key);
  };

  const getFootprintList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getFootprintListAPI();
      setFootprintList(data as Footprint[]);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getEnvConfigData();
    getFootprintList();
  }, []);

  const reset = () => {
    setIsMethod('create');
    form.resetFields();
    setFootprint({} as Footprint);
    setIsModelOpen(false);
  };

  const delFootprintData = async (id: number) => {
    try {
      setLoading(true);
      await delFootprintDataAPI(id);
      notification.success({ message: '🎉 删除足迹成功' });
      getFootprintList();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addFootprintData = () => {
    setIsMethod('create');
    setIsModelOpen(true);
    form.resetFields();
    setFootprint({} as Footprint);
  };

  const editFootprintData = async (id: number) => {
    try {
      setEditLoading(true);

      setIsMethod('edit');
      setIsModelOpen(true);

      const { data } = await getFootprintDataAPI(id);

      data.images = (data.images as string[]).join('\n');
      data.createTime = dayjs(+data.createTime);

      setFootprint(data);
      form.setFieldsValue(data);

      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);
      await form.validateFields().then(async (values: Footprint) => {
        values.createTime = values.createTime.valueOf();
        values.images = values.images ? (values.images as string).split('\n') : [];

        if (isMethod === 'edit') {
          await editFootprintDataAPI({ ...footprint, ...values });
          message.success('🎉 修改足迹成功');
        } else {
          await addFootprintDataAPI({ ...footprint, ...values });
          message.success('🎉 新增足迹成功');
        }

        getFootprintList();
        reset();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const closeModel = () => reset();

  const onFilterSubmit = async (values: FilterForm) => {
    try {
      setLoading(true);
      const query = {
        key: values.address,
        startDate: values.createTime?.[0]?.valueOf()?.toString(),
        endDate: values.createTime?.[1]?.valueOf()?.toString(),
      };
      const { data } = await getFootprintListAPI({ query });
      setFootprintList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 通过详细地址获取纬度
  const getGeocode = async () => {
    try {
      setSearchLoading(true);

      const address = form.getFieldValue('address');

      const { data } = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
        params: {
          address,
          key: gaodeApKey,
        },
      });

      if (data.geocodes.length > 0) {
        const location = data.geocodes[0].location;
        form.setFieldValue('position', location);

        // 立即触发校验
        form.validateFields(['position']);

        setSearchLoading(false);
        return data.geocodes[0].location;
      } else {
        setSearchLoading(false);
        message.warning('未找到该地址的经纬度');
      }
    } catch (error) {
      console.error(error);
      setSearchLoading(false);
    }
  };

  // 初始加载时显示骨架屏（与 article 一致）
  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>

        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="flex justify-between mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="skeleton h-9" style={{ width: 200 }} />
              <div className="skeleton h-9" style={{ width: 280 }} />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 mb-4 items-center">
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 rounded" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Title value="足迹管理">
        <Button type="primary" onClick={addFootprintData}>
          新增足迹
        </Button>
      </Title>

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          <Form form={filterForm} layout="inline" onFinish={onFilterSubmit} className="!flex !flex-wrap !items-center !gap-y-2.5">
            <Form.Item name="address" className="!mb-0">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                placeholder="搜索地址..."
                className="!w-[220px]"
                allowClear
              />
            </Form.Item>
            <Form.Item name="createTime" className="!mb-0">
              <RangePicker
                className="!w-[260px]"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ClearOutlined />} onClick={onFilterReset}>
                重置
              </Button>
            </div>
          </Form>
        </div>

        <Table
          rowKey="id"
          dataSource={footprintList}
          columns={columns}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            position: ['bottomRight'],
            pageSize: 8,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                共 {totalCount} 条数据
              </div>
            ),
            className: '!px-6 !py-4',
          }}
          className="[&_.ant-table-thead>tr>th]:!bg-gray-50 dark:[&_.ant-table-thead>tr>th]:!bg-boxdark-2 [&_.ant-table-thead>tr>th]:!font-medium [&_.ant-table-thead>tr>th]:!text-gray-500 dark:[&_.ant-table-thead>tr>th]:!text-gray-400"
        />
      </div>

      <Modal loading={editLoading} title={isMethod === 'edit' ? '编辑足迹' : '新增足迹'} open={isModelOpen} onCancel={closeModel} destroyOnClose footer={null}>
        <Spin spinning={searchLoading}>
          <Form form={form} layout="vertical" initialValues={footprint} size="large" preserve={false} className="mt-6">
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '标题不能为空' }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>

            <Form.Item
              label="地址"
              name="address"
              rules={[{ required: true, message: '地址不能为空' }]}
            >
              <Input placeholder="请输入地址" />
            </Form.Item>

            <Form.Item label="坐标纬度" name="position" rules={[{ required: true, message: '坐标纬度不能为空' }]}>
              <Input placeholder="请输入坐标纬度" prefix={<GiPositionMarker />} addonAfter={<IoSearch onClick={getGeocode} className="cursor-pointer" />} />
            </Form.Item>

            <div className="relative">
              <Form.Item label="图片" name="images">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} placeholder="请输入图片链接" />
              </Form.Item>

              <div onClick={() => setIsMaterialModalOpen(true)} className="absolute bottom-2 right-2 bg-white rounded-full border border-stroke cursor-pointer">
                <CloudUploadOutlined className="text-xl hover:text-primary transition-colors p-2" />
              </div>
            </div>

            <Form.Item label="内容" name="content">
              <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} placeholder="请输入内容" />
            </Form.Item>

            <Form.Item label="时间" name="createTime" rules={[{ required: true, message: '时间不能为空' }]} className="!mb-4">
              <DatePicker showTime placeholder="请选择时间" className="w-full" />
            </Form.Item>

            <Form.Item className="!mb-0 w-full">
              <Button type="primary" onClick={onSubmit} loading={btnLoading} className="w-full">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Material
        multiple
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('images', url.join('\n'));
          form.validateFields(['images']);
        }}
      />
    </div>
  );
};
