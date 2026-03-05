import { useState, useRef, useCallback } from 'react';
import { createSoundEffect, shakeScreen } from '../utils/animations';

interface ShitPageProps {
  maskedName: string;
  onComplete: (shits: number) => void;
}

const MAX_SHITS = 99;

function ShitPage({ maskedName, onComplete }: ShitPageProps) {
  const [shits, setShits] = useState(0);
  const [isShitting, setIsShitting] = useState(false);
  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [shitItems, setShitItems] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [assScale, setAssScale] = useState(1);
  const [eaterScale, setEaterScale] = useState(1);
  const assRef = useRef<HTMLDivElement>(null);
  const eaterRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);

  const handleFeed = useCallback(() => {
    if (shits >= MAX_SHITS) {
      setShowMaxWarning(true);
      if (assRef.current) {
        createSoundEffect(assRef.current, 'NO MORE!');
      }
      shakeScreen();
      setTimeout(() => setShowMaxWarning(false), 2000);
      return;
    }

    setIsShitting(true);
    const newShitId = nextIdRef.current++;
    
    const newShit = {
      id: newShitId,
      left: 30 + Math.random() * 40,
      delay: Math.random() * 0.2
    };
    setShitItems(prev => [...prev, newShit]);
    setShits(prev => prev + 1);

    if (assRef.current) {
      createSoundEffect(assRef.current, 'PLOP!');
    }

    setAssScale(1.2);
    setTimeout(() => setAssScale(1), 100);

    const newEaterScale = 1 + (shits + 1) * 0.01;
    setEaterScale(newEaterScale);

    setTimeout(() => {
      setShitItems(prev => prev.filter(s => s.id !== newShitId));
    }, 1500);

    setTimeout(() => setIsShitting(false), 300);
  }, [shits]);

  const handleFinish = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    createSoundEffect(e.currentTarget, 'DONE!');
    
    setTimeout(() => {
      onComplete(shits);
    }, 200);
  }, [onComplete, shits]);

  return (
    <div 
      className="comic-page active" 
      id="page-7"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* 标题区域 - 占 10% 高度 */}
      <div style={{
        height: '10vh',
        minHeight: '50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 
          className="comic-title comic-title-zh" 
          style={{ 
            fontSize: 'clamp(1.2rem, 4vh, 1.6rem)',
            margin: 0,
            textAlign: 'center'
          }}
        >
          投喂时间
        </h2>
      </div>

      {/* 姓名显示 - 占 8% 高度 */}
      {maskedName && (
        <div style={{
          height: '8vh',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: 'clamp(0.95rem, 3.5vh, 1.2rem)',
            fontWeight: 900,
            color: 'var(--accent-red)',
            textShadow: '2px 2px 0 black'
          }}>
            给 <span style={{ fontSize: 'clamp(1.1rem, 4vh, 1.4rem)' }}>{maskedName}</span> 的投喂
          </div>
        </div>
      )}

      {/* 计数器 - 占 10% 高度 */}
      <div style={{
        height: '10vh',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        flexShrink: 0
      }}>
        <span style={{ fontSize: 'clamp(1.5rem, 5vh, 2.2rem)' }}>💩</span>
        <span style={{
          fontSize: 'clamp(2rem, 7vh, 3rem)',
          fontWeight: 900,
          color: '#8B4513',
          textShadow: '3px 3px 0 black'
        }}>
          {shits}
        </span>
        <span style={{ fontSize: 'clamp(0.85rem, 2.5vh, 1rem)', color: '#666' }}>
          / {MAX_SHITS}
        </span>
      </div>

      {/* 最大数量警告 - 占 8% 高度（条件显示） */}
      {showMaxWarning && (
        <div style={{
          height: '8vh',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <div style={{
            background: 'var(--accent-red)',
            color: 'white',
            padding: 'clamp(8px, 2vh, 12px) clamp(12px, 3vw, 20px)',
            textAlign: 'center',
            fontWeight: 900,
            fontSize: 'clamp(0.85rem, 2.8vh, 1.05rem)',
            border: '4px solid black',
            boxShadow: '6px 6px 0 black',
            animation: 'shake 0.5s ease-in-out'
          }}>
            🚫 拉不出来了！
            <span style={{ fontSize: 'clamp(0.7rem, 2.2vh, 0.9rem)', marginLeft: '8px' }}>
              最多只能投喂99个哦~
            </span>
          </div>
        </div>
      )}

      {/* 动画区域 - 占 40% 高度，核心区域 */}
      <div 
        className="shit-area" 
        style={{
          height: '40vh',
          minHeight: '200px',
          flexShrink: 0,
          position: 'relative',
          background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
          border: '4px solid black',
          borderRadius: 'clamp(12px, 3vh, 20px)',
          overflow: 'hidden',
          margin: '0 clamp(16px, 4vw, 24px)'
        }}
      >
        {/* 屁股（上方） */}
        <div
          ref={assRef}
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vh, 16px)',
            left: '50%',
            transform: `translateX(-50%) scaleY(${assScale})`,
            fontSize: 'clamp(2.2rem, 8vh, 3.5rem)',
            cursor: 'pointer',
            transition: 'transform 0.1s ease-out',
            zIndex: 10
          }}
          onClick={handleFeed}
        >
          🍑
        </div>

        {/* 粑粑掉落动画 */}
        {shitItems.map((shit) => (
          <div
            key={shit.id}
            style={{
              position: 'absolute',
              left: `${shit.left}%`,
              top: '25%',
              fontSize: 'clamp(1.1rem, 3.5vh, 1.5rem)',
              zIndex: 5,
              animation: `drop 1.5s ease-in ${shit.delay}s forwards`
            }}
          >
            💩
          </div>
        ))}

        {/* 吃的人（下方） */}
        <div
          ref={eaterRef}
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 2vh, 16px)',
            left: '50%',
            transform: `translateX(-50%) scale(${eaterScale})`,
            fontSize: 'clamp(2.2rem, 8vh, 3.5rem)',
            zIndex: 10,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {shits > 50 ? '🤢' : shits > 20 ? '😫' : '😋'}
        </div>

        {/* 进度条背景 */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: `${Math.min((shits / MAX_SHITS) * 100, 100)}%`,
          background: 'rgba(139, 69, 19, 0.1)',
          transition: 'height 0.3s ease-out'
        }} />
      </div>

      {/* 控制按钮区域 - 占 12% 高度 */}
      <div 
        style={{ 
          height: '12vh',
          minHeight: '60px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(16px, 4vw, 24px)',
          boxSizing: 'border-box',
          gap: 'clamp(10px, 2.5vw, 16px)'
        }}
      >
        <button
          className="comic-btn"
          onClick={handleFeed}
          disabled={isShitting || shits >= MAX_SHITS}
          style={{ 
            flex: 1,
            padding: 'clamp(12px, 3.5vh, 18px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)'
          }}
        >
          🍑 投喂
        </button>
        <button
          className="comic-btn secondary"
          onClick={handleFinish}
          disabled={shits === 0}
          style={{ 
            flex: 1,
            padding: 'clamp(12px, 3.5vh, 18px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)'
          }}
        >
          💼 下班
        </button>
      </div>

      {/* 提示语区域 - 占 10% 高度 */}
      <div 
        style={{ 
          height: '10vh',
          minHeight: '50px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
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
          尽情投喂吧！最多99个，超过就拉不出来了~ 😂
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes drop {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(60px) rotate(180deg);
          }
          100% {
            transform: translateY(90px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

export default ShitPage;
