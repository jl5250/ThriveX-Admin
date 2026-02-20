import { useState, useEffect, useRef } from 'react';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Form, Input, Button, Tree, Modal, Spin, Dropdown, Card, MenuProps, Popconfirm, message, Radio, Select, Skeleton } from 'antd';
import type { DataNode } from 'antd/es/tree';

import { Cate } from '@/types/app/cate';
import { addCateDataAPI, delCateDataAPI, editCateDataAPI, getCateDataAPI, getCateListAPI } from '@/api/cate';
import Title from '@/components/Title';

import './index.scss';

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [cate, setCate] = useState<Cate>({} as Cate);
  const [list, setList] = useState<Cate[]>([]);
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');
  const [isCateShow, setIsCateShow] = useState(false);
  const [form] = Form.useForm();

  const getCateList = async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCateListAPI();
      data.sort((a, b) => a.order - b.order);
      setList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getCateList();
  }, []);

  const addCateData = (id: number) => {
    setIsMethod('create');
    setIsModelOpen(true);
    setIsCateShow(false);
    form.resetFields();
    setCate({ ...cate, level: id, type: 'cate' });
  };

  const editCateData = async (id: number) => {
    try {
      setEditLoading(true);

      setIsMethod('edit');
      setIsModelOpen(true);

      const { data } = await getCateDataAPI(id);
      setIsCateShow(data.type === 'cate' ? false : true);
      setCate(data);
      form.setFieldsValue(data);

      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  const delCateData = async (id: number) => {
    try {
      setLoading(true);

      await delCateDataAPI(id);
      await getCateList();
      message.success('🎉 删除分类成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setBtnLoading(true);

    try {
      form.validateFields().then(async (values: Cate) => {
        if (values.type === 'cate') values.url = '/';

        if (isMethod === 'edit') {
          await editCateDataAPI({ ...cate, ...values });
          message.success('🎉 修改分类成功');
        } else {
          await addCateDataAPI({ ...cate, ...values });
          message.success('🎉 新增分类成功');
        }

        await getCateList();

        form.resetFields();
        setCate({} as Cate);

        setIsModelOpen(false);
        setIsMethod('create');
      });

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  const closeModel = () => {
    setIsCateShow(false);
    setIsMethod('create');
    setIsModelOpen(false);
    form.resetFields();
    setCate({} as Cate);
  };

  const toTreeData = (data: Cate[]): DataNode[] =>
    data.map((item) => {
      const items: MenuProps['items'] = [
        {
          key: '1',
          label: (
            <span className="flex items-center gap-2 py-1">
              <PlusOutlined className="text-md" />
              新增
            </span>
          ),
          onClick: () => addCateData(item.id!),
        },
        {
          key: '2',
          label: (
            <span className="flex items-center gap-2 py-1">
              <EditOutlined className="text-md" />
              编辑
            </span>
          ),
          onClick: () => editCateData(item.id!),
        },
        {
          key: '3',
          label: (
            <Popconfirm
              title="删除确认"
              description="确定要删除该分类吗？"
              okText="确定"
              cancelText="取消"
              onConfirm={() => delCateData(item.id!)}
            >
              <span className="flex items-center gap-2 py-1 text-red-500 hover:text-red-600">
                <DeleteOutlined className="text-md" />
                删除
              </span>
            </Popconfirm>
          ),
        },
      ];

      return {
        title: (
          <div className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 -ml-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-lg leading-none opacity-80">{item.icon}</span>
              <span className="truncate text-slate-600 dark:text-slate-200">{item.name}</span>
            </div>

            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
              <Button
                type="text"
                size="small"
                className="flex shrink-0 items-center gap-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                操作
              </Button>
            </Dropdown>
          </div>
        ),
        key: item.id || 0,
        children: item.children ? toTreeData(item.children) : [],
      };
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toCascaderOptions: any = (data: Cate[], isRoot: boolean = true) => [
    ...(isRoot ? [{ value: 0, label: '一级分类' }] : []),
    ...data.map((item) => ({
      value: item.id!,
      label: item.name,
      children: item.children ? toCascaderOptions(item.children, false) : undefined,
    })),
  ];

  if (initialLoading) {
    return (
      <div className="space-y-2">
        <Card className="!rounded-xl !border-stroke !shadow-sm [&>.ant-card-body]:!p-4 dark:!border-strokedark">
          <div className="flex items-center justify-between">
            <Skeleton.Input active size="large" className="!h-9 !w-40" />
            <Skeleton.Button active size="large" className="!h-10 !w-28" />
          </div>
        </Card>

        <Card className="!min-h-[calc(100vh-160px)] !rounded-xl !border-stroke !shadow-sm [&>.ant-card-body]:!p-6 dark:!border-strokedark">
          <div className="space-y-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton.Input active className="!h-6 !w-48" />
                  <Skeleton.Button active size="small" className="!h-6 !w-14" />
                </div>
                {item <= 3 && (
                  <div className="ml-6 space-y-2">
                    {[1, 2, 3].map((child) => (
                      <div key={child} className="flex items-center justify-between">
                        <Skeleton.Input active size="small" className="!h-5 !w-36" />
                        <Skeleton.Button active size="small" className="!h-5 !w-12" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Title value="分类管理">
        <Button
          type="primary"
          onClick={() => addCateData(0)}
        >
          新增分类
        </Button>
      </Title>

      <Card
        className={`CatePage !min-h-[calc(100vh-160px)] !rounded-xl !border !border-stroke !bg-white !shadow-sm [&>.ant-card-body]:!p-6 dark:!border-strokedark dark:!bg-boxdark`}
      >
        <Spin spinning={loading} className="min-h-[280px]">
          <Tree
            className="!bg-transparent [&_.ant-tree-treenode]:!py-0.5 [&_.ant-tree-indent-unit]:!w-4"
            defaultExpandAll
            treeData={toTreeData(list)}
            showLine={{ showLeafIcon: false }}
            blockNode
          />
        </Spin>
      </Card>

      <Modal
        open={isModelOpen}
        onCancel={closeModel}
        footer={null}
        title={isMethod === 'edit' ? '编辑分类' : '新增分类'}
        loading={editLoading}
        className="[&_.ant-modal-content]:!rounded-2xl"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={cate}
          size="large"
          preserve={false}
          className="mt-2 [&_.ant-input]:!rounded-lg [&_.ant-select-selector]:!rounded-lg"
        >
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '分类名称不能为空' }]}>
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item label="标识" name="mark" rules={[{ required: true, message: '分类标识不能为空' }]}>
              <Input placeholder="请输入分类标识" />
            </Form.Item>
          </div>

          <Form.Item label="图标" name="icon">
            <Input placeholder="请输入分类图标（如 emoji 或图标名）" />
          </Form.Item>

          {isCateShow && (
            <Form.Item label="链接" name="url">
              <Input placeholder="请输入分类链接" />
            </Form.Item>
          )}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label="顺序" name="order">
              <Input placeholder="值越小越靠前" />
            </Form.Item>
            <Form.Item label="级别" name="level">
              <Select options={toCascaderOptions(list)} placeholder="请选择分类级别" />
            </Form.Item>
          </div>

          <Form.Item label="模式" name="type">
            <Radio.Group
              className="!flex !gap-4"
              onChange={(e) => {
                const type = e.target.value;
                setIsCateShow(type === 'nav');
              }}
            >
              <Radio value="cate" className="!m-0">
                分类
              </Radio>
              <Radio value="nav" className="!m-0">
                导航
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item className="!mb-0">
            <Button type="primary" onClick={onSubmit} loading={btnLoading} className="w-full">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
