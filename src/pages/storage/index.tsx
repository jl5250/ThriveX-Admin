import { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, Popconfirm, message, Card, Modal, Select, Skeleton, Switch, Tooltip } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  FolderOutlined,
  GlobalOutlined,
  CloudOutlined,
  PlusOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

import Title from '@/components/Title';
import type { Oss } from '@/types/app/oss';
import { addOssDataAPI, delOssDataAPI, editOssDataAPI, getOssListAPI, enableOssDataAPI, disableOssDataAPI, getOssDataAPI, getOssPlatformListAPI } from '@/api/oss';
import StatusTag from '@/components/StatusTag';

export default () => {
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [oss, setOss] = useState<Oss>({} as Oss);
  const [ossList, setOssList] = useState<Oss[]>([]);
  const [platformList, setPlatformList] = useState<{ label: string; value: string; disabled: boolean }[]>([]);
  const [form] = Form.useForm();
  const [testingMap, setTestingMap] = useState<Record<number, boolean>>({});
  const [switchLoadingMap, setSwitchLoadingMap] = useState<Record<number, boolean>>({});

  // 获取平台图标
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'local':
        return <FolderOutlined className="text-4xl text-yellow-500" />;
      case 'webdav':
        return <GlobalOutlined className="text-4xl text-blue-500" />;
      case 'minio':
        return <DatabaseOutlined className="text-4xl text-blue-600" />;
      case 'qiniu':
        return <CloudServerOutlined className="text-4xl text-blue-500" />;
      case 'tencent':
        return <CloudOutlined className="text-4xl text-blue-400" />;
      case 'aliyun':
        return <CloudOutlined className="text-4xl text-orange-500" />;
      default:
        return <CloudOutlined className="text-4xl text-blue-500" />;
    }
  };

  // 测试连接
  const testConnection = async (record: Oss) => {
    setTestingMap((prev) => ({ ...prev, [record.id!]: true }));
    try {
      // TODO: 实现测试连接的 API 调用
      // 这里暂时模拟测试
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('测试连接成功');
    } catch {
      message.error('测试连接失败');
    } finally {
      setTestingMap((prev) => ({ ...prev, [record.id!]: false }));
    }
  };

  // 获取支持的平台列表
  const getOssPlatformList = async () => {
    // 获取已经使用的平台（排除当前正在编辑的平台）
    const selectPlatformList = ossList
      .filter((item) => !oss.id || item.id !== oss.id) // 编辑模式下，排除当前编辑项
      .map((item) => item.platform);

    const { data } = await getOssPlatformListAPI();
    setPlatformList(
      data.map((item) => {
        return (
          {
            label: item.name,
            value: item.value,
            // 已添加的平台禁用
            disabled: selectPlatformList.includes(item.value),
          }
        )
      }),
    );
  };

  const getOssList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      }

      const { data } = await getOssListAPI();
      setOssList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    getOssList();
  }, []);

  useEffect(() => {
    getOssPlatformList();
  }, [ossList]);

  const enableOssData = async (id: number) => {
    try {
      setSwitchLoadingMap((prev) => ({ ...prev, [id]: true }));

      await enableOssDataAPI(id);
      await getOssList();
      message.success('启用成功');
    } catch (error) {
      console.error(error);
      message.error('启用失败');
    } finally {
      setSwitchLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const disableOssData = async (id: number) => {
    try {
      setSwitchLoadingMap((prev) => ({ ...prev, [id]: true }));

      await disableOssDataAPI(id);
      await getOssList();
      message.success('禁用成功');
    } catch (error) {
      console.error(error);
      message.error('禁用失败');
    } finally {
      setSwitchLoadingMap((prev) => ({ ...prev, [id]: false }));
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
      await getOssList();
      await getOssPlatformList();
      message.success('🎉 删除成功');
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
    setOss({} as Oss);
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);

      const values = await form.validateFields();

      if (oss.id) {
        await editOssDataAPI({ ...oss, ...values });
        message.success('🎉 编辑成功');
      } else {
        await addOssDataAPI(values);
        message.success('🎉 新增成功');
      }

      await getOssList();
      await getOssPlatformList();
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
        <Title value="存储管理" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="shadow-md">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title value="存储管理" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {/* 存储配置卡片 */}
        {ossList.map((record) => (
          <div
            key={record.id}
            className={`bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow ${record.isEnable ? 'border-2 border-green-500' : 'border border-gray-200'
              }`}
          >
            {/* 标题区域 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPlatformIcon(record.platform)}
                <div>
                  <div className="font-semibold text-lg">
                    {record.platform === 'local'
                      ? '本地存储'
                      : (record.platformName || record.platform)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {record.platform === 'local'
                      ? '本地存储'
                      : (record.platform === 'webdav' ? 'WebDAV' : record.platformName || '云存储')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StatusTag status={record.isEnable} />
              </div>
            </div>

            {/* 内容区域 */}
            <div className="mb-4 space-y-2">
              <div>
                <div className="text-xs text-gray-600 mb-2">存储路径</div>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{record.basePath || '/uploads'}</div>
              </div>
            </div>

            {/* 操作按钮区域 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Tooltip title="测试连接">
                  <Button
                    icon={<LinkOutlined />}
                    loading={testingMap[record.id!]}
                    onClick={() => testConnection(record)}
                    className="flex items-center"
                  >
                    测试
                  </Button>
                </Tooltip>

                <Tooltip title="编辑配置">
                  <Button
                    color="primary"
                    icon={<EditOutlined />}
                    onClick={() => editOssData(record)}
                    className="flex items-center"
                  >
                    编辑
                  </Button>
                </Tooltip>

                <Popconfirm
                  title="警告"
                  description="你确定要删除吗"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={() => delOssData(record.id!)}
                >
                  <Tooltip title="编辑配置">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      className="flex items-center"
                    >
                      删除
                    </Button>
                  </Tooltip>
                </Popconfirm>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={!!record.isEnable}
                  loading={switchLoadingMap[record.id!]}
                  onChange={(checked) => {
                    if (checked) {
                      enableOssData(record.id!);
                    } else {
                      disableOssData(record.id!);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* 添加存储配置卡片 */}
        <div
          className="group flex flex-col justify-center items-center bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary"
          onClick={addOssData}
        >
          <PlusOutlined className="text-4xl text-gray-400 mb-4 group-hover:text-primary" />
          <div className="text-lg font-semibold text-gray-600 mb-2 group-hover:text-primary">添加存储配置</div>
          <div className="text-sm text-gray-400 group-hover:text-primary">支持多种云存储服务</div>
        </div>
      </div>

      <Modal loading={editLoading} title={oss.id ? '编辑存储' : '新增存储'} open={isModalOpen} onCancel={handleCancel} footer={null}>
        <Form form={form} layout="vertical" onFinish={onSubmit} size="large" className="mt-6">
          {!oss.id && (
            <Form.Item label="选择平台" name="platform" rules={[{ required: true, message: '平台不能为空' }]} className="w-full">
              <Select options={platformList} placeholder="请选择平台" allowClear />
            </Form.Item>
          )}

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.platform !== currentValues.platform || oss.platform !== currentValues.platform}>
            {({ getFieldValue }) => {
              const platform = getFieldValue('platform') || oss.platform;
              return platform !== 'local' ? (
                <>
                  <Form.Item
                    label="Access Key"
                    name="accessKey"
                    rules={[
                      { required: true, message: 'Access Key 不能为空' },
                      { min: 10, max: 50, message: 'Access Key 限制在10~50个字符' },
                    ]}
                  >
                    <Input placeholder="请输入Access Key" autoComplete="off" />
                  </Form.Item>

                  <Form.Item label="SecretKey" name="secretKey" rules={[{ required: true, message: 'SecretKey不能为空' }]}>
                    <Input.Password placeholder="请输入SecretKey" autoComplete="new-password" />
                  </Form.Item>

                  <Form.Item label="地域" name="endPoint" rules={[{ required: true, message: '地域不能为空' }]}>
                    <Input placeholder="请输入地域" />
                  </Form.Item>

                  <Form.Item label="存储桶" name="bucketName" rules={[{ required: true, message: '存储桶不能为空' }]}>
                    <Input placeholder="请输入存储桶" />
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>

          <Form.Item label="域名" name="domain" rules={[{ required: true, message: '域名不能为空' }]}>
            <Input placeholder="请输入域名" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.platform !== currentValues.platform || oss.platform !== currentValues.platform}>
            {({ getFieldValue }) => {
              const platform = getFieldValue('platform') || oss.platform;
              return (
                <Form.Item
                  label={platform === 'local' ? '存储路径' : '文件目录'}
                  name="basePath"
                  rules={[{ required: true, message: platform === 'local' ? '存储路径不能为空' : '文件目录不能为空' }]}
                >
                  <Input placeholder={platform === 'local' ? '请输入存储路径，如：/uploads' : '请输入文件目录'} />
                </Form.Item>
              );
            }}
          </Form.Item>

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
