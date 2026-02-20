import { useState, useEffect, useRef } from 'react';
import { Table, Button, Image, Form, Input, Tabs, Popconfirm, message, Spin, Tooltip, Divider, Space } from 'antd';
import { getSwiperListAPI, addSwiperDataAPI, editSwiperDataAPI, delSwiperDataAPI, getSwiperDataAPI } from '@/api/swiper';
import { Swiper } from '@/types/app/swiper';
import Title from '@/components/Title';
import { ColumnsType } from 'antd/es/table';
import { CloudUploadOutlined, DeleteOutlined, FormOutlined, PictureOutlined } from '@ant-design/icons';
import Material from '@/components/Material';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [form] = Form.useForm();

  const [swiper, setSwiper] = useState<Swiper>({} as Swiper);
  const [list, setList] = useState<Swiper[]>([]);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [tab, setTab] = useState<string>('list');

  const columns: ColumnsType<Swiper> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 200,
      align: 'center',
      render: (url: string) => <Image width={180} src={url} className="w-full rounded cursor-pointer" alt="" />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 230,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="line-clamp-1 text-gray-700 dark:text-gray-200 font-medium hover:text-primary cursor-pointer">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string) => (
        <>
          {text ? (
            <Tooltip title={text}>
              <span className="line-clamp-1 text-gray-600 dark:text-gray-300 hover:text-primary cursor-pointer">{text}</span>
            </Tooltip>
          ) : (
            <span className="text-gray-300 dark:text-gray-500 italic">暂无描述</span>
          )}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 130,
      render: (_: string, record: Swiper) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip title="编辑">
            <Button type="text" onClick={() => editSwiperData(record)} icon={<FormOutlined className="text-blue-500" />} />
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delSwiperData(record.id!)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getSwiperList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getSwiperListAPI();
      setList(data as Swiper[]);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getSwiperList();
  }, []);

  const editSwiperData = async (record: Swiper) => {
    try {
      setEditLoading(true);
      setTab('operate');

      const { data } = await getSwiperDataAPI(record.id);
      setSwiper(data);
      form.setFieldsValue(record);

      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  const delSwiperData = async (id: number) => {
    try {
      setBtnLoading(true);
      await delSwiperDataAPI(id);
      getSwiperList();
      message.success('🎉 删除轮播图成功');
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);
      await form.validateFields().then(async (values: Swiper) => {
        if (swiper.id) {
          await editSwiperDataAPI({ ...swiper, ...values });
          message.success('🎉 编辑轮播图成功');
        } else {
          await addSwiperDataAPI({ ...swiper, ...values });
          message.success('🎉 新增轮播图成功');
        }

        getSwiperList();
        setTab('list');
        form.resetFields();
        setSwiper({} as Swiper);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setTab(key);
    form.resetFields();
    setSwiper({} as Swiper);
  };

  // 文件上传
  const UploadBtn = () => <CloudUploadOutlined className="text-xl cursor-pointer" onClick={() => setIsMaterialModalOpen(true)} />;

  const tabItems = [
    {
      label: '轮播图列表',
      key: 'list',
      children: (
        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 900 }}
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
          className="[&_.ant-table-thead>tr>th]:!bg-gray-50 dark:[&_.ant-table-thead>tr>th]:!bg-boxdark-2 [&_.ant-table-thead>tr>th]:!font-medium [&_.ant-table-thead>tr>th]:!text-gray-500 dark:[&_.ant-table-thead>tr>th]:!text-gray-400 w-full"
        />
      ),
    },
    {
      label: swiper.id ? '编辑轮播图' : '新增轮播图',
      key: 'operate',
      children: (
        <Spin spinning={editLoading}>
          <h2 className="text-xl pb-4 pt-8 text-center text-gray-800 dark:text-gray-100">{swiper.id ? '编辑轮播图' : '新增轮播图'}</h2>

          <Form form={form} layout="vertical" initialValues={swiper} onFinish={onSubmit} size="large" className="max-w-md mx-auto px-6 pb-6">
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '轮播图标题不能为空' }]}>
              <Input placeholder="要么沉沦 要么巅峰!" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input placeholder="Either sink or peak!" />
            </Form.Item>

            <Form.Item label="链接" name="url">
              <Input placeholder="https://liuyuyang.net/" />
            </Form.Item>

            <Form.Item label="图片" name="image" rules={[{ required: true, message: '轮播图地址不能为空' }]}>
              <Input placeholder="https://liuyuyang.net/swiper.jpg" prefix={<PictureOutlined />} addonAfter={<UploadBtn />} className="customizeAntdInputAddonAfter" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      ),
    },
  ];

  // 初始加载时显示骨架屏（与 article 一致）
  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>

        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="flex gap-4 mb-6">
            <div className="skeleton h-9 rounded-md" style={{ width: 120 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 140 }} />
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
      <Title value="轮播图管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark overflow-hidden">
        <Tabs activeKey={tab} onChange={handleTabChange} items={tabItems} className="[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-6 [&_.ant-tabs-nav]:pt-4 [&_.ant-tabs-nav]:bg-gray-50/30 dark:[&_.ant-tabs-nav]:bg-boxdark-2/50 [&_.ant-tabs-content]:pt-0" />
      </div>

      <Material
        // multiple
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('image', url.join('\n'));
          form.validateFields(['image']); // 手动触发 image 字段的校验
        }}
      />
    </div>
  );
};
