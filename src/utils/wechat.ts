/**
 * 微信 JS-SDK 工具函数
 */

// 微信配置接口
interface WeChatConfig {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

// 分享内容接口
interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

/**
 * 加载微信 JS-SDK
 */
export function loadWeChatSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    // 如果已经加载过
    if ((window as any).wx) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load WeChat SDK'));
    document.head.appendChild(script);
  });
}

/**
 * 获取微信配置（从后端）
 */
async function getWeChatConfig(url: string): Promise<WeChatConfig> {
  const response = await fetch(`/api/wechat-signature?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Failed to get WeChat config');
  }
  return response.json();
}

/**
 * 初始化微信 JS-SDK
 * @param debug 是否开启调试模式
 */
export async function initWeChatSDK(debug: boolean = false): Promise<boolean> {
  try {
    await loadWeChatSDK();
    const wx = (window as any).wx;
    if (!wx) {
      console.error('WeChat SDK not loaded');
      return false;
    }

    // 获取当前页面 URL（去掉 hash）
    const url = window.location.href.split('#')[0];
    console.log('Initializing WeChat SDK for URL:', url);
    
    // 从后端获取签名
    const config = await getWeChatConfig(url);
    console.log('WeChat config received:', { appId: config.appId, timestamp: config.timestamp, nonceStr: config.nonceStr });

    // 配置微信 JS-SDK
    wx.config({
      debug: debug, // 调试模式会alert弹窗显示调试信息
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: [
        'checkJsApi',
        'updateAppMessageShareData', // 分享给朋友
        'updateTimelineShareData',   // 分享到朋友圈
        'onMenuShareAppMessage',     // 兼容旧版本
        'onMenuShareTimeline',       // 兼容旧版本
      ],
    });

    return new Promise((resolve) => {
      wx.ready(() => {
        console.log('WeChat SDK ready');
        // 检查接口是否可用
        wx.checkJsApi({
          jsApiList: ['updateTimelineShareData', 'onMenuShareTimeline'],
          success: (res: any) => {
            console.log('WeChat JS API check:', res);
          },
        });
        resolve(true);
      });

      wx.error((err: any) => {
        console.error('WeChat SDK error:', err);
        alert('微信配置失败: ' + JSON.stringify(err));
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Failed to init WeChat SDK:', error);
    alert('初始化微信 SDK 失败: ' + (error as Error).message);
    return false;
  }
}

/**
 * 设置微信分享内容
 */
export function setWeChatShareData(shareData: ShareData): void {
  const wx = (window as any).wx;
  if (!wx) {
    console.error('WeChat SDK not initialized');
    return;
  }

  console.log('Setting WeChat share data:', shareData);

  // 分享到朋友圈（新版）
  if (wx.updateTimelineShareData) {
    wx.updateTimelineShareData({
      title: shareData.title,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => {
        console.log('Share config updated (timeline)');
      },
      fail: (err: any) => {
        console.error('Share config failed (timeline):', err);
      },
    });
    console.log('updateTimelineShareData called');
  }

  // 分享给朋友（新版）
  if (wx.updateAppMessageShareData) {
    wx.updateAppMessageShareData({
      ...shareData,
      success: () => {
        console.log('Share config updated (app message)');
      },
      fail: (err: any) => {
        console.error('Share config failed (app message):', err);
      },
    });
    console.log('updateAppMessageShareData called');
  }

  // 兼容旧版本 - 分享到朋友圈
  if (wx.onMenuShareTimeline) {
    wx.onMenuShareTimeline({
      title: shareData.title,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => console.log('Share success (timeline - old)'),
      cancel: () => console.log('Share cancelled (timeline - old)'),
    });
    console.log('onMenuShareTimeline called');
  }

  // 兼容旧版本 - 分享给朋友
  if (wx.onMenuShareAppMessage) {
    wx.onMenuShareAppMessage({
      ...shareData,
      type: 'link',
      dataUrl: '',
      success: () => console.log('Share success (app message - old)'),
      cancel: () => console.log('Share cancelled (app message - old)'),
    });
    console.log('onMenuShareAppMessage called');
  }
}

/**
 * 检查是否在微信浏览器中
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}
