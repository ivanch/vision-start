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

export interface Config {
  title: string;
  subtitle: string;
  currentWallpapers: string[];
  wallpaperFrequency: string;
  wallpaperBlur: number;
  wallpaperBrightness: number;
  wallpaperOpacity: number;
  titleSize: string;
  subtitleSize: string;
  alignment: string;
  horizontalAlignment: string;
  clock: {
    enabled: boolean;
    size: string;
    font: string;
    format: string;
  };
  serverWidget: {
    enabled: boolean;
    pingFrequency: number;
    servers: Server[];
  };
  tileSize?: string;
}