import { useRef, useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Modal, Radio, Select, Spin } from 'antd';
import { useUserStore } from '@/stores';
import { DirList } from '@/types/app/file';
import { baseURL } from '@/utils/request';
import Compressor from 'compressorjs';

interface UploadFileProps {
    dir: DirList,
    open: boolean,
    onSuccess: (urls: string[]) => void,
    onCancel: () => void
}

export default ({ dir, open, onCancel, onSuccess }: UploadFileProps) => {
    const store = useUserStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [quality, setQuality] = useState(1000);
    const [isCompressionUpload, setIsCompressionUpload] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let files = [...e.target.files!];

        try {
            setIsLoading(true);

            // 上传前先压缩文件大小
            const compressedFiles = await Promise.all(files.map(file => {
                return new Promise<File>((resolve, reject) => {
                    new Compressor(file, {
                        quality,
                        success: (blob) => {
                            // 将 Blob 转换为 File
                            const f = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(f);
                        },
                        error: (err) => reject(err)
                    });
                });
            }));

            // 处理成后端需要的格式
            const formData = new FormData();
            formData.append("dir", dir);
            for (let i = 0; i < compressedFiles.length; i++) {
                formData.append('files', compressedFiles[i]);
            }

            // 发起网络请求
            const res = await fetch(`${baseURL}/file`, {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${store.token}`
                }
            });

            const { code, message: msg, data } = await res.json();
            if (code !== 200) return message.error("文件上传失败：" + msg);

            try {
                // 把数据写入到剪贴板
                await navigator.clipboard.writeText(data.join("\n"));
            } catch (error) {
                message.error("复制到剪贴板失败，请手动复制");
                onSuccess(data);
                setIsLoading(false);
                return
            }

            message.success(`🎉 文件上传成功，URL链接已复制到剪贴板`);
            onSuccess(data);
            setIsLoading(false);
            onCloseModel();
        } catch (error) {
            message.error("文件上传失败：" + (error as Error).message);
            setIsLoading(false);
        }
    };

    const onCloseModel = () => {
        setIsCompressionUpload(false);
        setQuality(1000);
        setIsLoading(false);
        onCancel();
    };

    return (
        <>
            <Modal title="文件上传" open={open} onCancel={onCloseModel} footer={null}>
                <Spin spinning={isLoading}>
                    <div className='my-4'>
                        <Radio.Group defaultValue={0} value={isCompressionUpload ? 1 : 0} onChange={(e) => setIsCompressionUpload(e.target.value ? true : false)}>
                            <Radio value={0}>无损上传</Radio>
                            <Radio value={1}>压缩上传</Radio>
                        </Radio.Group>

                        {
                            isCompressionUpload && <Select
                                onChange={setQuality}
                                options={[
                                    { value: 1, label: '轻量压缩(推荐)' },
                                    { value: "NaN", label: '自适应压缩' },
                                    { value: 0.9, label: '0.9' },
                                    { value: 0.8, label: '0.8' },
                                    { value: 0.7, label: '0.7' },
                                    { value: 0.6, label: '0.6' },
                                    { value: 0.5, label: '0.5' },
                                    { value: 0.4, label: '0.4' },
                                    { value: 0.3, label: '0.3' },
                                    { value: 0.2, label: '0.2' },
                                    { value: 0.1, label: '0.1' },
                                ]}
                                defaultValue={1}
                                placeholder="请选择图片压缩质量"
                                className='min-w-44'
                            />
                        }
                    </div>

                    <div className='mt-4'>
                        <div
                            onClick={() => fileInputRef?.current?.click()}
                            className='w-full h-40 p-4 border border-dashed border-[#D7D7D7] rounded-lg hover:border-primary bg-[#FAFAFA] space-y-2 cursor-pointer transition'
                        >
                            <div className='flex justify-center'>
                                <InboxOutlined className='text-5xl text-primary' />
                            </div>

                            <p className="text-base text-center">点击或拖动文件到此区域进行上传</p>
                            <p className="text-sm text-[#999] text-center">支持单个或多个上传</p>
                        </div>

                        <input
                            multiple
                            type="file"
                            onChange={onUploadFile}
                            ref={fileInputRef}
                            className='hidden'
                        />
                    </div>
                </Spin>
            </Modal>
        </>
    );
};
