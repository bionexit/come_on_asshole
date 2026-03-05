import { useEffect, useState, useRef } from 'react';

interface MeditationPageProps {
  onComplete: () => void;
}

const MEDITATION_TEXTS = [
  {
    text: '默念那个公司里翔王的名字',
    subtext: '让TA在你脑海中浮现...'
  },
  {
    text: '脑海里全是Ta那猥琐的身影',
    subtext: '那副嘴脸，那副德行...'
  },
  {
    text: '完了，挥之不去了',
    subtext: '深呼吸，准备开始审判！'
  }
];

const TEXT_DISPLAY_DURATION = 2500;
const TRANSITION_DURATION = 500;

function MeditationPage({ onComplete }: MeditationPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [bgRotation, setBgRotation] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cycleText = () => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % MEDITATION_TEXTS.length;
          if (next === 0) {
            setTimeout(onComplete, TRANSITION_DURATION);
          }
          return next;
        });
        setIsVisible(true);
      }, TRANSITION_DURATION);
    };

    intervalRef.current = setInterval(cycleText, TEXT_DISPLAY_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onComplete]);

  useEffect(() => {
    const rotateBg = () => {
      setBgRotation(prev => prev + 1);
    };

    bgIntervalRef.current = setInterval(rotateBg, 100);

    return () => {
      if (bgIntervalRef.current) {
        clearInterval(bgIntervalRef.current);
      }
    };
  }, []);

  const currentText = MEDITATION_TEXTS[currentIndex];

  return (
    <div 
      className="comic-page active" 
      id="page-4" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* 冥想背景 */}
      <div 
        className="meditation-bg"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '150vmax',
          height: '150vmax',
          background: 'repeating-conic-gradient(from 0deg, transparent 0deg, transparent 10deg, rgba(0,0,0,0.02) 10deg, rgba(0,0,0,0.02) 12deg)',
          transform: `translate(-50%, -50%) rotate(${bgRotation}deg)`,
          zIndex: -1,
          pointerEvents: 'none',
          transition: 'transform 0.1s linear'
        }}
      />

      {/* 主内容区域 - 垂直水平居中 */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: 'clamp(16px, 4vh, 32px)',
          boxSizing: 'border-box'
        }}
      >
        {/* 顶部留白 - 占 10% 高度 */}
        <div style={{ height: '10vh', minHeight: '40px' }} />

        {/* 冥想图标区域 - 占 25% 高度 */}
        <div style={{
          height: '25vh',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: 'clamp(3rem, 10vh, 6rem)',
            animation: 'float 3s ease-in-out infinite',
            lineHeight: 1
          }}>
            🧘
          </div>
        </div>

        {/* 文字内容区域 - 占 40% 高度，视觉核心 */}
        <div 
          style={{
            height: '40vh',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '420px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.9)',
            transition: `opacity ${TRANSITION_DURATION}ms ease-out, transform ${TRANSITION_DURATION}ms ease-out`
          }}
        >
          <div 
            className="speech-bubble"
            style={{
              fontSize: 'clamp(1.1rem, 4vh, 1.6rem)',
              fontWeight: 900,
              width: '100%',
              maxWidth: '380px',
              background: '#ffff00',
              padding: 'clamp(16px, 4vh, 24px)',
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}
          >
            {currentText.text}
          </div>
          
          <div style={{
            fontSize: 'clamp(0.95rem, 3vh, 1.2rem)',
            color: '#666',
            fontWeight: 700,
            marginTop: 'clamp(12px, 3vh, 20px)',
            textAlign: 'center',
            padding: '0 8px'
          }}>
            {currentText.subtext}
          </div>
        </div>

        {/* 进度点区域 - 占 15% 高度 */}
        <div style={{
          height: '15vh',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: 'clamp(10px, 2vw, 16px)'
          }}>
            {MEDITATION_TEXTS.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 'clamp(10px, 1.5vh, 14px)',
                  height: 'clamp(10px, 1.5vh, 14px)',
                  borderRadius: '50%',
                  background: index === currentIndex ? '#ff0000' : '#ccc',
                  border: '2px solid black',
                  transition: 'all 0.3s',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        </div>

        {/* 底部留白 - 占 10% 高度 */}
        <div style={{ height: '10vh', minHeight: '40px' }} />
      </div>

      {/* 浮动动画 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}

export default MeditationPage;
