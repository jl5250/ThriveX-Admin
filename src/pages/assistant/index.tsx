import { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, Input, Modal, Select, Tooltip, Space, Skeleton, Avatar, Tag, Dropdown, MenuProps } from 'antd';
import { DeleteOutlined, FormOutlined, PlusOutlined, InfoCircleOutlined, MoreOutlined, ApiOutlined, ThunderboltFilled } from '@ant-design/icons';
import { ImSwitch } from 'react-icons/im';

import Title from '@/components/Title';
import useAssistant from '@/hooks/useAssistant';
import { Assistant } from '@/types/app/assistant';

// 模型信息
const modelInfoMap: Record<string, { desc: string; label: string }> = {
  'deepseek-chat': {
    desc: '通用聊天模型',
    label: 'DeepSeek Chat',
  },
  'deepseek-reasoner': {
    desc: '多步推理优化模型',
    label: 'DeepSeek Reasoner',
  },
  'moonshot-v1-128k': {
    desc: '长上下文模型，支持128k上下文',
    label: 'Moonshot v1 128k',
  },
  'gpt-4o': {
    desc: '多模态大模型',
    label: 'OpenAI GPT-4o',
  },
  'gpt-3.5-turbo': {
    desc: '轻量快速模型',
    label: 'OpenAI GPT-3.5 Turbo',
  },
  'glm-4': {
    desc: '中文大模型',
    label: '智谱 GLM-4',
  },
  'qwen-turbo': {
    desc: '快速对话模型',
    label: '通义千问 Turbo',
  },
  'ernie-bot': {
    desc: '文心一言大模型',
    label: '百度文心一言大模型',
  },
  'doubao-chat': {
    desc: '字节跳动豆包模型',
    label: '豆包 Chat',
  },
  // 你可以继续添加更多模型
};

// 获取模型主题（颜色和图标）
const getModelTheme = (model: string): { color: string; icon: string } => {
  const themeMap: Record<string, { color: string; icon: string }> = {
    'deepseek-chat': { color: '#1890ff', icon: 'DS' },
    'deepseek-reasoner': { color: '#722ed1', icon: 'DR' },
    'moonshot-v1-128k': { color: '#13c2c2', icon: 'M' },
    'gpt-4o': { color: '#52c41a', icon: 'GPT4' },
    'gpt-3.5-turbo': { color: '#faad14', icon: 'GPT3' },
    'glm-4': { color: '#eb2f96', icon: 'GLM' },
    'qwen-turbo': { color: '#f5222d', icon: 'QW' },
    'ernie-bot': { color: '#fa8c16', icon: 'EB' },
    'doubao-chat': { color: '#2f54eb', icon: 'DB' },
  };

  return themeMap[model] || { color: '#8c8c8c', icon: 'AI' };
};

export default () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assistant, setAssistant] = useState<Assistant>({} as Assistant);
  const [inputModelValue, setInputModelValue] = useState('');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const { list, testingMap, saveAssistant, delAssistantData, setDefaultAssistant, testConnection } = useAssistant();

  // 监听 list 变化，设置初始加载状态
  useEffect(() => {
    if (list.length > 0 || isFirstLoadRef.current) {
      if (isFirstLoadRef.current && list.length > 0) {
        setInitialLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  }, [list]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      console.log(values);

      // 如果输入的模型不在列表，则直接用输入的文本
      const model = values.model;
      saveAssistant({ ...assistant, ...values, model }).then((success) => {
        if (success) {
          setIsModalOpen(false);
          form.resetFields();
          setInputModelValue('');
          setAssistant({} as Assistant);
        }
      });
    });
  };

  // 生成 Select options
  const selectOptions = Object.entries(modelInfoMap).map(([value, info]) => ({
    label: info.label,
    value,
  }));

  // 如果输入值是新模型，且不在选项里，加入它
  if (inputModelValue && !selectOptions.find((opt) => opt.value === inputModelValue)) {
    selectOptions.push({ label: inputModelValue, value: inputModelValue });
  }

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5 mb-2">
          <div className="flex justify-between items-center">
            <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
            <Skeleton.Button active size="default" style={{ width: 100, height: 32 }} />
          </div>
        </Card>

        {/* 卡片网格骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="border-stroke dark:border-strokedark">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton.Avatar active size={48} shape="square" />
                  <div>
                    <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                  </div>
                </div>
                <Skeleton.Button active size="small" style={{ width: 32, height: 32 }} />
              </div>
              <div className="bg-gray-100 dark:bg-boxdark-2 rounded-md p-3 py-4 mb-4">

              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-strokedark">
                <Skeleton.Button active size="default" style={{ width: '100%', height: 32 }} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title value="助手管理">
        <Button type="primary" size="large" onClick={() => setIsModalOpen(true)}>
          添加助手
        </Button>
      </Title>

      {/* 卡片网格区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {list.map((item) => {
          const info = modelInfoMap[item.model];
          const theme = getModelTheme(item.model);
          const isTesting = testingMap[item.id];
          const isDefault = !!item.isDefault;

          // 下拉菜单项
          const menuItems: MenuProps['items'] = [
            {
              key: 'edit',
              label: '编辑配置',
              icon: <FormOutlined />,
              onClick: () => {
                form.setFieldsValue(item);
                setInputModelValue(item.model);
                setAssistant(item);
                setIsModalOpen(true);
              }
            },
            {
              key: 'default',
              label: isDefault ? '已开启' : '开启助手',
              icon: <ImSwitch />,
              disabled: isDefault,
              onClick: () => setDefaultAssistant(+item.id)
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              label: '删除助手',
              danger: true,
              icon: <DeleteOutlined />,
              onClick: () => {
                Modal.confirm({
                  title: '确认删除',
                  content: `您确定要删除助手 "${item.name}" 吗？此操作无法撤销。`,
                  okText: '删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => delAssistantData(+item.id),
                });
              }
            }
          ];

          return (
            <Card
              key={item.id}
              className={`relative p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${item.isDefault
                ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-900/30 dark:via-boxdark dark:to-blue-900/30 dark:!border-blue-500'
                : 'border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-boxdark/80 dark:via-boxdark dark:to-boxdark-2/80 dark:border-strokedark'
                }`}
              styles={{ body: { padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' } }}
            >
              {/* 卡片头部：图标与名称 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    shape="square"
                    size={48}
                    style={{ backgroundColor: theme.color, verticalAlign: 'middle' }}
                    className="shadow-md text-lg font-bold"
                  >
                    {theme.icon}
                  </Avatar>

                  <div>
                    <div className="font-bold text-lg text-gray-800 dark:text-white leading-tight mb-1 truncate max-w-[160px] ml-[5px]">
                      {item.name}
                    </div>

                    <Space size={4}>
                      <Tag bordered={false} className="text-xs bg-gray-100 text-gray-500 dark:bg-boxdark-2 dark:text-gray-300 mr-0">
                        {info ? info.label : item.model}
                      </Tag>

                      {info && (
                        <Tooltip title={info.desc}>
                          <InfoCircleOutlined className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-primary dark:hover:text-primary" />
                        </Tooltip>
                      )}
                    </Space>
                  </div>
                </div>

                {/* 更多操作菜单 */}
                <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow className="bg-gray-50 dark:bg-boxdark-2/50 dark:hover:bg-boxdark-2/30">
                  <Button type="text" icon={<MoreOutlined className="text-xl text-gray-400 dark:text-gray-500" />} />
                </Dropdown>
              </div>

              {/* 卡片内容：URL显示 */}
              <div className="bg-gray-50 dark:bg-boxdark-2 rounded-md px-3 py-2 mb-2 flex-1 border border-gray-100 dark:border-strokedark">
                <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs uppercase font-bold mb-1">
                  <ApiOutlined className="mr-1" /> API Endpoint
                </div>
                <div
                  className="text-gray-600 dark:text-gray-300 font-mono text-sm m-0 break-all"
                >
                  {item.url}
                </div>
              </div>

              {/* 卡片底部：主要操作 */}
              <div className="mt-auto pt-2 border-t border-gray-100 dark:border-strokedark flex justify-end">
                <Button
                  type={isTesting ? 'default' : 'dashed'}
                  className={`${isTesting ? '' : 'text-primary border-primary bg-blue-50/50 dark:bg-blue-900/20 dark:border-primary dark:text-primary'} w-full`}
                  icon={isTesting ? <ThunderboltFilled spin /> : <ThunderboltFilled />}
                  loading={isTesting}
                  onClick={() => testConnection(item)}
                >
                  {isTesting ? '连接测试中...' : '测试连接'}
                </Button>
              </div>
            </Card>
          );
        })}

        {/* 空状态下的添加按钮（如果没有数据或者作为最后一个Card） */}
        <Button
          type="dashed"
          className="h-auto min-h-[200px] border-2 flex flex-col items-center justify-center gap-2 !bg-white dark:!bg-boxdark text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:border-primary dark:hover:border-primary rounded-lg bg-transparent dark:border-strokedark"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusOutlined style={{ fontSize: '24px' }} />
          <span className="font-medium">添加新助手</span>
        </Button>
      </div>

      <Modal
        title={assistant.id ? '编辑助手' : '添加助手'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setInputModelValue('');
          setAssistant({} as Assistant);
        }}
      >
        <Form form={form} layout="vertical" size="large">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input placeholder="例如：DeepSeek、OpenAI 等" />
          </Form.Item>

          <Form.Item
            name="url"
            label="API 地址"
            tooltip="填写完整的 API 接口地址，如 https://api.deepseek.com/v1"
            rules={[
              { required: true, message: '请输入 API 地址' },
              {
                pattern: /^https?:\/\//,
                message: '请输入正确的 API 地址'
              }
            ]}
          >
            <Input placeholder="https://api.deepseek.com/v1" autoComplete="off" />
          </Form.Item>

          <Form.Item name="key" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="请输入 API 密钥" autoComplete="new-password" />
          </Form.Item>

          <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择或输入模型' }]}>
            <Select
              showSearch
              placeholder="选择或输入模型"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes((input ?? '').toLowerCase())}
              onSearch={(val) => setInputModelValue(val)}
              optionLabelProp="label"
              options={selectOptions}
              optionRender={(option) => {
                const info = modelInfoMap[option.value as string];
                if (info) {
                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{option.label}</span>

                      <Tooltip title={info.desc}>
                        <InfoCircleOutlined className="text-slate-300" />
                      </Tooltip>
                    </div>
                  );
                }
                return <span>{option.label}</span>;
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
