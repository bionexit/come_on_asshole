import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { createSoundEffect } from '../utils/animations';

interface DisclaimerPageProps {
  onAgree: () => void;
}

function DisclaimerPage({ onAgree }: DisclaimerPageProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    gsap.set([titleRef.current, bubbleRef.current, btnRef.current], { 
      opacity: 1, 
      visibility: 'visible' 
    });
    
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      scale: 0,
      rotation: -180,
      duration: 0.8,
      ease: 'back.out(1.7)'
    })
    .from(bubbleRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.5
    }, '-=0.3')
    .from(btnRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.4
    }, '-=0.2');

    return () => {
      tl.kill();
    };
  }, []);

  const handleAgree = () => {
    if (btnRef.current) {
      createSoundEffect(btnRef.current, 'GO!');
    }
    setTimeout(onAgree, 300);
  };

  return (
    <div 
      className="comic-page active" 
      id="page-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* 标题区域 - 占 30% 高度，视觉焦点 */}
      <div style={{
        height: '30vh',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h1 
          ref={titleRef} 
          className="comic-title"
          style={{ 
            fontSize: 'clamp(1.8rem, 8vh, 3rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.1
          }}
        >
          COME ON<br />ASSHOLE!
        </h1>
      </div>

      {/* 内容区域 - 占 45% 高度，垂直居中 */}
      <div style={{ 
        height: '45vh',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 clamp(16px, 5vw, 32px)',
        boxSizing: 'border-box'
      }}>
        <div 
          ref={bubbleRef} 
          className="speech-bubble"
          style={{ 
            width: '100%',
            maxWidth: '380px',
            padding: 'clamp(16px, 4vh, 28px)'
          }}
        >
          <p style={{ 
            marginBottom: 'clamp(12px, 3vh, 16px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.3rem)'
          }}>
            <strong>人生如戏，全是🌶︎🐔</strong>
          </p>
          <p style={{ 
            fontSize: 'clamp(0.85rem, 3vh, 1.05rem)', 
            lineHeight: 1.7 
          }}>
            本应用仅供娱乐
            <br />
            请勿对号入座，如有雷同，纯属巧合。
            <br />
            对灯起誓，完全匿名 🫣
          </p>
        </div>
      </div>

      {/* 按钮区域 - 占 25% 高度 */}
      <div style={{
        height: '25vh',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '0 clamp(16px, 5vw, 32px)',
        boxSizing: 'border-box'
      }}>
        <button 
          ref={btnRef}
          className="comic-btn" 
          onClick={handleAgree}
          style={{
            width: '100%',
            maxWidth: '320px',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)',
            padding: 'clamp(14px, 4vh, 20px)'
          }}
        >
          我同意，开始冒险 →
        </button>
      </div>
    </div>
  );
}

export default DisclaimerPage;
