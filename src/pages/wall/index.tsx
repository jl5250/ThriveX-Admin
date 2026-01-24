import { useEffect, useState, useRef } from 'react';

import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Table, Tag, message, Skeleton } from 'antd';
import dayjs from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import { DeleteOutlined, SendOutlined, StarFilled, StarOutlined } from '@ant-design/icons';

import { getWallListAPI, delWallDataAPI, getWallCateListAPI, updateChoiceAPI } from '@/api/wall';
import { sendReplyWallEmailAPI } from '@/api/email';
import Title from '@/components/Title';
import { useWebStore } from '@/stores';
import { titleSty } from '@/styles/sty';
import type { Cate, Wall, FilterForm, FilterWall } from '@/types/app/wall';
import { ColumnsType } from 'antd/es/table';

export default () => {
  const web = useWebStore((state) => state.web);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [wall, setWall] = useState<Wall>({} as Wall);
  const [list, setList] = useState<Wall[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const getWallList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getWallListAPI();
      setList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const delWallData = async (id: number) => {
    setLoading(true);

    try {
      await delWallDataAPI(id);
      getWallList();
      message.success('🎉 删除留言成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }

    setLoading(false);
  };

  // 获取留言的分类列表
  const [cateList, setCateList] = useState<Cate[]>([]);
  const getCateList = async () => {
    const { data } = await getWallCateListAPI();
    setCateList((data as Cate[]).filter((item) => item.id !== 1));
  };

  useEffect(() => {
    getWallList();
    getCateList();
  }, []);

  const columns: ColumnsType<Wall> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'cate',
      key: 'cate',
      render: ({ name }, { color }) => (
        <Tag bordered={false} color={color} className="!text-[#565656] dark:!text-white">
          {name}
        </Tag>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 400,
      render: (text: string, record: Wall) => (
        <span
          className="hover:text-primary cursor-pointer line-clamp-2"
          onClick={() => {
            setWall(record);
            setIsModalOpen(true);
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text: string) => (text ? text : '暂无邮箱'),
    },
    {
      title: '留言时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (date: string) => dayjs(+date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: Wall, b: Wall) => +a.createTime! - +b.createTime!,
      showSorterTooltip: false,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_: string, record: Wall) => (
        <div className="flex justify-center space-x-2">
          <Button
            type="text"
            onClick={async () => {
              try {
                setLoading(true);
                await updateChoiceAPI(record.id);
                message.success('🎉 操作成功');
                getWallList();
                setLoading(false);
              } catch (error) {
                console.error(error);
                setLoading(false);
              }
            }}
            icon={record.isChoice === 1 ? <StarFilled className="text-yellow-400" /> : <StarOutlined />}
          />

          <Button
            type="text"
            onClick={() => {
              setWall(record);
              setIsReplyModalOpen(true);
            }}
            icon={<SendOutlined className="text-primary" />}
          />

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delWallData(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const { RangePicker } = DatePicker;

  const onFilterSubmit = async (values: FilterForm) => {
    try {
      setLoading(true);

      const query: FilterWall = {
        key: values.content,
        cateId: values.cateId,
        startDate: values.createTime && values.createTime[0].valueOf() + '',
        endDate: values.createTime && values.createTime[1].valueOf() + '',
      };

      const { data } = await getWallListAPI({ query });
      setList(data);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 回复留言
  const onHandleReply = async () => {
    try {
      setLoading(true);

      await sendReplyWallEmailAPI({
        to: wall?.email,
        recipient: wall?.name,
        your_content: wall?.content,
        reply_content: replyInfo,
        time: dayjs(+wall?.createTime).format('YYYY-MM-DD HH:mm:ss'),
        url: web.url + '/wall/all',
      });

      message.success('🎉 回复留言成功');
      setIsReplyModalOpen(false);
      setReplyInfo('');
      getWallList();

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
            <Skeleton.Input active size="default" style={{ width: 200, height: 32 }} />
            <Skeleton.Input active size="default" style={{ width: 250, height: 32 }} />
            <Skeleton.Button active size="default" style={{ width: 80, height: 32 }} />
          </div>
        </Card>

        {/* 表格卡片骨架屏 */}
        <Card className={`${titleSty} mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5`}>
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
      <Title value="留言管理" />

      <Card className="[&>.ant-card-body]:!p-3 border-stroke my-2 overflow-scroll">
        <Form layout="inline" onFinish={onFilterSubmit} autoComplete="off" className="flex-nowrap">
          <Form.Item name="content" className="min-w-[200px]">
            <Input placeholder="请输入关键词" />
          </Form.Item>

          <Form.Item name="cateId" className="min-w-[200px]">
            <Select allowClear options={cateList} fieldNames={{ label: 'name', value: 'id' }} placeholder="请选择分类" />
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

      <Card className={`${titleSty} mt-2 min-h-[calc(100vh-160px)]`}>
        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          expandable={{ defaultExpandAllRows: true }}
          scroll={{ x: '1400px' }}
          pagination={{
            position: ['bottomCenter'],
            defaultPageSize: 8,
          }}
        />
      </Card>

      <Modal title="留言详情" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <div className="pt-2 space-y-2">
          <div>
            <b>留言时间：</b> {dayjs(+wall?.createTime).format('YYYY-MM-DD HH:mm:ss')}
          </div>
          <div>
            <b>留言用户：</b> {wall?.name}
          </div>
          <div>
            <b>内容：</b> {wall?.content}
          </div>
        </div>
      </Modal>

      <Modal title="回复留言" open={isReplyModalOpen} footer={null} onCancel={() => setIsReplyModalOpen(false)}>
        <TextArea value={replyInfo} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyInfo(e.target.value)} placeholder="请输入回复内容" autoSize={{ minRows: 3, maxRows: 5 }} />

        <div className="flex space-x-4">
          <Button className="w-full mt-2" onClick={() => setIsReplyModalOpen(false)}>
            取消
          </Button>
          <Button type="primary" loading={loading} onClick={onHandleReply} className="w-full mt-2">
            确定
          </Button>
        </div>
      </Modal>
    </div>
  );
};
