import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Drawer, Dropdown, MenuProps, message, Spin } from 'antd';

import Title from '@/components/Title';
import Editor from './components/Editor';
import PublishForm from './components/PublishForm';

import { Article } from '@/types/app/article';
import { getArticleDataAPI } from '@/api/Article'

import { BiSave } from "react-icons/bi";
import { AiOutlineEdit, AiOutlineSend } from 'react-icons/ai';
import { titleSty } from '@/styles/sty';

export default () => {
  const [loading, setLoading] = useState(false)

  const [params] = useSearchParams()
  const id = +params.get('id')!
  const isDraftParams = Boolean(params.get('draft'))

  const [data, setData] = useState<Article>({} as Article)
  const [content, setContent] = useState('');
  const [publishOpen, setPublishOpen] = useState(false)

  // 下一步
  const nextBtn = () => {
    content.trim().length >= 1 ? setPublishOpen(true) : message.error('请输入文章内容')
  }

  // 获取文章数据
  const getArticleData = async () => {
    try {
      setLoading(true)

      const { data } = await getArticleDataAPI(id)
      setData(data)
      setContent(data.content)

      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  // 回显数据
  useEffect(() => {
    setPublishOpen(false)

    // 有Id就回显指定的数据
    if (id) {
      getArticleData()
      return
    }

    // 没有就回显本地保存的数据
    const content = localStorage.getItem('article_content')

    if (content) {
      setData({ ...data, content })
      setContent(content)
    }
  }, [id])

  // 保存文章
  const saveBtn = () => {
    if (content.trim().length >= 1) {
      // 将文章内容持久化存储到本地
      localStorage.setItem('article_content', content)
      message.success('内容已保存')
    } else {
      message.error('请输入文章内容')
    }
  }

  useEffect(() => {
    setData({ ...data, content })

    // 点击快捷键保存文章
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止默认的保存行为        
        saveBtn()
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content])

  // 解析接口数据
  const parsingData = async (command: string) => {
    try {
      setLoading(true)

      const res = await fetch(`/ai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_AI_APIPASSWORD}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_AI_MODEL,
          messages: [{
            role: "user",
            content: `${command}${content}`
          }],
          stream: true
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let receivedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedText += decoder.decode(value, { stream: true });

        // 处理每一块数据
        const lines = receivedText.split("\n");
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("data:")) {
            const jsonString = line.substring(5).trim();
            if (jsonString !== "[DONE]") {
              const data = JSON.parse(jsonString);
              console.log("Received chunk:", data.choices[0].delta.content);
              setContent((content) => content + data.choices[0].delta.content);
              // 在这里处理每一块数据
            } else {
              console.log("Stream finished.");
              return;
            }
          }
        }

        // 保留最后一行未处理的数据
        receivedText = lines[lines.length - 1];

        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }

  // AI功能
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'AI 续写',
      onClick: async () => {
        parsingData("帮我续写：")
      },
    },
    {
      key: '2',
      label: 'AI 优化',
      onClick: async () => {
        parsingData("帮我优化该文章，意思不变：")
      },
    },
    {
      key: '3',
      label: 'AI 生成',
      onClick: async () => {
        parsingData("")
      },
    },
  ];

  return (
    <div>
      <Title value="创作">
        <div className='flex items-center space-x-4 w-[360px]'>
          <Dropdown.Button menu={{ items }}>
            <AiOutlineEdit className='text-base' /> 创作神器
          </Dropdown.Button>

          <Button className='w-full flex justify-between' onClick={saveBtn} >
            <BiSave className='text-base' /> 保存
          </Button>

          <Button size='large' type="primary" className='w-full flex justify-between' onClick={nextBtn} >
            <AiOutlineSend className='text-2xl' /> 发布
          </Button>
        </div>
      </Title>

      <Spin spinning={loading}>
        <Card className={`${titleSty} overflow-hidden rounded-xl min-h-[calc(100vh-180px)]`}>
          <Editor value={content} onChange={(value) => setContent(value)} />

          <Drawer
            title={(id && !isDraftParams) ? "编辑文章" : "发布文章"}
            placement="right"
            size='large'
            onClose={() => setPublishOpen(false)}
            open={publishOpen}
          >
            <PublishForm data={data} closeModel={() => setPublishOpen(false)} />
          </Drawer>
        </Card >
      </Spin>
    </div>
  );
};