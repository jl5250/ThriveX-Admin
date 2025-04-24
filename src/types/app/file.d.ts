export type DirList = 'default' | 'article' | 'swiper' | string;

type Dictionary = {
  [key: string]: number;
};

export interface File {
  name: string;
  size: number;
  type: string;
  url: string;
  createTime: number;
  arrt: Dictionary;
}

export interface FileDir {
    path: string;
    name: string;
    icon?: string;
}
