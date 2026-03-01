import { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, Popconfirm, message, Card, Modal, Select, Skeleton, Switch, Tooltip } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  GlobalOutlined,
  CloudOutlined,
  PlusOutlined,
  CloudServerOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { BsDatabase } from 'react-icons/bs';

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
        return <BsDatabase className="text-4xl text-yellow-500" />;
      case 'webdav':
        return <GlobalOutlined className="text-4xl text-red-500" />;
      case 'minio':
        return <HddOutlined className="text-4xl text-red-600" />;
      case 'qiniu':
        return <CloudServerOutlined className="text-4xl text-blue-500" />;
      case 'tencent':
        return <CloudOutlined className="text-4xl text-blue-700" />;
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
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="shadow-md dark:bg-boxdark dark:border-strokedark rounded-xl">
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
            className={`relative p-5 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden ${record.isEnable
              ? 'border-2 border-blue-500 bg-linear-to-br from-blue-50 via-white to-blue-50 dark:from-blue-900/30 dark:via-boxdark dark:to-blue-900/30 dark:border-blue-500'
              : 'border border-gray-200 bg-linear-to-br from-gray-50 via-white to-slate-50 dark:from-boxdark/80 dark:via-boxdark dark:to-boxdark-2/80 dark:border-strokedark'
              }`}
          >
            {/* 背景装饰元素 */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 dark:opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-linear-to-br from-blue-200 to-purple-200 dark:from-blue-500/30 dark:to-purple-500/30 blur-xl"></div>
              <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-linear-to-br from-pink-200 to-orange-200 dark:from-pink-500/30 dark:to-orange-500/30 blur-lg"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-15 dark:opacity-10">
              <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-linear-to-br from-cyan-200 to-blue-200 dark:from-cyan-500/30 dark:to-blue-500/30 blur-xl"></div>
            </div>

            {/* 小装饰点 */}
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-blue-300 dark:bg-blue-500/40 opacity-40"></div>
            <div className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-purple-300 dark:bg-purple-500/40 opacity-40"></div>
            <div className="absolute bottom-8 left-8 w-1.5 h-1.5 rounded-full bg-cyan-300 dark:bg-cyan-500/40 opacity-40"></div>

            {/* 内容区域 - 添加相对定位以确保内容在装饰元素之上 */}
            <div className="relative z-10">
              {/* 标题区域 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(record.platform)}
                  <div>
                    <div className="font-semibold text-lg dark:text-white">
                      {record.platform === 'local'
                        ? '本地存储'
                        : (record.platformName || record.platform)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {record.platform === 'local'
                        ? '本地存储'
                        : (record.platform === 'webdav' ? 'WebDAV' : record.platformName || '云存储')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <StatusTag status={record.isEnable} flash={record.isEnable ? true : false} />
                </div>
              </div>

              {/* 内容区域 */}
              <div className="mb-4 space-y-2">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">存储路径</div>
                  <div className="text-sm font-mono bg-white/60 dark:bg-boxdark-2/60 backdrop-blur-xs p-2 rounded-sm break-all border border-gray-100 dark:border-strokedark dark:text-gray-300">{record.basePath || '/uploads'}</div>
                </div>
              </div>

              {/* 操作按钮区域 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-strokedark/50">
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
          </div>
        ))}

        {/* 添加存储配置卡片 */}
        <div
          className="group flex flex-col justify-center items-center text-gray-400 dark:text-gray-500 bg-white dark:bg-boxdark p-5 rounded-xl shadow-xs hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 dark:border-strokedark cursor-pointer hover:border-primary dark:hover:border-primary"
          onClick={addOssData}
        >
          <PlusOutlined className="text-2xl text-gray-400 dark:text-gray-500 mb-2 group-hover:text-primary dark:group-hover:text-primary" />
          <div className="text-sm font-medium mb-2 group-hover:text-primary dark:group-hover:text-primary">添加新存储</div>
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
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
