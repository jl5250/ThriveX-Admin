import React, { ChangeEvent, DragEvent, RefObject } from 'react';
import { Modal, Button } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { InboxOutlined } from '@ant-design/icons';

interface ArticleImportModalProps {
  open: boolean;
  fileList: UploadFile[];
  isDragging: boolean;
  importLoading: boolean;
  onCancel: () => void;
  onImport: () => void;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (uid: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDownloadMarkdownTemplate: () => void;
  onDownloadJsonTemplate: () => void;
}

const ArticleImportModal: React.FC<ArticleImportModalProps> = ({
  open,
  fileList,
  isDragging,
  importLoading,
  onCancel,
  onImport,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onFileInputChange,
  onRemoveFile,
  fileInputRef,
  onDownloadMarkdownTemplate,
  onDownloadJsonTemplate,
}) => {
  return (
    <Modal
      title="导入文章"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="import" type="primary" onClick={onImport} loading={importLoading} disabled={fileList.length === 0}>
          开始导入
        </Button>,
      ]}
    >
      <div className="py-4">
        <div
          onClick={() => fileInputRef?.current?.click()}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`w-full h-40 p-4 border border-dashed rounded-lg transition-all duration-300 ${
            isDragging ? 'border-primary bg-primary/5' : 'border-[#D7D7D7] hover:border-primary bg-[#FAFAFA]'
          } space-y-2 cursor-pointer`}
        >
          <div className="flex justify-center">
            <InboxOutlined className="text-5xl text-primary" />
          </div>

          <p className="text-base text-center">{isDragging ? '文件放在此处即上传' : '点击或拖动文件到此区域'}</p>

          <p className="text-sm text-[#999] text-center">仅支持 Markdown 或 JSON 格式</p>
        </div>

        <input
          multiple
          type="file"
          onChange={onFileInputChange}
          ref={fileInputRef}
          className="hidden"
          accept=".md,.json"
          placeholder="请选择 Markdown 或 JSON 格式文件"
        />

        {fileList.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">已选择的文件：</p>
            <ul className="space-y-2">
              {fileList.map((file) => (
                <li key={file.uid} className="flex items-center justify-between bg-gray-50 p-2 rounded-sm">
                  <span className="text-sm">{file.name}</span>

                  <Button type="text" danger size="small" onClick={() => onRemoveFile(file.uid)}>
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
              <Button type="link" size="small" onClick={onDownloadMarkdownTemplate}>
                下载 Markdown 模板
              </Button>
              <Button type="link" size="small" onClick={onDownloadJsonTemplate}>
                下载 JSON 模板
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ArticleImportModal;

