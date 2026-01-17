import { useState, useEffect, useRef } from 'react';
import { Table, Button, Image, notification, Card, Popconfirm, Form, Input, DatePicker, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';

import { titleSty } from '@/styles/sty';
import Title from '@/components/Title';
import { delRecordDataAPI, getRecordListAPI } from '@/api/record';
import type { Record } from '@/types/app/record';
import { ColumnsType } from 'antd/es/table';

export interface FilterForm {
  content: string;
  createTime: Date[];
}

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [recordList, setRecordList] = useState<Record[]>([]);
  const [form] = Form.useForm();
  const { RangePicker } = DatePicker;

  const getRecordList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getRecordListAPI();
      setRecordList(data as Record[]);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecordList();
  }, []);

  const delRecordData = async (id: number) => {
    try {
      setBtnLoading(true);

      await delRecordDataAPI(id);
      getRecordList();
      form.resetFields();
      notification.success({ message: '🎉 删除说说成功' });

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  const columns: ColumnsType<Record> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 100,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      align: 'center',
      width: 300,
      render: (text: string) => <div className="line-clamp-2">{text}</div>,
    },
    {
      title: '图片',
      dataIndex: 'images',
      key: 'images',
      align: 'center',
      width: 200,
      render: (text: string) => {
        const list: string[] = JSON.parse(text || '[]');

        return (
          <div className="flex space-x-2">
            {list.map((item, index) => (
              <Image key={index} src={item} width={70} height={70} className="rounded-lg" />
            ))}
          </div>
        );
      },
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) => dayjs(+text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: Record, b: Record) => +a.createTime! - +b.createTime!,
      showSorterTooltip: false,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_: string, record: Record) => (
        <div className="flex justify-center space-x-2">
          <Link to={`/create_record?id=${record.id}`}>
            <Button type="text" icon={<FormOutlined className="text-primary" />} />
          </Link>

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delRecordData(record.id!)}>
            <Button type="text" danger loading={btnLoading} icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onFilterSubmit = async (values: FilterForm) => {
    try {
      setLoading(true);

      const query = {
        key: values.content,
        startDate: values.createTime && values.createTime[0].valueOf() + '',
        endDate: values.createTime && values.createTime[1].valueOf() + '',
      };

      const { data } = await getRecordListAPI({ query });
      setRecordList(data);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5 mb-4">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        {/* 筛选卡片骨架屏 */}
        <Card className="border-stroke my-2 overflow-scroll [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton.Input active size="default" style={{ width: 200, height: 32 }} />
            <Skeleton.Input active size="default" style={{ width: 250, height: 32 }} />
            <Skeleton.Button active size="default" style={{ width: 80, height: 32 }} />
          </div>
        </Card>

        {/* 表格卡片骨架屏 */}
        <Card className={`${titleSty} min-h-[calc(100vh-270px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5`}>
          {/* 表格头部骨架屏 */}
          <div className="mb-4">
            {/* 表格行骨架屏 - 模拟多行 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex items-center gap-4 mb-2 py-2 border-b border-gray-100">
                <Skeleton.Input active size="small" className="1/12 h-5" />
                <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 20, flex: 1 }} />
                <Skeleton.Input active size="small" style={{ width: 250, height: 20, flex: 1 }} />
                <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 100, height: 20 }} />
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
      <Title value="说说管理" />

      <Card className="border-stroke my-2 overflow-scroll">
        <Form form={form} layout="inline" onFinish={onFilterSubmit} autoComplete="off" className="flex-nowrap">
          <Form.Item name="content" className="min-w-[200px]">
            <Input placeholder="请输入关键词" />
          </Form.Item>

          <Form.Item name="createTime" className="min-w-[250px]">
            <RangePicker placeholder={['选择起始时间', '选择结束时间']} disabledDate={(current) => current && current > dayjs().endOf('day')} />
          </Form.Item>

          <Form.Item className="pr-6">
            <Button type="primary" htmlType="submit">
              筛选
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className={`${titleSty} min-h-[calc(100vh-270px)]`}>
        <Table
          rowKey="id"
          dataSource={recordList}
          columns={columns}
          loading={loading}
          // scroll={{ x: 'max-content' }}
          pagination={{
            position: ['bottomCenter'],
            defaultPageSize: 8,
          }}
        />
      </Card>
    </div>
  );
};
