import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import {
  Table, Button, Tag, notification, Popconfirm, Form, Input, Select, DatePicker, Modal,
  message, Dropdown, Tooltip, Space, Divider, Popover,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadFileStatus, RcFile } from 'antd/es/upload/interface';
import type { TableRowSelection } from 'antd/es/table/interface';
import { DeleteOutlined, FormOutlined, InboxOutlined, DownloadOutlined, SearchOutlined, ClearOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

import Title from '@/components/Title';

import { getCateListAPI } from '@/api/cate';
import { getTagListAPI } from '@/api/tag';
import { delArticleDataAPI, getArticlePagingAPI, addArticleDataAPI, getArticleListAPI, delBatchArticleDataAPI } from '@/api/article';

import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate } from '@/types/app/cate';
import type { Article, Config, FilterArticle, FilterForm } from '@/types/app/article';

import { useWebStore } from '@/stores';

const { RangePicker } = DatePicker;

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  const [form] = Form.useForm();
  const web = useWebStore((state) => state.web);
  const [articleList, setArticleList] = useState<Article[]>([]);

  const [total, setTotal] = useState<number>(0);
  const [paging, setPaging] = useState<Page>({
    page: 1,
    size: 8,
  });
  const [query, setQuery] = useState<FilterArticle>({
    key: undefined,
    cateId: undefined,
    tagId: undefined,
    isDraft: 0,
    isDel: 0,
    startDate: undefined,
    endDate: undefined,
  });
  const [showBatchActions, setShowBatchActions] = useState<boolean>(false);

  // 分页获取文章
  const getArticleList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      // 否则使用 loading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getArticlePagingAPI({
        pagination: paging,
        query,
      });
      setTotal(data.total);
      setArticleList(data.result);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const delArticleData = async (id: number) => {
    try {
      setBtnLoading(id);
      await delArticleDataAPI(id, true);
      await getArticleList();
      notification.success({ message: '删除成功' });
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(null);
    }
  };

  // 分类/标签：柔和色系，收纳展示（默认显示前 2 个，其余 +N，悬停展示全部）
  const tagColors = [
    'default',
    'processing',
    'success',
    'warning',
    'cyan',
  ] as const;
  const VISIBLE_TAG_COUNT = 1;

  const renderCollapsibleTags = <T extends { id?: number; name: string }>(
    list: T[],
    keyPrefix: string,
  ) => {
    const items = list || [];
    if (items.length === 0) return null;
    const visible = items.slice(0, VISIBLE_TAG_COUNT);
    const restCount = items.length - VISIBLE_TAG_COUNT;
    const tagList = (
      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
        {items.map((item, index) => (
          <Tag
            key={item.id ?? index}
            color={tagColors[index % tagColors.length]}
            className="!m-0 !border-0"
          >
            {item.name}
          </Tag>
        ))}
      </div>
    );
    return (
      <div className="flex flex-wrap items-center gap-1.5 justify-start">
        {visible.map((item, index) => (
          <Tag
            key={`${keyPrefix}-${item.id ?? index}`}
            color={tagColors[index % tagColors.length]}
            className="!m-0 !border-0"
          >
            {item.name}
          </Tag>
        ))}
        {restCount > 0 && (
          <Popover
            content={tagList}
            trigger="hover"
            placement="topLeft"
            overlayClassName="article-tags-popover"
          >
            <span
              className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-medium cursor-default bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-boxdark-2 dark:text-gray-400 dark:hover:bg-strokedark/80 border-0"
              role="button"
              tabIndex={0}
            >
              +{restCount}
            </span>
          </Popover>
        )}
      </div>
    );
  };

  const columns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
      render: (text) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (text: string, record: Article) => (
        <Tooltip title={text} placement="topLeft">
          <a
            href={`${web.url}/article/${record.id}`}
            target="_blank"
            rel="noreferrer"
            className="max-w-[280px] truncate block text-gray-700 dark:text-gray-200 font-medium hover:text-primary"
          >
            {text || <span className="text-gray-300 dark:text-gray-500 italic">暂无标题</span>}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'description',
      key: 'description',
      width: 320,
      render: (text: string) => (
        <>
          {text ? (
            <Tooltip title={text}>
              <div className="max-w-[320px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">
                {text}
              </div>
            </Tooltip>
          ) : (
            <span className="text-gray-300 dark:text-gray-500 italic">暂无摘要</span>
          )}
        </>
      ),
    },
    {
      title: '分类',
      dataIndex: 'cateList',
      key: 'cateList',
      width: 140,
      render: (cates: Cate[]) => renderCollapsibleTags(cates || [], 'cate'),
    },
    {
      title: '标签',
      dataIndex: 'tagList',
      key: 'tagList',
      width: 160,
      render: (tags: ArticleTag[]) => renderCollapsibleTags(tags || [], 'tag'),
    },
    {
      title: '浏览量',
      dataIndex: 'view',
      key: 'view',
      width: 100,
      align: 'center',
      render: (v) => (
        <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
          <EyeOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
          <span className="font-medium">{v ?? 0}</span>
        </span>
      ),
      sorter: (a: Article, b: Article) => (a.view ?? 0) - (b.view ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '评论',
      dataIndex: 'comment',
      key: 'comment',
      width: 90,
      align: 'center',
      render: (v) => (
        <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
          <CommentOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
          <span className="font-medium">{v ?? 0}</span>
        </span>
      ),
      sorter: (a: Article, b: Article) => (a.comment ?? 0) - (b.comment ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '状态',
      dataIndex: 'config',
      key: 'config',
      width: 130,
      align: 'center',
      render: (config: Config) => {
        const statusMap: Record<string, string> = {
          default: '正常',
          no_home: '不在首页显示',
          hide: '隐藏',
        };
        const label = config.password?.trim() ? '文章加密' : statusMap[config.status] ?? config.status;
        const statusColorMap: Record<string, string> = {
          default: 'success',
          no_home: 'warning',
          hide: 'default',
        };
        const color = config.password?.trim() ? 'processing' : statusColorMap[config.status] ?? 'default';
        return (
          <Tag color={color} className="!m-0 !border-0 whitespace-nowrap">
            {label}
          </Tag>
        );
      },
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: (text: string) => (
        <div className="flex flex-col">
          <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(+text).format('YYYY-MM-DD')}</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(+text).format('HH:mm:ss')}</span>
        </div>
      ),
      sorter: (a: Article, b: Article) => +a.createTime! - +b.createTime!,
      showSorterTooltip: false,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 165,
      align: 'center',
      render: (_, record: Article) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip title="编辑">
            <Link to={`/create?id=${record.id}`}>
              <Button
                type="text"
                size="small"
                icon={<FormOutlined />}
                className="text-gray-500 hover:text-blue-500 dark:text-gray-300 dark:hover:!text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              />
            </Link>
          </Tooltip>
          <Tooltip title="导出">
            <Popconfirm title="提醒" description="确定要导出该文章吗？" okText="确定" cancelText="取消" onConfirm={() => exportArticle(record.id!)}>
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                className="text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="删除确认"
              description="该操作可从回收站恢复，确定删除吗？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => delArticleData(record.id!)}
            >
              <Button
                type="text"
                size="small"
                danger
                loading={btnLoading === record.id}
                icon={<DeleteOutlined />}
                className="hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const onFilterSubmit = async (values: FilterForm) => {
    try {
      setPaging((prev) => ({ ...prev, page: 1 }));
      setQuery({
        key: values.title,
        cateId: values.cateId,
        tagId: values.tagId,
        startDate: values.createTime?.[0]?.valueOf() + '',
        endDate: values.createTime?.[1]?.valueOf() + '',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onFilterReset = () => {
    form.resetFields();
    setPaging((prev) => ({ ...prev, page: 1 }));
    setQuery({
      key: undefined,
      cateId: undefined,
      tagId: undefined,
      isDraft: 0,
      isDel: 0,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const [cateList, setCateList] = useState<Cate[]>([]);
  const [tagList, setTagList] = useState<ArticleTag[]>([]);

  const getCateList = async () => {
    const { data } = await getCateListAPI();
    setCateList(data.filter((item) => item.type === 'cate') as Cate[]);
  };

  const getTagList = async () => {
    const { data } = await getTagListAPI();
    setTagList(data as ArticleTag[]);
  };

  // 导入文章
  const handleArticleImport = async () => {
    if (fileList.length === 0) {
      notification.warning({ message: '请上传至少一个 .md 或 .json 文件' });
      return;
    }

    try {
      setLoading(true);
      setImportLoading(true);

      const articles: Article[] = [];

      for (const fileItem of fileList) {
        const file = fileItem.originFileObj as File;
        const text = await file.text();

        if (file.name.endsWith('.md')) {
          const article = await parseMarkdownToArticle(text);
          articles.push(article);
        } else if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          const article = parseJsonToArticles(json); // 可能需要适配结构
          articles.concat(article);
        }
      }

      if (articles.length === 0) return notification.error({ message: '解析失败，未提取出有效文章数据' });

      articles.forEach(async (article: Article) => {
        try {
          const { code } = await addArticleDataAPI(article);
          if (code === 200) {
            message.success(`${article.title}--导入成功~`);
          }
        } catch (error) {
          console.error(error);
          message.error(`${article.title}--导入失败~`);
        }
      });

      await getArticleList();

      setFileList([]);
      setIsModalOpen(false);

      notification.success({
        message: `🎉 成功导入 ${articles.length} 篇文章`,
      });
    } catch (err) {
      console.error(err);
      notification.error({ message: '导入失败，请检查文件格式或控制台报错' });
    } finally {
      setImportLoading(false);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFileList([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.json'));

    if (validFiles.length === 0) {
      message.error('仅支持 Markdown(.md) 或 JSON(.json) 文件');
      return;
    }

    if (fileList.length + validFiles.length > 5) {
      message.error('最多只能上传 5 个文件');
      return;
    }

    const newFileList: UploadFile[] = validFiles.map((file) => {
      const rcFile = file as RcFile;
      rcFile.uid = Math.random().toString();
      return {
        uid: rcFile.uid,
        name: file.name,
        status: 'done' as UploadFileStatus,
        originFileObj: rcFile,
      };
    });

    setFileList([...fileList, ...newFileList]);
    message.success(`成功添加 ${validFiles.length} 个文件`);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.json'));

    if (validFiles.length === 0) {
      message.error('仅支持 Markdown(.md) 或 JSON(.json) 文件');
      return;
    }

    if (fileList.length + validFiles.length > 5) {
      message.error('最多只能上传 5 个文件');
      return;
    }

    const newFileList: UploadFile[] = validFiles.map((file) => {
      const rcFile = file as RcFile;
      rcFile.uid = Math.random().toString();
      return {
        uid: rcFile.uid,
        name: file.name,
        status: 'done' as UploadFileStatus,
        originFileObj: rcFile,
      };
    });

    setFileList([...fileList, ...newFileList]);
    // 允许重复上传同一文件
    e.target.value = '';
  };

  // 导出为markdown文件
  const generateMarkdown = (article: Article) => {
    const { title, description, content, cover, createTime, cateList, tagList } = article;

    // 格式化时间为 `YYYY-MM-DD HH:mm:ss`
    const formatDate = (timestamp: string) => {
      const date = new Date(Number(timestamp));
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // 处理标签、分类
    const tags = (tagList || []).map((tag) => tag.name);
    const categories = (cateList || []).map((cate) => cate.name);
    const keywords = [...tags, ...categories].join(' ');

    // 构建 Markdown 字符串
    const markdown = `---\ntitle: ${title}\ntags: ${tags.map((tag) => `${tag}`).join(' ')}\ncategories: ${categories.map((c) => `${c}`).join(' ')}\ncover: ${cover}\ndate: ${formatDate(createTime || new Date().getTime() + '')}\nkeywords: ${keywords}\ndescription: ${description}\n---\n\n ${content.trim()}`;

    return markdown;
  };
  /**
   * 根据 tag 名称列表获取对应的 ID 列表
   * @param names - Markdown 里解析出的标签 ["模块", "爬虫"]
   * @param allTags - 全部可用 tag 列表
   * @returns 标签 ID 数组，如 [82, 87]
   */
  const getTagIdsByNames = (names: string[], allTags: { id?: number; name: string }[]) => {
    const lowerCaseMap = new Map<string, number>();

    // 可选：忽略大小写（如果不需要，请移除 toLowerCase）
    for (const tag of allTags) {
      lowerCaseMap.set(tag.name.toLowerCase(), tag.id as number);
    }

    return (
      names
        .map((name) => lowerCaseMap.get(name.toLowerCase()))
        // 去除未匹配项
        .filter((id): id is number => id !== undefined)
    );
  };

  // 从 markdown 字符串解析为 Article JSON
  const parseMarkdownToArticle = (mdText: string): Article => {
    // 提取 frontmatter 块
    const frontmatterMatch = mdText.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) throw new Error('Markdown 文件格式错误，缺少 frontmatter');

    const frontmatterText = frontmatterMatch[1];
    // 去除 frontmatter 后的正文
    const content = mdText.replace(frontmatterMatch[0], '').trim();

    const meta: Record<string, string> = {};

    // 解析 frontmatter 每一行 key: value
    frontmatterText.split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      meta[key.trim()] = rest.join(':').trim();
    });

    // 时间戳（从 YYYY-MM-DD HH:mm:ss 转为 timestamp）
    const parseDateToTimestamp = (str: string): string => {
      const d = new Date(str);
      if (isNaN(d.getTime())) return Date.now().toString();
      return d.getTime().toString();
    };
    const tagNames = meta.tags?.split(/\s+/).filter(Boolean) || [];
    const tagIds = getTagIdsByNames(tagNames, tagList);
    const cateNames = meta.categories?.split(/\s+/).filter(Boolean) || [];
    const cateIds = getTagIdsByNames(cateNames, cateList);

    const article: Article = {
      title: meta.title || '未命名文章',
      description: meta.description || '',
      content,
      cover: meta.cover || '',
      createTime: parseDateToTimestamp(meta.date || ''),
      cateIds,
      tagIds,
      config: {
        status: 'default',
        password: '',
        isDraft: 0,
        isEncrypt: 0,
        isDel: 0,
      },
    };

    return article;
  };

  // 解析 JSON 内容为文章数据列表
  const parseJsonToArticles = (raw: Article | Article[]): Article[] => {
    const parseSingle = (item: Article): Article => ({
      title: item.title || '未命名文章',
      description: item.description || '',
      content: item.content || '',
      cover: item.cover || '',
      createTime: item.createTime,
      cateIds: (item.cateList || []).map((cate) => cate.id).filter((id): id is number => id !== undefined),
      tagIds: (item.tagList || []).map((tag) => tag.id).filter((id): id is number => id !== undefined),
      config: {
        status: item.config?.status || 'default',
        password: item.config?.password || '',
        isDraft: item.config?.isDraft || 0,
        isEncrypt: item.config?.isEncrypt || 0,
        isDel: item.config?.isDel || 0,
      },
    });

    // 如果是数组则批量解析，否则解析单个
    return Array.isArray(raw) ? raw.map(parseSingle) : [parseSingle(raw)];
  };

  // 下载文件
  const downloadFile = (content: string, fileName: string, mimeType: string = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导出文章为 zip 文件
  const downloadMarkdownZip = async (articles: Article[]) => {
    const zip = new JSZip();
    const folder = zip.folder('data');

    articles.forEach((article) => {
      const markdown = generateMarkdown(article);
      const safeTitle = article.title.replace(/[\\/:*?"<>|]/g, '_');
      folder?.file(`${safeTitle}.md`, markdown);
    });
    zip.file('articles.json', JSON.stringify(articles, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, '导出文章_' + new Date().getTime() + '.zip');
  };

  // 导出文章
  const exportArticle = (id: number) => {
    const article = articleList.filter((item) => item.id === id)[0];
    const markdown = generateMarkdown(article);
    downloadFile(markdown, `${article.title.replace(/[\\/:*?"<>|]/g, '_')}.md`);
  };

  // 导出选中
  const exportSelected = () => {
    const selectedArticles = articleList.filter((item: Article) => selectedRowKeys.includes(item.id as number));

    if (!selectedArticles.length) return message.warning('请选择要导出的文章');

    downloadMarkdownZip(selectedArticles);
  };

  // 删除选中
  const delSelected = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择要删除的文章');
      return;
    }

    try {
      setLoading(true);
      const { code } = await delBatchArticleDataAPI(selectedRowKeys as number[]);
      if (code === 200) {
        message.success('删除成功');
        await getArticleList();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 选择行
  const rowSelection: TableRowSelection<Article> = {
    selectedRowKeys,
    onChange: onSelectChange,
    fixed: 'left',
  };

  // 全部导出
  const exportAll = async () => {
    try {
      setLoading(true);
      const { data } = await getArticleListAPI({});
      downloadMarkdownZip(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Markdown 模板
  const downloadMarkdownTemplate = () => {
    const content = `---\ntitle: 示例文章标题\ndescription: 这里是文章描述\ntags: 示例标签1 示例标签2\ncategories: 示例分类\ncover: https://example.com/image.png\ndate: 2025-07-12 12:00:00\nkeywords: 示例标签1 示例标签2 示例分类\n---\n\n这里是 Markdown 正文内容，请开始创作吧~`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '文章模板.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 模板
  const downloadJsonTemplate = () => {
    const data = {
      title: '示例文章标题',
      description: '文章描述',
      content: '# 正文内容',
      cover: '',
      createTime: Date.now().toString(),
      cateList: [{ id: 1, name: '示例分类' }],
      tagList: [{ id: 2, name: '示例标签' }],
      config: {
        status: 'default',
        password: '',
        isDraft: 0,
        isEncrypt: 0,
        isDel: 0,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '文章模板.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    getArticleList();
  }, [paging, query]);

  useEffect(() => {
    getArticleList();
    getCateList();
    getTagList();
  }, []);

  // 自定义骨架屏
  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>

        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-sm border border-gray-100 dark:border-strokedark">
          <div className="flex justify-between mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="skeleton h-9" style={{ width: 200 }} />
              <div className="skeleton h-9" style={{ width: 180 }} />
              <div className="skeleton h-9" style={{ width: 180 }} />
              <div className="skeleton h-9" style={{ width: 280 }} />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 mb-4 items-center">
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 rounded" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Title value="文章管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          {/* 筛选区：搜索条件 + 查询/重置 */}
          <Form form={form} layout="inline" onFinish={onFilterSubmit} className="!flex !flex-wrap !items-center !gap-y-2.5">
            <Form.Item name="title" className="!mb-0">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                placeholder="搜索文章标题..."
                className="!w-[220px]"
                allowClear
              />
            </Form.Item>
            <Form.Item name="cateId" className="!mb-0">
              <Select
                allowClear
                options={cateList}
                fieldNames={{ label: 'name', value: 'id' }}
                placeholder="选择分类"
                className="!w-[160px]"
              />
            </Form.Item>
            <Form.Item name="tagId" className="!mb-0">
              <Select
                allowClear
                showSearch
                options={tagList}
                fieldNames={{ label: 'name', value: 'id' }}
                placeholder="选择标签"
                className="!w-[140px]"
                filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="createTime" className="!mb-0">
              <RangePicker
                className="!w-[260px]"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
            <Space className="sm:flex-nowrap">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ClearOutlined />} onClick={onFilterReset}>
                重置
              </Button>
              <Button
                icon={showBatchActions ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                onClick={() => setShowBatchActions((v) => !v)}
              >
                {showBatchActions ? '收起' : '功能'}
              </Button>
            </Space>
          </Form>

          {/* 批量操作区：点击「高级文案」后显示，按钮组靠右 */}
          {showBatchActions && (
            <div className="flex flex-wrap items-center pt-2 !mt-2 border-t border-gray-100 dark:border-strokedark gap-2">
              <Dropdown.Button
                icon={<DownloadOutlined />}
                className="w-[120px]"
                menu={{
                  items: [
                    { label: '导出选中', key: 'exportSelected', onClick: () => exportSelected() },
                    { label: '导出全部', key: 'exportAll', onClick: () => exportAll() },
                  ],
                }}
              >
                导出文章
              </Dropdown.Button>
              <Button type="primary" icon={<InboxOutlined />} onClick={() => setIsModalOpen(true)}>
                导入文章
              </Button>
              <Popconfirm title="删除确认" description="确定要删除选中的文章吗？" okText="删除" okButtonProps={{ danger: true }} cancelText="取消" onConfirm={() => delSelected()}>
                <Button danger icon={<DeleteOutlined />}>删除选中</Button>
              </Popconfirm>
            </div>
          )}
        </div>

        <Table
          rowKey="id"
          rowSelection={rowSelection}
          dataSource={articleList}
          columns={columns}
          loading={loading}
          pagination={{
            position: ['bottomRight'],
            current: paging.page,
            pageSize: paging.size,
            total,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                当前第 {paging.page} / {Math.ceil(totalCount / (paging.size || 8))} 页 | 共 {totalCount} 条数据
              </div>
            ),
            onChange: (page, size) => setPaging((prev) => ({ ...prev, page, size: size || prev.size })),
            onShowSizeChange: (_, size) => setPaging((prev) => ({ ...prev, page: 1, size })),
            className: '!px-6 !py-4',
          }}
          className="[&_.ant-table-thead>tr>th]:!bg-gray-50 dark:[&_.ant-table-thead>tr>th]:!bg-boxdark-2 [&_.ant-table-thead>tr>th]:!font-medium [&_.ant-table-thead>tr>th]:!text-gray-500 dark:[&_.ant-table-thead>tr>th]:!text-gray-400"
          scroll={{ x: 1400 }}
        />
      </div>

      <Modal
        title="导入文章"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,

          <Button key="import" type="primary" onClick={handleArticleImport} loading={importLoading} disabled={fileList.length === 0}>
            开始导入
          </Button>,
        ]}
      >
        <div className="py-4">
          <div onClick={() => fileInputRef?.current?.click()} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`w-full h-40 p-4 border border-dashed rounded-lg transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5' : 'border-[#D7D7D7] hover:border-primary bg-[#FAFAFA]'} space-y-2 cursor-pointer`}>
            <div className="flex justify-center">
              <InboxOutlined className="text-5xl text-primary" />
            </div>

            <p className="text-base text-center">{isDragging ? '文件放在此处即上传' : '点击或拖动文件到此区域'}</p>

            <p className="text-sm text-[#999] text-center">仅支持 Markdown 或 JSON 格式</p>
          </div>

          <input multiple type="file" onChange={handleFileInput} ref={fileInputRef} className="hidden" accept=".md" placeholder="请选择 Markdown 格式文件" />

          {fileList.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">已选择的文件：</p>
              <ul className="space-y-2">
                {fileList.map((file) => (
                  <li key={file.uid} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{file.name}</span>

                    <Button type="text" danger size="small" onClick={() => setFileList(fileList.filter((f) => f.uid !== file.uid))}>
                      删除
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fileList.length === 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>你可以下载模板后填写再导入：</span>

              <div className="space-x-2">
                <Button type="link" size="small" onClick={downloadMarkdownTemplate}>
                  下载 Markdown 模板
                </Button>
                <Button type="link" size="small" onClick={downloadJsonTemplate}>
                  下载 JSON 模板
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
