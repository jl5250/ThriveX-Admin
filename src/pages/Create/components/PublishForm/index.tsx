import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Form, Input, Button, Select, DatePicker, Cascader, message, Switch, Radio } from "antd";
import TextArea from "antd/es/input/TextArea";
import { RuleObject } from "antd/es/form";

import { addArticleDataAPI, editArticleDataAPI } from '@/api/Article'
import { getCateListAPI } from '@/api/Cate'
import { addTagDataAPI, getTagListAPI } from '@/api/Tag'

import { Cate } from "@/types/app/cate";
import { Tag } from "@/types/app/tag";
import { Article, Status } from "@/types/app/article";

import dayjs from 'dayjs';

interface Props {
    data: Article,
    closeModel: () => void
}

interface FieldType {
    title: string,
    createTime: number;
    cateIds: number[];
    tagIds: (number | string)[];
    cover: string;
    description: string;
    top: boolean;
    isEncrypt: number;
    status: Status;
    password: string
}

const PublishForm = ({ data, closeModel }: Props) => {
    const [params] = useSearchParams()
    const id = +params.get('id')!
    const isDraftParams = Boolean(params.get('draft'))

    const [btnLoading, setBtnLoading] = useState(false)

    const [form] = Form.useForm()
    const navigate = useNavigate()

    const [cateList, setCateList] = useState<Cate[]>([])
    const [tagList, setTagList] = useState<Tag[]>([])
    const [isEncryptEnabled, setIsEncryptEnabled] = useState(false);

    useEffect(() => {
        if (!id) return form.resetFields()

        // 把数据处理成[[1], [4, 5], [4, 6]]格式
        const cateIds = data?.cateList?.flatMap(item => {
            if (item?.children?.length) {
                return item.children.map(child => [item.id, child.id]);
            } else {
                return [[item.id]];
            }
        });

        const tagIds = data.tagList!.map(item => item.id)

        const formValues = {
            ...data,
            status: data.config.status,
            password: data.config.password,
            cateIds,
            tagIds,
            createTime: dayjs(+data.createTime!)
        }

        form.setFieldsValue(formValues)
        // 设置初始的加密状态
        setIsEncryptEnabled(!!formValues.isEncrypt)
    }, [data, id])

    const getCateList = async () => {
        const { data } = await getCateListAPI()
        setCateList(data.filter(item => item.type === "cate") as Cate[])
    }

    const getTagList = async () => {
        const { data } = await getTagListAPI()
        setTagList(data as Tag[])
    }

    useEffect(() => {
        getCateList()
        getTagList()
    }, [])

    // 校验文章封面
    const validateURL = (_: RuleObject, value: string) => {
        return !value || /^(https?:\/\/)/.test(value) ? Promise.resolve() : Promise.reject(new Error('请输入有效的封面链接'));
    };

    const onSubmit = async (values: FieldType, isDraft?: boolean) => {
        setBtnLoading(true)

        try {
            values.isEncrypt = values.isEncrypt ? 1 : 0

            // 如果是文章标签，则先判断是否存在，如果不存在则添加
            let tagIds: number[] = []
            for (const item of (values.tagIds ? values.tagIds : [])) {
                if (typeof item === "string") {
                    // 如果已经有这个标签了，就没必要再创建一个了
                    // 先转换为大写进行查找，否则会出现大小写不匹配问题
                    const tag1 = tagList.find(t => t.name.toUpperCase() === item.toUpperCase())?.id;

                    if (tag1) {
                        tagIds.push(tag1)
                        continue
                    }

                    await addTagDataAPI({ name: item });
                    const { data: list } = await getTagListAPI();
                    // 添加成功后查找对应的标签id
                    const tag2 = list.find(t => t.name === item)?.id;
                    if (tag2) tagIds.push(tag2);
                } else {
                    tagIds.push(item);
                }
            }

            values.createTime = values.createTime.valueOf()
            values.cateIds = [...new Set(values.cateIds?.flat())]

            if (id && !isDraftParams) {
                await editArticleDataAPI({
                    id,
                    ...values,
                    content: data.content,
                    tagIds,
                    config: {
                        status: values.status,
                        password: values.password
                    }
                } as any)
                message.success("🎉 编辑成功")
            } else {
                if (!isDraftParams) {
                    await addArticleDataAPI({
                        id,
                        ...values,
                        content: data.content,
                        tagIds,
                        isDraft: isDraft ? 1 : 0,
                        isDel: 0,
                        isEncrypt: 0,
                        config: {
                            status: values.status,
                            password: values.password
                        },
                        createTime: values.createTime.toString()
                    })

                    isDraft ? message.success("🎉 保存为草稿成功") : message.success("🎉 发布成功")
                } else {
                    // 修改草稿状态为发布文章
                    await editArticleDataAPI({
                        id,
                        ...values,
                        content: data.content,
                        tagIds,
                        isDraft: isDraft ? 1 : 0,
                        config: {
                            status: values.status,
                            password: values.password
                        }
                    } as any)
                }
            }

            // 关闭弹框
            closeModel()
            // 清除本地持久化的数据
            localStorage.removeItem('article_content')
            // 如果是草稿就跳转到草稿页，否则文章页
            isDraft ? navigate("/draft") : navigate("/article")
            // 初始化表单
            form.resetFields()
        } catch (error) {
            setBtnLoading(false)
        }

        setBtnLoading(false)
    }

    // 初始表单数据
    const initialValues = {
        top: false,
        status: "default",
        password: "",
        createTime: dayjs(new Date())
    }

    return (
        <div>
            <Form
                form={form}
                name="basic"
                size="large"
                layout="vertical"
                onFinish={onSubmit}
                autoComplete="off"
                initialValues={initialValues}
            >
                <Form.Item label="文章标题" name="title" rules={[{ required: true, message: "请输入文章标题" }]}>
                    <Input placeholder="请输入文章标题" />
                </Form.Item>

                <Form.Item label="文章封面" name="cover" rules={[{ validator: validateURL }]}>
                    <Input placeholder="请输入文章封面" />
                </Form.Item>

                <Form.Item label="文章简介" name="description">
                    <TextArea autoSize={{ minRows: 2, maxRows: 5 }} showCount placeholder="请输入文章简介" />
                </Form.Item>

                <Form.Item label="选择分类" name="cateIds" rules={[{ required: true, message: '请选择文章分类' }]}>
                    <Cascader
                        options={cateList}
                        maxTagCount="responsive"
                        multiple
                        fieldNames={{ label: "name", value: "id" }}
                        placeholder="请选择文章分类"
                        className="w-full"
                    />
                </Form.Item>

                <Form.Item label="选择标签" name="tagIds">
                    <Select
                        allowClear
                        mode="tags"
                        options={tagList}
                        fieldNames={{ label: 'name', value: 'id' }}
                        filterOption={(input, option) => !!option?.name.includes(input)}
                        placeholder="请选择文章标签"
                        className="w-full"
                    />
                </Form.Item>

                <Form.Item label="选择发布时间" name="createTime">
                    <DatePicker showTime placeholder="选择文章发布时间" className="w-full" />
                </Form.Item>

                <Form.Item label="是否置顶" name="top" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Form.Item label="状态" name="status">
                    <Radio.Group>
                        <Radio value="default">正常</Radio>
                        <Radio value="no_home">不在首页显示</Radio>
                        <Radio value="hide">全站隐藏</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="是否加密" name="isEncrypt" valuePropName="checked">
                    <Switch onChange={(checked: boolean) => setIsEncryptEnabled(checked)} />
                </Form.Item>

                {isEncryptEnabled && (
                    <Form.Item
                        label="访问密码"
                        name="password"
                        rules={[{ required: isEncryptEnabled, message: '请输入访问密码' }]}
                    >
                        <Input.Password placeholder="请输入访问密码" />
                    </Form.Item>
                )}

                <Form.Item className="!mb-0">
                    <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">{(id && !isDraftParams) ? "编辑文章" : "发布文章"}</Button>
                </Form.Item>

                {/* 草稿和编辑状态下不再显示保存草稿按钮 */}
                {((isDraftParams && id) || !id) && (
                    <Form.Item className="!mt-2 !mb-0">
                        <Button className="w-full" onClick={() => form.validateFields().then(values => onSubmit(values, true))}>{isDraftParams ? '保存' : '保存为草稿'}</Button>
                    </Form.Item>
                )}
            </Form>
        </div>
    );
};

export default PublishForm;