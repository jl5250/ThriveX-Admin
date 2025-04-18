import { useState } from 'react';
import { Spin } from 'antd';
import axios from 'axios';

import { baseURL } from '@/utils/request';
import { useUserStore } from '@/stores';

import { Editor } from '@bytemd/react';
import plugins from './plugins';
import 'highlight.js/styles/vs2015.css';
import 'bytemd/dist/index.css';
import zh from 'bytemd/lib/locales/zh_Hans.json';

import './index.scss';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

const EditorMD = ({ value, onChange }: Props) => {
    const store = useUserStore();
    const [loading, setLoading] = useState(false)

    const uploadImages = async (files: File[]) => {
        try {
            setLoading(true);
            // 处理成后端需要的格式
            const formData = new FormData();
            formData.append("dir", "article");
            for (let i = 0; i < files.length; i++) formData.append('files', files[i])

            const { data: { code, data } } = await axios.post(`${baseURL}/file`, formData, {
                headers: {
                    "Authorization": `Bearer ${store.token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            
            setLoading(false);

            // 返回图片信息数组
            return data.map((url: string) => ({ url }));
        } catch (error) {
            setLoading(false);
        }
    }

    return (
        <>
            <Spin spinning={loading} tip="图片上传中...">
                <Editor
                    value={value}
                    plugins={plugins}
                    onChange={onChange}
                    locale={zh}
                    uploadImages={uploadImages}
                />
            </Spin>
        </>
    );
};

export default EditorMD;
