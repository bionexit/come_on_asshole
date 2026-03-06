import { useEffect, useCallback } from 'react';
import { initWeChatSDK, setWeChatShareData, isWeChatBrowser } from '../utils/wechat';

interface ShareConfig {
  title: string;
  desc: string;
  imgUrl?: string;
}

const DEFAULT_IMG_URL = 'https://asshole.bion.wang/share-thumb.png';

/**
 * 微信分享 Hook
 * 自动初始化微信 SDK 并设置分享内容
 */
export function useWechatShare(config: ShareConfig) {
  const initShare = useCallback(async () => {
    if (!isWeChatBrowser()) {
      console.log('[WeChat] Not in WeChat browser, skip');
      return;
    }

    try {
      console.log('[WeChat] Initializing SDK...');
      const initialized = await initWeChatSDK();
      
      if (initialized) {
        const shareData = {
          title: config.title || '职场翔王排行榜',
          desc: config.desc || '快来一起吐槽职场混蛋吧！',
          link: window.location.href.split('#')[0],
          imgUrl: config.imgUrl || DEFAULT_IMG_URL,
        };

        console.log('[WeChat] Setting share data:', shareData);
        setWeChatShareData(shareData);
      }
    } catch (error) {
      console.error('[WeChat] Init failed:', error);
    }
  }, [config.title, config.desc, config.imgUrl]);

  useEffect(() => {
    initShare();
  }, [initShare]);

  // 提供手动更新分享内容的方法
  const updateShare = useCallback((newConfig: Partial<ShareConfig>) => {
    if (!isWeChatBrowser()) return;
    
    const shareData = {
      title: newConfig.title || config.title || '职场翔王排行榜',
      desc: newConfig.desc || config.desc || '快来一起吐槽职场混蛋吧！',
      link: window.location.href.split('#')[0],
      imgUrl: newConfig.imgUrl || config.imgUrl || DEFAULT_IMG_URL,
    };
    
    console.log('[WeChat] Updating share data:', shareData);
    setWeChatShareData(shareData);
  }, [config]);

  return { updateShare };
}
