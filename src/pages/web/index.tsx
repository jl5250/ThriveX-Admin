import { useEffect, useState, useRef } from 'react';

import { Button, Card, Empty, Form, Input, Popconfirm, Select, Spin, Modal, message, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { getLinkListAPI, addLinkDataAPI, editLinkDataAPI, delLinkDataAPI, getWebTypeListAPI } from '@/api/web';
import Title from '@/components/Title';
import { WebType, Web } from '@/types/app/web';
import { RuleObject } from 'antd/es/form';

import GroupSvg from './assets/svg/group.svg';

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [form] = Form.useForm();

  const [list, setList] = useState<{ [key: string]: Web[] }>({});
  const [listTemp, setListTemp] = useState<Web[]>([]);
  const [typeList, setTypeList] = useState<WebType[]>([]);
  const [search, setSearch] = useState<string>('');
  const [link, setLink] = useState<Web>({} as Web);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 区分新增或编辑
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');

  // 获取网站列表
  const getLinkList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getLinkListAPI();
      data.sort((a, b) => a.order - b.order);
      data.sort((a, b) => a.type.order - b.type.order);

      const grouped = data.reduce(
        (acc, item) => {
          const groupName = item.type.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(item);
          return acc;
        },
        {} as { [key: string]: Web[] },
      );

      setList(grouped);
      setListTemp(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  // 获取网站类型列表
  const getWebTypeList = async () => {
    const { data } = await getWebTypeListAPI();
    setTypeList(data);
  };

  useEffect(() => {
    getLinkList();
    getWebTypeList();
  }, []);

  useEffect(() => {
    // 过滤出符合搜索条件的网站
    const filteredList = listTemp.filter((item) => item.title.includes(search) || item.description.includes(search));

    // 按类型分组
    const grouped = filteredList.reduce(
      (acc, item) => {
        const groupName = item.type.name;
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(item);
        return acc;
      },
      {} as { [key: string]: Web[] },
    );

    setList(grouped);
  }, [search, listTemp]);

  const deleteLinkData = async (id: number) => {
    try {
      setLoading(true);

      await delLinkDataAPI(id);
      getLinkList();
      message.success('🎉 删除网站成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const editLinkData = async (record: Web) => {
    try {
      setEditLoading(true);
      setIsMethod('edit');
      setLink(record);
      form.setFieldsValue(record);
      setModalVisible(true);
      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  // 做一些初始化的事情
  const reset = () => {
    form.resetFields(); // 重置表单字段
    setLink({} as Web);
    setIsMethod('create');
    setModalVisible(false);
  };

  // 打开新增网站弹框
  const openAddModal = () => {
    reset();
    setIsMethod('create');
    setModalVisible(true);
  };

  // 校验网站链接
  const validateURL = (_: RuleObject, value: string) => {
    return !value || /^(https?:\/\/)/.test(value) ? Promise.resolve() : Promise.reject(new Error('请输入有效的链接'));
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);

      form.validateFields().then(async (values: Web) => {
        if (isMethod === 'edit') {
          await editLinkDataAPI({ ...link, ...values });
          message.success('🎉 编辑网站成功');
        } else {
          await addLinkDataAPI({ ...values, createTime: new Date().getTime().toString() });
          message.success('🎉 新增网站成功');
        }

        await getLinkList();
        reset();
      });

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  const { Option } = Select;

  const toHref = (url: string) => {
    window.open(url, '_blank');
  };


  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        {/* 内容骨架屏 */}
        <Card className="WebPage border-stroke min-h-[calc(100vh-160px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
          {/* 搜索框骨架屏 */}
          <div className="flex justify-center w-full mb-3">
            <Skeleton.Input active size="large" style={{ width: 300, height: 50 }} />
          </div>

          {/* 分组卡片骨架屏 */}
          <div className="space-y-10">
            {[1, 2, 3].map((group) => (
              <div key={group} className="space-y-6">
                {/* 分组标题骨架屏 */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-boxdark/60 backdrop-blur-md border border-white/20 dark:border-strokedark/30">
                  <Skeleton.Avatar active size={20} shape="square" />
                  <Skeleton.Input active size="default" style={{ width: 150, height: 24 }} />
                </div>

                {/* 网站项骨架屏 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="flex flex-col items-center p-6 rounded-2xl bg-white/70 dark:bg-boxdark/70 backdrop-blur-lg border border-white/30 dark:border-strokedark/40 shadow-sm">
                      <Skeleton.Avatar active size={80} shape="circle" className="mb-4" />
                      <Skeleton.Input active size="default" style={{ width: '100%', height: 24, marginBottom: 8 }} />
                      <Skeleton.Input active size="small" style={{ width: '100%', height: 20, marginBottom: 16 }} />
                      <Skeleton.Input active size="small" style={{ width: 80, height: 24, borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="网站管理">
        <Button type="primary" size="large" onClick={openAddModal}>
          新增网站
        </Button>
      </Title>

      <Card className="WebPage border-stroke min-h-[calc(100vh-160px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
        <div className="flex justify-center w-full mt-1 mb-2">
          <Input placeholder="请输入网站名称或描述信息进行查询" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-[300px]" />
        </div>

        <Spin spinning={loading}>
          <div className="space-y-10">
            {Object.keys(list).map((key, index1) => (
              <div key={index1} className="space-y-6">
                {/* 分组标题 - Glassmorphism 风格 */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-boxdark/60 backdrop-blur-md border border-white/20 dark:border-strokedark/30 shadow-sm shadow-primary/5">
                  <img src={GroupSvg} alt="分组图标" className="w-5 h-5 opacity-80" />
                  <span className="text-base font-semibold text-gray-800 dark:text-gray-200">{key}</span>
                </div>

                {Object.values(list[key]).length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {Object.values(list[key]).map((item, index2) => (
                      <div
                        key={index2}
                        className="group relative flex flex-col items-center p-6 pb-0 rounded-3xl bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-boxdark/80 dark:via-boxdark/70 dark:to-boxdark/60 backdrop-blur-xl border border-white/40 dark:border-strokedark/50 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
                      >
                        {/* 背景装饰 - 动态渐变 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* 顶部装饰条 - 增强版 */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/30 via-primary/15 to-transparent dark:from-primary/40 dark:via-primary/20 rounded-t-3xl"></div>

                        {/* 装饰性光晕效果 */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        {/* 头像容器 - 增强版 */}
                        <div className="relative z-10 flex items-center justify-center w-24 h-24 mt-3 mb-5 rounded-full bg-gradient-to-br from-white to-gray-50 dark:from-boxdark-2 dark:to-boxdark shadow-2xl ring-4 ring-white/60 dark:ring-strokedark/40 ring-offset-2 ring-offset-white/50 dark:ring-offset-boxdark/50 transition-transform duration-300 group-hover:scale-110 group-hover:ring-primary/30 group-hover:shadow-primary/30">
                          {/* 头像光晕 */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <img
                            src={item.image}
                            alt={item.title}
                            className="relative z-10 w-[88%] h-[88%] rounded-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                          />
                          {/* 头像边框动画 */}
                          <div className="absolute inset-0 rounded-full border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-300"></div>
                        </div>

                        {/* 网站标题 - 增强版 */}
                        <h3 className="relative z-10 mb-2 text-lg font-bold text-gray-900 dark:text-white text-center transition-all duration-300 group-hover:text-primary group-hover:scale-105 line-clamp-1">
                          {item.title}
                        </h3>

                        {/* 网站描述 - 增强版 */}
                        <p className="relative z-10 mb-4 text-sm text-gray-600 dark:text-gray-300 text-center line-clamp-2 leading-relaxed min-h-[2.5rem] px-2 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                          {item.description}
                        </p>

                        {/* 分类标签 - 增强版 */}
                        <div className="relative z-10 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 dark:from-primary/25 dark:via-primary/20 dark:to-primary/15 text-primary dark:text-primary/90 text-xs font-semibold transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-primary/25 group-hover:via-primary/20 group-hover:to-primary/15 dark:group-hover:from-primary/35 dark:group-hover:via-primary/30 dark:group-hover:to-primary/25 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/20 border border-primary/20 dark:border-primary/30">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            {item.type.name}
                          </span>
                        </div>

                        {/* 操作按钮区域 - 优化后的设计 */}
                        <div className="absolute z-50 inset-x-0 bottom-0 flex flex-col gap-3 py-5 px-3 bg-gradient-to-t from-white/98 via-white/95 to-white/90 dark:from-boxdark/98 dark:via-boxdark/95 dark:to-boxdark/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-strokedark/60 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.3)] transform translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-out">
                          {/* 分隔线 - 增强版 */}
                          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/50"></div>

                          {/* 第一行：修改和删除按钮 */}
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editLinkData(item);
                              }}
                              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 hover:from-emerald-600 hover:via-emerald-600 hover:to-emerald-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95 transform flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              修改
                            </button>

                            <Popconfirm
                              title="删除确认"
                              description="确定要删除这个网站吗？此操作不可恢复。"
                              okText="确定"
                              cancelText="取消"
                              okButtonProps={{ danger: true }}
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                deleteLinkData(item.id!);
                              }}
                            >
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:from-red-600 hover:via-red-600 hover:to-red-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/40 active:scale-95 transform flex items-center justify-center gap-1.5"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                删除
                              </button>
                            </Popconfirm>
                          </div>

                          {/* 第二行：前往该网站按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toHref(item.url);
                            }}
                            className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/50 active:scale-95 transform flex items-center justify-center gap-2 group/btn"
                          >
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span>前往该网站</span>
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* 底部装饰条 */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无数据" className="my-7" />
                )}
              </div>
            ))}
          </div>
        </Spin>
      </Card>

      {/* 新增/编辑网站弹框 */}
      <Modal
        title={isMethod === 'edit' ? '编辑网站' : '新增网站'}
        open={modalVisible}
        onCancel={reset}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={reset}>
              取消
            </Button>

            <Button type="primary" htmlType="submit" loading={btnLoading}>
              确定
            </Button>
          </div>
        }
        width={600}
      >
        <Spin spinning={editLoading}>
          <Form form={form} layout="vertical" size="large" initialValues={link} onFinish={onSubmit}>
            <Form.Item label="网站标题" name="title" rules={[{ required: true, message: '网站标题不能为空' }]}>
              <Input placeholder="ThriveX" />
            </Form.Item>

            <Form.Item label="网站描述" name="description" rules={[{ required: true, message: '网站描述不能为空' }]}>
              <Input placeholder="记录前端、Python、Java点点滴滴" />
            </Form.Item>

            <Form.Item label="站长邮箱" name="email">
              <Input placeholder="3311118881@qq.com" />
            </Form.Item>

            <Form.Item label="网站图标" name="image" rules={[{ required: true, message: '网站图标不能为空' }]}>
              <Input placeholder="https://liuyuyang.net/logo.png" />
            </Form.Item>

            <Form.Item label="网站链接" name="url" rules={[{ required: true, message: '网站链接不能为空' }, { validator: validateURL }]}>
              <Input placeholder="https://liuyuyang.net/" />
            </Form.Item>

            <Form.Item label="订阅地址" name="rss" rules={[{ validator: validateURL }]}>
              <Input placeholder="https://liuyuyang.net/api/rss" />
            </Form.Item>

            <Form.Item name="typeId" label="网站类型" rules={[{ required: true, message: '网站类型不能为空' }]}>
              <Select placeholder="请选择网站类型" allowClear>
                {typeList.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="顺序" name="order">
              <Input placeholder="请输入网站顺序（值越小越靠前）" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal >
    </div >
  );
};
