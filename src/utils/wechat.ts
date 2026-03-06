/**
 * 微信 JS-SDK 工具函数 - 简化版
 */

// 缓存配置
let wxConfigCache: {
  timestamp: number;
  url: string;
} | null = null;

// 默认分享图片
const DEFAULT_SHARE_IMG = 'https://asshole.bion.wang/share-thumb.png';

/**
 * 加载微信 JS-SDK
 */
export function loadWeChatSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    const wx = (window as any).wx;
    if (wx) {
      console.log('[WeChat] SDK already loaded');
      resolve();
      return;
    }

    console.log('[WeChat] Loading SDK...');
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.async = true;
    script.onload = () => {
      console.log('[WeChat] SDK loaded');
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load WeChat SDK'));
    document.head.appendChild(script);
  });
}

/**
 * 获取微信配置（从后端）
 */
async function getWeChatConfig(url: string): Promise<{
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}> {
  const response = await fetch(`/api/wechat-signature?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get WeChat config: ${error}`);
  }
  return response.json();
}

/**
 * 初始化微信 JS-SDK
 */
export async function initWeChatSDK(): Promise<boolean> {
  try {
    await loadWeChatSDK();
    const wx = (window as any).wx;
    
    if (!wx) {
      console.error('[WeChat] SDK not available');
      return false;
    }

    // 获取当前页面 URL（去掉 hash）
    const url = window.location.href.split('#')[0];
    
    // 检查缓存
    if (wxConfigCache && 
        wxConfigCache.url === url && 
        Date.now() - wxConfigCache.timestamp < 5 * 60 * 1000) {
      console.log('[WeChat] Using cached config');
      return true;
    }

    console.log('[WeChat] Getting config for URL:', url);
    const config = await getWeChatConfig(url);
    console.log('[WeChat] Config received:', { 
      appId: config.appId, 
      timestamp: config.timestamp 
    });

    return new Promise((resolve) => {
      wx.config({
        debug: false, // 生产环境关闭调试
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [
          'updateAppMessageShareData',
          'updateTimelineShareData',
          'onMenuShareAppMessage',
          'onMenuShareTimeline',
        ],
      });

      wx.ready(() => {
        console.log('[WeChat] SDK ready');
        wxConfigCache = { timestamp: Date.now(), url };
        resolve(true);
      });

      wx.error((err: any) => {
        console.error('[WeChat] SDK config error:', err);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('[WeChat] Init failed:', error);
    return false;
  }
}

/**
 * 设置微信分享内容
 */
export function setWeChatShareData(data: {
  title: string;
  desc: string;
  link?: string;
  imgUrl?: string;
}): void {
  const wx = (window as any).wx;
  if (!wx) {
    console.error('[WeChat] SDK not initialized');
    return;
  }

  const shareData = {
    title: data.title,
    desc: data.desc,
    link: data.link || window.location.href.split('#')[0],
    imgUrl: data.imgUrl || DEFAULT_SHARE_IMG,
  };

  console.log('[WeChat] Setting share data:', shareData);

  // 新版接口 - 分享到朋友圈
  if (wx.updateTimelineShareData) {
    wx.updateTimelineShareData({
      title: shareData.title,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => console.log('[WeChat] Timeline share set'),
      fail: (err: any) => console.error('[WeChat] Timeline share failed:', err),
    });
  }

  // 新版接口 - 分享给朋友
  if (wx.updateAppMessageShareData) {
    wx.updateAppMessageShareData({
      title: shareData.title,
      desc: shareData.desc,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => console.log('[WeChat] App message share set'),
      fail: (err: any) => console.error('[WeChat] App message share failed:', err),
    });
  }

  // 兼容旧版本
  if (wx.onMenuShareTimeline) {
    wx.onMenuShareTimeline({
      title: shareData.title,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
    });
  }

  if (wx.onMenuShareAppMessage) {
    wx.onMenuShareAppMessage({
      title: shareData.title,
      desc: shareData.desc,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      type: 'link',
    });
  }
}

/**
 * 检查是否在微信浏览器中
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isWeChat = ua.includes('micromessenger');
  console.log('[WeChat] Browser check:', isWeChat ? 'WeChat' : 'Other');
  return isWeChat;
}
