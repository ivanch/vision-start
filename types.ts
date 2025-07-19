
export interface Website {
  id: string;
  name: string;
  url: string;
  icon: string;
  categoryId: string;
}

export interface Server {
  id: string;
  name: string;
  address: string;
}

export interface Category {
  id: string;
  name: string;
  websites: Website[];
}

export interface Wallpaper {
  name: string;
  url?: string;
  base64?: string;
}
