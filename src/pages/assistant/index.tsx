import { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, Input, List, Modal, Popconfirm, Select, Tooltip, Space, Skeleton } from 'antd';
import { DeleteOutlined, FormOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';

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
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5 mb-4">
          <div className="flex justify-between items-center">
            <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
            <Skeleton.Button active size="default" style={{ width: 100, height: 32 }} />
          </div>
        </Card>

        {/* 列表卡片骨架屏 */}
        <Card className="border-stroke">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="py-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-x-4">
                  <Skeleton.Input active size="default" style={{ width: 200, height: 24, marginBottom: 8 }} />
                  <Skeleton.Input active size="small" style={{ width: 150, height: 24 }} />
                </div>

                <div className="flex space-x-2">
                  <Skeleton.Button active size="small" style={{ width: 80, height: 28 }} />
                  <Skeleton.Button active size="small" style={{ width: 28, height: 28 }} />
                  <Skeleton.Button active size="small" style={{ width: 28, height: 28 }} />
                  <Skeleton.Button active size="small" style={{ width: 80, height: 28 }} />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="助手管理">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加助手
        </Button>
      </Title>

      <Card className="border-stroke">
        <List
          dataSource={list}
          renderItem={(item) => {
            const info = modelInfoMap[item.model];
            return (
              <List.Item
                actions={[
                  <Button key="test" type="link" onClick={() => testConnection(item)} loading={testingMap[item.id]}>
                    {testingMap[item.id] ? '测试中...' : '测试连接'}
                  </Button>,
                  <Button
                    key="edit"
                    type="text"
                    onClick={() => {
                      form.setFieldsValue(item);
                      setInputModelValue(item.model);
                      setAssistant(item);
                      setIsModalOpen(true);
                    }}
                    icon={<FormOutlined className="text-primary" />}
                  />,
                  <Popconfirm key="del" title="您确定要删除这个助手吗？" onConfirm={() => delAssistantData(+item.id)} okText="确定" cancelText="取消">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                  <Button key="default" type="text" onClick={() => setDefaultAssistant(+item.id)}>
                    {item.isDefault ? '默认助手' : '设为默认'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.name}</span>
                    </Space>
                  }
                  description={
                    <span>
                      模型: {info ? info.label : item.model}
                      {info && (
                        <Tooltip title={info.desc}>
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      )}
                    </span>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

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
          <Form.Item name="name" label="助手名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input placeholder="例如：DeepSeek、OpenAI 等" />
          </Form.Item>

          <Form.Item name="url" label="API 地址" tooltip="填写完整的 API 接口地址，如 https://api.deepseek.com/v1" rules={[{ required: true, message: '请输入 API 地址' }]}>
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>

          <Form.Item name="key" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="请输入 API 密钥" />
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
