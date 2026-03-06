import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { createSoundEffect, createExplosion } from '../utils/animations';
import { getSummary, type SummaryDetail } from '../api/client';
import { getSummaryRating } from '../types';
import { initWeChatSDK, setWeChatShareData, isWeChatBrowser } from '../utils/wechat';

interface SharePageProps {
  companyName: string;
  maskedName: string;
  shits: number;
  onSaveData: () => Promise<boolean>;
  onGoToRanking: () => void;
}

function SharePage({ companyName, maskedName, shits, onSaveData, onGoToRanking }: SharePageProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasSavedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [summary, setSummary] = useState<SummaryDetail | null>(null);
  const [showRatingDetail, setShowRatingDetail] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 保存数据到数据库（只执行一次）
  useEffect(() => {
    // 防止重复保存
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    
    const saveData = async () => {
      try {
        setSaveStatus('saving');
        const success = await onSaveData();
        setSaveStatus(success ? 'saved' : 'error');
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus('error');
      }
    };
    
    saveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在组件挂载时执行一次，使用 hasSavedRef 防止重复

  // 初始化微信分享
  useEffect(() => {
    const initWeChat = async () => {
      // 只在微信浏览器中初始化
      if (!isWeChatBrowser()) {
        console.log('Not in WeChat browser, skip WeChat SDK init');
        return;
      }

      try {
        // 开启调试模式（会弹窗显示调试信息）
        const initialized = await initWeChatSDK(true);
        if (initialized) {
          // 设置分享内容
          const shareTitle = `我在${companyName || '某家公司'}给${maskedName}投喂了${shits}个粑粑！`;
          const shareDesc = '快来一起吐槽职场翔王吧！';
          // 使用原始页面 URL（去掉 hash）
          const shareLink = window.location.href.split('#')[0];
          // 使用 share-thumb.png 作为分享缩略图（300x300 像素）
          const shareImgUrl = `${window.location.origin}/share-thumb.png`;

          console.log('Setting share data:', { shareTitle, shareDesc, shareLink, shareImgUrl });

          setWeChatShareData({
            title: shareTitle,
            desc: shareDesc,
            link: shareLink,
            imgUrl: shareImgUrl,
          });
        }
      } catch (error) {
        console.error('Failed to init WeChat share:', error);
      }
    };

    initWeChat();
  }, [companyName, maskedName, shits]);

  // 礼花效果
  useEffect(() => {
    const fireConfetti = () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          createExplosion({ clientX: x, clientY: y });
        }, i * 200);
      }
    };

    const timer = setTimeout(fireConfetti, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = (_platform: string, e: React.MouseEvent<HTMLButtonElement>) => {
    createSoundEffect(e.currentTarget, 'SHARE!');
    
    const url = window.location.href;
    const text = `我在${companyName || '某家公司'}给${maskedName}投喂了${shits}个粑粑！快来一起吐槽职场翔王吧！\n\n${url}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Come On Asshole - 职场翔王排行榜',
        text: text,
        url: url
      }).catch(() => {
        console.log('分享取消');
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('分享文案已复制到剪贴板！');
      }).catch(() => {
        alert(text);
      });
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createSoundEffect(e.currentTarget, 'SAVE!');
    
    if (!canvasRef.current) {
      alert('截图失败：找不到分享内容');
      return;
    }

    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `翔王投喂记录_${maskedName}_${shits}个粑粑.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('截图失败:', error);
      alert('截图保存失败，请重试');
    }
  };

  // 加载汇总信息
  const loadSummary = async () => {
    if (!companyName || !maskedName) return;
    
    setLoadingSummary(true);
    try {
      // 先获取所有summary来找到companyId
      const response = await fetch('/api/ranking');
      if (response.ok) {
        const allSummaries = await response.json();
        const found = allSummaries.find(
          (s: SummaryDetail) => s.company_name === companyName && s.name_mask === maskedName
        );
        if (found) {
          const summaryData = await getSummary(found.company_id, maskedName);
          setSummary(summaryData);
        }
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGoToRanking = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createSoundEffect(e.currentTarget, 'VIEW!');
    
    // 先加载summary数据
    await loadSummary();
    // 显示评价弹窗
    setShowRatingDetail(true);
  };

  const handleCloseRatingDetail = () => {
    setShowRatingDetail(false);
    // 关闭弹窗后跳转到排行榜
    onGoToRanking();
  };

  // 获取评价
  const rating = summary ? getSummaryRating(summary.max_score) : null;

  return (
    <div 
      className="comic-page active" 
      id="page-8"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'auto',
        position: 'relative',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)'
      }}
    >
      {/* 标题区域 - 占 12% 高度 */}
      <div style={{
        height: '12vh',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 
          className="comic-title comic-title-zh" 
          style={{ 
            fontSize: 'clamp(1.2rem, 4.5vh, 1.7rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          拉出来
          <br />
          就爽了
        </h2>
      </div>

      {/* 分享画布区域 - 占 45% 高度，视觉核心 */}
      <div 
        ref={canvasRef}
        className="share-canvas"
        style={{
          height: '45vh',
          minHeight: '240px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ffff00 0%, #ff9900 100%)',
          border: '4px solid black',
          boxShadow: '6px 6px 0 black',
          margin: '0 clamp(16px, 4vw, 24px)',
          padding: 'clamp(12px, 3vh, 20px)',
          transform: 'rotate(-1deg)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          background: 'white',
          border: '3px solid black',
          padding: 'clamp(12px, 3vh, 20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          {/* 顶部 Logo */}
          <div style={{
            fontSize: 'clamp(1.4rem, 5vh, 2.2rem)',
            fontWeight: 900,
            color: 'var(--accent-red)',
            textShadow: '2px 2px 0 black',
            textAlign: 'center',
            transform: 'rotate(-2deg)',
            lineHeight: 1.1
          }}>
            COME ON
            <br />
            ASSHOLE!
          </div>

          {/* 中间内容 */}
          <div style={{
            fontSize: 'clamp(0.85rem, 3vh, 1.05rem)',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            {companyName && (
              <>
                🏢 {companyName}
                <br />
              </>
            )}
            👤 您为{maskedName || '匿名翔王'}
            <br />
            投喂了 <span style={{ color: 'var(--accent-red)', fontSize: 'clamp(1.1rem, 4vh, 1.4rem)' }}>{shits}</span> 个粑粑💩 
            <br />
            TA 好感动
          </div>

          {/* 底部二维码区域 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 12px)'
          }}>
            <div style={{
              background: 'black',
              color: 'white',
              padding: 'clamp(4px, 1vh, 6px) clamp(8px, 2vw, 12px)',
              fontWeight: 900,
              fontSize: 'clamp(0.7rem, 2.2vh, 0.85rem)',
              transform: 'skew(-3deg)'
            }}>
              扫码查看完整排行榜
            </div>
            <div style={{
              width: 'clamp(50px, 10vh, 70px)',
              height: 'clamp(50px, 10vh, 70px)',
              background: '#f0f0f0',
              border: '3px solid black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1.5rem, 4vh, 2rem)',
              flexShrink: 0
            }}>
              🔲
            </div>
          </div>
        </div>
      </div>

      {/* 保存状态提示 */}
      <div style={{
        height: '4vh',
        minHeight: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {saveStatus === 'saving' && (
          <span style={{ color: '#666', fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)' }}>
            💾 正在保存数据...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ color: 'green', fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)' }}>
            ✅ 数据已保存到排行榜
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ color: 'var(--accent-red)', fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)' }}>
            ❌ 保存失败
          </span>
        )}
      </div>

      {/* 提示语区域 - 占 13% 高度 */}
      <div 
        style={{ 
          height: '13vh',
          minHeight: '60px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 clamp(16px, 4vw, 24px)',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="speech-bubble" 
          style={{ 
            fontSize: 'clamp(0.75rem, 2.5vh, 0.9rem)',
            textAlign: 'center',
            padding: 'clamp(10px, 2.5vh, 14px)',
            maxWidth: '360px'
          }}
        >
          分享给你的同事们！
          <br />
          让更多人认识这位"优秀人才"~ 😏
        </div>
      </div>
      {/* 按钮区域 - 占 30% 高度 */}
      <div 
        style={{ 
          height: '26vh',
          minHeight: '126px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(16px, 4vw, 24px)',
          boxSizing: 'border-box',
          gap: 'clamp(8px, 2vh, 12px)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(10px, 2.5vw, 16px)'
        }}>
          <button
            className="comic-btn"
            style={{ 
              flex: 1,
              padding: 'clamp(12px, 3.5vh, 18px)',
              fontSize: 'clamp(0.9rem, 3vh, 1.1rem)'
            }}
            onClick={(e) => handleShare('wechat', e)}
          >
            📱 分享
          </button>
          <button
            className="comic-btn secondary"
            style={{ 
              flex: 1,
              padding: 'clamp(12px, 3.5vh, 18px)',
              fontSize: 'clamp(0.9rem, 3vh, 1.1rem)'
            }}
            onClick={handleSave}
          >
            💾 保存
          </button>
        </div>

        <button
          className="comic-btn"
          onClick={handleGoToRanking}
          style={{ 
            padding: 'clamp(12px, 3.5vh, 18px)',
            fontSize: 'clamp(0.9rem, 3vh, 1.1rem)'
          }}
        >
          📊 查看排行榜
        </button>

      </div>


      {/* 评价弹窗 */}
      {showRatingDetail && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'clamp(16px, 4vw, 32px)'
          }}
          onClick={handleCloseRatingDetail}
        >
          <div 
            style={{
              background: 'white',
              border: '4px solid black',
              boxShadow: '8px 8px 0 black',
              padding: 'clamp(16px, 4vh, 24px)',
              maxWidth: '420px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingSummary ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                加载中...
              </div>
            ) : rating ? (
              <>
                {/* 头部 - 人物信息 */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '16px',
                  borderBottom: '3px solid black',
                  paddingBottom: '12px'
                }}>
                  <div style={{ 
                    fontSize: 'clamp(1.3rem, 4vh, 1.6rem)', 
                    fontWeight: 900,
                    color: 'var(--accent-red)',
                    textShadow: '2px 2px 0 black'
                  }}>
                    {maskedName}
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(0.8rem, 2.2vh, 0.95rem)', 
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    {companyName}
                  </div>
                </div>

                {/* 评分等级 */}
                <div style={{
                  background: 'var(--accent-yellow)',
                  border: '3px solid black',
                  padding: 'clamp(12px, 3vh, 16px)',
                  marginBottom: '16px',
                  textAlign: 'center',
                  transform: 'rotate(-1deg)'
                }}>
                  <div style={{
                    fontSize: 'clamp(1.1rem, 3.5vh, 1.4rem)',
                    fontWeight: 900,
                    marginBottom: '6px'
                  }}>
                    {rating.level_cn}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)',
                    color: '#666',
                    fontStyle: 'italic',
                    marginBottom: '8px'
                  }}>
                    {rating.level_en}
                  </div>
                  <div style={{
                    background: 'black',
                    color: 'white',
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontWeight: 900,
                    fontSize: 'clamp(0.85rem, 2.5vh, 1.05rem)'
                  }}>
                    {rating.rating_cn} · {summary?.max_score || 0}分
                  </div>
                </div>

                {/* 评价内容 */}
                <div style={{
                  background: '#f5f5f5',
                  border: '2px solid #ddd',
                  padding: 'clamp(12px, 3vh, 16px)',
                  marginBottom: '16px',
                  fontSize: 'clamp(0.85rem, 2.5vh, 1rem)',
                  lineHeight: 1.6
                }}>
                  <div style={{
                    fontWeight: 900,
                    marginBottom: '8px',
                    color: 'var(--accent-red)'
                  }}>
                    💬 评语
                  </div>
                  {rating.comment_cn}
                </div>

                {/* 统计信息 */}
                {summary && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '12px',
                    background: '#fafafa',
                    border: '2px solid #eee',
                    marginBottom: '16px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'clamp(1.2rem, 3.5vh, 1.5rem)', fontWeight: 900 }}>
                        {summary.shits_count}
                      </div>
                      <div style={{ fontSize: 'clamp(0.7rem, 2vh, 0.8rem)', color: '#666' }}>
                        💩 粑粑数
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'clamp(1.2rem, 3.5vh, 1.5rem)', fontWeight: 900 }}>
                        {summary.vote_id_count}
                      </div>
                      <div style={{ fontSize: 'clamp(0.7rem, 2vh, 0.8rem)', color: '#666' }}>
                        🗳️ 投票数
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 'clamp(1.2rem, 3.5vh, 1.5rem)', fontWeight: 900 }}>
                        {summary.max_score}
                      </div>
                      <div style={{ fontSize: 'clamp(0.7rem, 2vh, 0.8rem)', color: '#666' }}>
                        📊 最高分
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="comic-btn"
                  onClick={handleCloseRatingDetail}
                  style={{ 
                    width: '100%',
                    padding: 'clamp(12px, 3vh, 16px)',
                    fontSize: 'clamp(0.95rem, 3vh, 1.1rem)'
                  }}
                >
                  查看排行榜 →
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>暂无评价数据</p>
                <button
                  className="comic-btn"
                  onClick={handleCloseRatingDetail}
                  style={{ 
                    width: '100%',
                    marginTop: '16px',
                    padding: 'clamp(10px, 2.5vh, 14px)'
                  }}
                >
                  查看排行榜
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SharePage;
