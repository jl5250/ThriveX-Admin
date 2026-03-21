import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, Input, Popconfirm, message, Card, Modal, Select, Skeleton } from 'antd';
import { DeleteOutlined, FormOutlined, PoweroffOutlined, StarOutlined } from '@ant-design/icons';

import Title from '@/components/Title';
import { titleSty } from '@/styles/sty';
import type { Oss } from '@/types/app/oss';
import type { ColumnsType } from 'antd/es/table';
import { addOssDataAPI, delOssDataAPI, editOssDataAPI, getOssListAPI, enableOssDataAPI, disableOssDataAPI, getOssDataAPI, getOssPlatformListAPI } from '@/api/oss';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [oss, setOss] = useState<Oss>({} as Oss);
  const [ossList, setOssList] = useState<Oss[]>([]);
  const [platformList, setPlatformList] = useState<{ label: string; value: string; disabled: boolean }[]>([]);
  const [form] = Form.useForm();

  const columns: ColumnsType<Oss> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 120,
    },
    {
      title: '平台',
      dataIndex: 'platformName',
      key: 'platformName',
      align: 'center',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'isEnable',
      key: 'isEnable',
      align: 'center',
      width: 120,
      render: (isEnable: number) => (
        <div className="space-x-2">
          <span className={`inline-block w-3 h-3 ${isEnable ? 'bg-green-500' : 'bg-red-500'} rounded-full`} />
          <span>{isEnable ? '开启' : '禁用'}</span>
        </div>
      ),
    },
    {
      title: '地域',
      dataIndex: 'endPoint',
      key: 'endPoint',
      width: 200,
    },
    {
      title: '存储桶',
      dataIndex: 'bucketName',
      key: 'bucketName',
      width: 200,
    },
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 300,
    },
    {
      title: '文件目录',
      dataIndex: 'basePath',
      key: 'basePath',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_, record: Oss) => (
        <div className="flex justify-center space-x-2">
          {record.isEnable ? <Button type="text" disabled onClick={() => disableOssData(record.id!)} icon={<StarOutlined />} /> : <Button type="text" onClick={() => enableOssData(record.id!)} icon={<PoweroffOutlined />} />}

          <Button type="text" onClick={() => editOssData(record)} icon={<FormOutlined className="text-primary" />} />

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delOssData(record.id!)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 获取支持的平台列表
  const getOssPlatformList = async () => {
    // 获取已经使用的平台
    const selectPlatformList = ossList.map((item) => item.platform);

    const { data } = await getOssPlatformListAPI();
    setPlatformList(
      data.map((item) => ({
        label: item.name,
        value: item.value,
        // 限制一个平台只能添加一个
        disabled: selectPlatformList.includes(item.value),
      })),
    );
  };

  const getOssList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getOssListAPI();
      setOssList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getOssList();
    getOssPlatformList();
  }, []);

  const enableOssData = async (id: number) => {
    try {
      await enableOssDataAPI(id);
      getOssList();
      message.success('启用成功');
    } catch (error) {
      console.error(error);
    }
  };

  const disableOssData = async (id: number) => {
    try {
      await disableOssDataAPI(id);
      getOssList();
      message.success('禁用成功');
    } catch (error) {
      console.error(error);
    }
  };

  const editOssData = async (record: Oss) => {
    try {
      setEditLoading(true);

      setIsModalOpen(true);

      const { data } = await getOssDataAPI(record.id);
      setOss(data);
      form.setFieldsValue(data);

      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  const delOssData = async (id: number) => {
    try {
      await delOssDataAPI(id);
      getOssList();
      message.success('🎉 删除存储配置成功');
    } catch (error) {
      console.error(error);
    }
  };

  const addOssData = () => {
    setOss({} as Oss);
    form.resetFields();
    form.setFieldsValue({});
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);

      const values = await form.validateFields();

      if (oss.id) {
        await editOssDataAPI({ ...oss, ...values });
        message.success('🎉 编辑存储配置成功');
      } else {
        await addOssDataAPI(values);
        message.success('🎉 新增存储配置成功');
      }

      getOssList();
      setIsModalOpen(false);
      form.resetFields();

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-4">
          <div className="flex justify-between items-center">
            <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
            <Skeleton.Button active size="large" style={{ width: 120, height: 40 }} />
          </div>
        </Card>

        {/* 表格卡片骨架屏 */}
        <Card className={`${titleSty} min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!`}>
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
            <Skeleton.Input active size="medium" style={{ width: 300, height: 32 }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="存储管理">
        <Button type="primary" size="large" onClick={addOssData}>
          新增配置
        </Button>
      </Title>

      <Card className={`${titleSty} min-h-[calc(100vh-160px)]`}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={ossList}
          columns={columns}
          scroll={{ x: '1350px' }}
          pagination={{
            placement: ['bottomCenter'],
            pageSize: 8,
          }}
        />
      </Card>

      <Modal loading={editLoading} title={oss.id ? '编辑存储配置' : '新增存储配置'} open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={onSubmit} size="large" className="mt-6">
          {!oss.id && (
            <Form.Item label="选择平台" name="platform" className="w-full">
              <Select options={platformList} placeholder="请选择平台" allowClear />
            </Form.Item>
          )}

          {oss.platform !== 'local' && (
            <>
              <Form.Item
                label="Access Key"
                name="accessKey"
                rules={[
                  { required: true, message: 'Access Key 不能为空' },
                  { min: 10, max: 50, message: 'Access Key 限制在10~50个字符' },
                ]}
              >
                <Input placeholder="请输入Access Key" />
              </Form.Item>

              <Form.Item label="SecretKey" name="secretKey" rules={[{ required: true, message: 'SecretKey不能为空' }]}>
                <Input.Password placeholder="请输入SecretKey" />
              </Form.Item>

              <Form.Item label="地域" name="endPoint" rules={[{ required: true, message: '地域不能为空' }]}>
                <Input placeholder="请输入地域" />
              </Form.Item>

              <Form.Item label="存储桶" name="bucketName" rules={[{ required: true, message: '存储桶不能为空' }]}>
                <Input placeholder="请输入存储桶" />
              </Form.Item>
            </>
          )}

          <Form.Item label="域名" name="domain" rules={[{ required: true, message: '域名不能为空' }]}>
            <Input placeholder="请输入域名" />
          </Form.Item>

          {oss.platform !== 'local' && (
            <Form.Item label="文件目录" name="basePath" rules={[{ required: true, message: '文件目录不能为空' }]}>
              <Input placeholder="请输入文件目录" />
            </Form.Item>
          )}

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">
              {oss.id ? '保存修改' : '新增配置'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
