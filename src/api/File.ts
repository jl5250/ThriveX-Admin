import Request from '@/utils/request';
import { File, FileDir } from '@/types/app/file';

// 删除文件
export const delFileDataAPI = (filePath: string) =>
  Request('DELETE', `/file?filePath=${filePath}`);

// 获取文件
export const getFileDataAPI = (filePath: string) =>
  Request<File>('GET', `/file/info?filePath=${filePath}`);

// 获取文件列表
export const getFileListAPI = (dir: string) =>
  Request<File[]>('GET', `/file/list?dir=${dir}`);

// 获取目录列表
export const getDirListAPI = () => Request<FileDir[]>('GET', '/file/dir');

// 获取本地指定目录列表
export const getLocalDirListAPI = (dir?: string, platform?: string) =>
  Request<FileDir[]>('GET', `/file/dir/local?dir=${dir}&platform=${platform}`);

// 获取本地指定文件列表
export const getLocalFileListAPI = (dir?: string, platform?: string) =>
  Request<File[]>('GET', `/file/list?dir=${dir}&platform=${platform}`);
