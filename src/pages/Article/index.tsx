import { useState, useEffect } from 'react';
import { Table, Button, Tag, notification, Card, Popconfirm, Form, Input, Select, DatePicker } from 'antd';
import { titleSty } from '@/styles/sty'
import Title from '@/components/Title';
import { Link } from 'react-router-dom';

import { getCateListAPI } from '@/api/Cate'
import { getTagListAPI } from '@/api/Tag'
import { delArticleDataAPI, getArticleListAPI } from '@/api/Article';
import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate } from '@/types/app/cate';
import type { Article, Config, FilterArticle, FilterForm } from '@/types/app/article';

import { useWebStore } from '@/stores';

import dayjs from 'dayjs';
import { ColumnType } from 'antd/es/table';

export default () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [btnLoading, setBtnLoading] = useState<boolean>(false);
    
    const [form] = Form.useForm();
    const web = useWebStore(state => state.web);
    const [current, setCurrent] = useState<number>(1);
    const [articleList, setArticleList] = useState<Article[]>([]);
    const { RangePicker } = DatePicker;

    const getArticleList = async () => {
        try {
            setLoading(true);

            const { data } = await getArticleListAPI();
            setArticleList(data);

            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const delArticleData = async (id: number) => {
        try {
            setBtnLoading(true);

            // 普通删除：可从回收站恢复
            await delArticleDataAPI(id, true);
            await getArticleList();
            form.resetFields()
            setCurrent(1)
            notification.success({ message: '🎉 删除文章成功' })
            setBtnLoading(false);
        } catch (error) {
            setBtnLoading(false);
        }
    };

    // 标签颜色
    const colors = ['', '#2db7f5', '#87d068', '#f50', '#108ee9'];

    const columns: ColumnType<Article>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: 100,
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            align: 'center',
            width: 300,
            render: (text: string, record: Article) => <a href={`${web.url}/article/${record.id}`} target='_blank' className='hover:text-primary line-clamp-1'>{text}</a>,
        },
        {
            title: '摘要',
            dataIndex: 'description',
            key: 'description',
            align: 'center',
            width: 350,
            render: (text: string) => <div className='line-clamp-2'>{text ? text : '该文章暂未设置文章摘要'}</div>,
        },
        {
            title: '分类',
            dataIndex: 'cateList',
            key: 'cateList',
            align: 'center',
            render: (cates: Cate[]) => cates.map((item, index) => <Tag key={item.id} color={colors[index]}>{item.name}</Tag>)
        },
        {
            title: '标签',
            dataIndex: 'tagList',
            key: 'tagList',
            align: 'center',
            render: (tags: ArticleTag[]) => tags.map((item, index) => <Tag key={item.id} color={colors[index]}>{item.name}</Tag>)
        },
        {
            title: '浏览量',
            dataIndex: 'view',
            key: 'view',
            align: 'center',
            sorter: (a: Article, b: Article) => a.view! - b.view!
        },
        {
            title: '评论数量',
            dataIndex: 'comment',
            key: 'comment',
            align: 'center',
            render: (data: string) => <span>{data}</span>,
            sorter: (a: Article, b: Article) => a.comment! - b.comment!
        },
        {
            title: '状态',
            dataIndex: 'config',
            key: 'config',
            align: 'center',
            render: (config: Config) => (
                config.status === "default" && <span>正常</span> ||
                config.status === "no_home" && <span>不在首页显示</span> ||
                config.status === "hide" && <span>隐藏</span> ||
                config.password.trim().length && <span>文章加密</span>
            ),
        },
        {
            title: '发布时间',
            dataIndex: 'createTime',
            key: 'createTime',
            align: 'center',
            width: 200,
            render: (text: string) => dayjs(+text).format('YYYY-MM-DD HH:mm:ss'),
            sorter: (a: Article, b: Article) => +a.createTime! - +b.createTime!,
            showSorterTooltip: false
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            align: 'center',
            render: (_: string, record: Article) => (
                <div className='flex justify-center space-x-2'>
                    <Link to={`/create?id=${record.id}`}>
                        <Button>编辑</Button>
                    </Link>

                    <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delArticleData(record.id!)}>
                        <Button type="primary" danger loading={btnLoading}>删除</Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const onFilterSubmit = async (values: FilterForm) => {
        try {
            setLoading(true)

            const query: FilterArticle = {
                key: values.title,
                cateId: values.cateId,
                tagId: values.tagId,
                isDraft: 0,
                isDel: 0,
                startDate: values.createTime && values.createTime[0].valueOf() + '',
                endDate: values.createTime && values.createTime[1].valueOf() + ''
            }

            const { data } = await getArticleListAPI({ query });
            setArticleList(data);

            setLoading(false)
        } catch (error) {
            setLoading(false)
        }
    }

    const [cateList, setCateList] = useState<Cate[]>([])
    const [tagList, setTagList] = useState<ArticleTag[]>([])

    const getCateList = async () => {
        const { data } = await getCateListAPI()
        setCateList(data.filter(item => item.type === "cate") as Cate[])
    }

    const getTagList = async () => {
        const { data } = await getTagListAPI()
        setTagList(data as ArticleTag[])
    }

    useEffect(() => {
        getArticleList()
        getCateList()
        getTagList()
    }, [])

    return (
        <div>
            <Title value="文章管理" />

            <Card className='my-2 overflow-scroll'>
                <Form form={form} layout="inline" onFinish={onFilterSubmit} autoComplete="off" className='flex-nowrap'>
                    <Form.Item label="标题" name="title" className='min-w-[200px]'>
                        <Input placeholder='请输入关键词' />
                    </Form.Item>

                    <Form.Item label="分类" name="cateId" className='min-w-[200px]'>
                        <Select
                            allowClear
                            options={cateList}
                            fieldNames={{ label: "name", value: "id" }}
                            placeholder="请选择分类"
                        />
                    </Form.Item>

                    <Form.Item label="标签" name="tagId" className='min-w-[200px]'>
                        <Select
                            allowClear
                            showSearch
                            options={tagList}
                            fieldNames={{ label: 'name', value: 'id' }}
                            placeholder="请选择标签"
                            filterOption={(input, option) => {
                                if (option?.name) {
                                    return option.name.toLowerCase().includes(input.toLowerCase());
                                }
                                return false;
                            }}
                        />
                    </Form.Item>

                    <Form.Item label="时间范围" name="createTime" className='min-w-[250px]'>
                        <RangePicker placeholder={["选择起始时间", "选择结束时间"]} />
                    </Form.Item>

                    <Form.Item className='pr-6'>
                        <Button type="primary" htmlType="submit">查询</Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card className={`${titleSty} min-h-[calc(100vh-270px)]`}>
                <Table
                    rowKey="id"
                    dataSource={articleList}
                    columns={columns}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        position: ['bottomCenter'],
                        current,
                        defaultPageSize: 8,
                        onChange(current) {
                            setCurrent(current)
                        }
                    }}
                    loading={loading}
                />
            </Card>
        </div>
    );
};