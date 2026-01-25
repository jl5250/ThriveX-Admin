import { useState, useEffect, useRef } from 'react';
import { Table, Button, Image, Form, Input, Tabs, Card, Popconfirm, message, Spin, Skeleton } from 'antd';
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
      width: 120,
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 200,
      align: 'center',
      render: (url: string) => <Image width={200} src={url} className="w-full rounded cursor-pointer" />,
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 130,
      render: (_: string, record: Swiper) => (
        <div className="space-x-2">
          <Button type="text" onClick={() => editSwiperData(record)} icon={<FormOutlined className="text-primary" />} />

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delSwiperData(record.id!)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
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

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);

      form.validateFields().then(async (values: Swiper) => {
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

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
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
          scroll={{ x: '1000px' }}
          pagination={{
            position: ['bottomCenter'],
            pageSize: 8,
          }}
          loading={loading}
          className="w-full"
        />
      ),
    },
    {
      label: swiper.id ? '编辑轮播图' : '新增轮播图',
      key: 'operate',
      children: (
        <Spin spinning={editLoading}>
          <h2 className="text-xl pb-4 text-center">{swiper.id ? '编辑轮播图' : '新增轮播图'}</h2>

          <Form form={form} layout="vertical" initialValues={swiper} onFinish={onSubmit} size="large" className="max-w-md mx-auto">
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
                {swiper.id ? '编辑轮播图' : '新增轮播图'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      ),
    },
  ];

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5 mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        {/* Tabs 和表格骨架屏 */}
        <Card className="border-stroke [&>.ant-card-body]:!pt-0 mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
          {/* Tabs 骨架屏 */}
          <div className="flex space-x-4 my-6">
            <Skeleton.Button active size="default" style={{ width: 120, height: 40 }} />
            <Skeleton.Button active size="default" style={{ width: 120, height: 40 }} />
          </div>

          {/* 表格骨架屏 */}
          <div className="mb-4">
            {/* 表格行骨架屏 - 模拟多行 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex items-center gap-4 mb-2 py-2 border-b border-gray-100">
                <Skeleton.Input active size="small" style={{ width: 60, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40, flex: 1 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 100, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 300, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40 }} />
              </div>
            ))}
          </div>
          
          {/* 分页骨架屏 */}
          <div className="flex justify-center my-5">
            <Skeleton.Input active size="default" style={{ width: 300, height: 32 }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="轮播图管理" />

      <Card className="border-stroke [&>.ant-card-body]:!pt-0 mt-2 min-h-[calc(100vh-160px)]">
        <Tabs activeKey={tab} onChange={handleTabChange} items={tabItems} />
      </Card>

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
