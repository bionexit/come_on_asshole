import { useState, useRef, useCallback } from 'react';
import { createSoundEffect } from '../utils/animations';
import { ASSHOLE_TYPES } from '../types';
import type { VoteDetails } from '../types';

interface VotePageProps {
  onComplete: (voteDetails: VoteDetails) => void;
}

function VotePage({ onComplete }: VotePageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voteDetails, setVoteDetails] = useState<VoteDetails>({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [cardStyle, setCardStyle] = useState({
    transform: 'translateX(0) rotate(0deg)',
    opacity: 1,
    transition: 'none'
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const currentType = ASSHOLE_TYPES[currentIndex];
  const isLastCard = currentIndex >= ASSHOLE_TYPES.length - 1;

  const isVotingRef = useRef(false);

  const handleVote = useCallback((type: string, isYes: boolean) => {
    // 防止重复投票
    if (isVotingRef.current) return;
    isVotingRef.current = true;
    
    const newVoteDetails = { ...voteDetails, [type]: isYes };
    setVoteDetails(newVoteDetails);

    const xMove = isYes ? window.innerWidth : -window.innerWidth;
    const rotation = isYes ? 30 : -30;

    setCardStyle({
      transform: `translateX(${xMove}px) rotate(${rotation}deg)`,
      opacity: 0,
      transition: 'transform 0.4s ease-in, opacity 0.4s ease-in'
    });

    setTimeout(() => {
      if (isLastCard) {
        onComplete(newVoteDetails);
      } else {
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          // 如果超出范围，保持在最后一个有效索引
          return nextIndex >= ASSHOLE_TYPES.length ? prev : nextIndex;
        });
        setSwipeDirection(null);
        setCardStyle({
          transform: 'translateX(0) rotate(0deg)',
          opacity: 1,
          transition: 'none'
        });
        isVotingRef.current = false;
      }
    }, 400);
  }, [isLastCard, onComplete, voteDetails]);

  const handleStart = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    currentXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDraggingRef.current) return;

    currentXRef.current = clientX;
    const deltaX = currentXRef.current - startXRef.current;
    const rotation = deltaX * 0.05;

    setCardStyle({
      transform: `translateX(${deltaX}px) rotate(${rotation}deg)`,
      opacity: 1,
      transition: 'transform 0.1s ease-out'
    });

    if (deltaX > 50) {
      setSwipeDirection('right');
    } else if (deltaX < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaX = currentXRef.current - startXRef.current;

    if (deltaX > 100) {
      handleVote(currentType.type_cn, true);
      if (cardRef.current) {
        createSoundEffect(cardRef.current, 'YES!');
      }
    } else if (deltaX < -100) {
      handleVote(currentType.type_cn, false);
      if (cardRef.current) {
        createSoundEffect(cardRef.current, 'NO!');
      }
    } else {
      setCardStyle({
        transform: 'translateX(0) rotate(0deg)',
        opacity: 1,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      });
      setSwipeDirection(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleEnd();
    }
  };

  const handleButtonVote = (isYes: boolean) => {
    handleVote(currentType.type_cn, isYes);
  };

  const progress = ((currentIndex) / ASSHOLE_TYPES.length) * 100;

  return (
    <div 
      className="comic-page active" 
      id="page-5"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
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
            fontSize: 'clamp(1.2rem, 4vh, 1.6rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          职场翔王
          <br />
          鉴定中
        </h2>
      </div>

      {/* 进度条区域 - 占 10% 高度 */}
      <div 
        className="comic-panel" 
        style={{ 
          height: '10vh',
          minHeight: '70px',
          flexShrink: 0,
          margin: '0 clamp(16px, 4vw, 24px)',
          padding: 'clamp(12px, 2.5vh, 16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          height: 'clamp(18px, 4vh, 24px)',
          background: '#eee',
          border: '3px solid black',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ffff00, #ff0000)',
            transition: 'width 0.3s'
          }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(0.75rem, 2.5vh, 0.9rem)',
            fontWeight: 900
          }}>
            {currentIndex + 1} / {ASSHOLE_TYPES.length}
          </span>
        </div>
      </div>

      {/* 提示文字 - 占 6% 高度 */}
      <div style={{
        height: '6vh',
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 'clamp(0.8rem, 2.5vh, 1rem)',
          color: '#666'
        }}>
          👈 左滑否定 | 右滑确定 👉
        </div>
      </div>

      {/* 投票卡片区域 - 占 48% 高度，核心区域 */}
      <div
        ref={cardRef}
        className={`vote-card ${swipeDirection === 'left' ? 'swiping-left' : ''} ${swipeDirection === 'right' ? 'swiping-right' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ 
          height: '48vh',
          minHeight: '280px',
          flexShrink: 0,
          margin: '0 clamp(16px, 4vw, 24px)',
          cursor: 'grab',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(16px, 4vh, 28px)',
          boxSizing: 'border-box',
          position: 'relative',
          ...cardStyle
        }}
      >
        {currentType ? (
          <>
            {/* 滑动指示器 */}
            <div className="swipe-indicator left" style={{ 
              opacity: swipeDirection === 'left' ? 1 : 0,
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 'clamp(1rem, 3vh, 1.2rem)',
              fontWeight: 900,
              color: 'var(--accent-red)',
              transition: 'opacity 0.2s'
            }}>
              ❌ 否
            </div>
            <div className="swipe-indicator right" style={{ 
              opacity: swipeDirection === 'right' ? 1 : 0,
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 'clamp(1rem, 3vh, 1.2rem)',
              fontWeight: 900,
              color: 'green',
              transition: 'opacity 0.2s'
            }}>
              ✅ 是
            </div>

            {/* 标题 */}
            <div style={{
              fontSize: 'clamp(1.1rem, 4vh, 1.5rem)',
              fontWeight: 900,
              marginBottom: 'clamp(6px, 1.5vh, 10px)',
              color: 'var(--accent-red)',
              textAlign: 'center',
              textShadow: '2px 2px 0 black'
            }}>
              {currentType.type_cn}
            </div>

            <div style={{
              fontSize: 'clamp(0.7rem, 2.2vh, 0.85rem)',
              color: '#666',
              textAlign: 'center',
              marginBottom: 'clamp(10px, 2.5vh, 16px)',
              fontStyle: 'italic'
            }}>
              {currentType.type_en}
            </div>

            {/* 评级 */}
            <div style={{
              background: 'var(--accent-yellow)',
              padding: 'clamp(6px, 1.8vh, 10px) clamp(12px, 3vh, 18px)',
              border: '3px solid black',
              display: 'inline-block',
              marginBottom: 'clamp(12px, 3vh, 20px)',
              transform: 'rotate(-2deg)',
              fontWeight: 900,
              fontSize: 'clamp(0.85rem, 3vh, 1.1rem)'
            }}>
              危害等级: {currentType.rating_cn}
            </div>

            {/* 描述 */}
            <div style={{
              fontSize: 'clamp(0.85rem, 3vh, 1.05rem)',
              lineHeight: 1.6,
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '320px',
              padding: '0 clamp(8px, 2vw, 16px)'
            }}>
              {currentType.description_cn}
            </div>

            {/* 分数 */}
            <div style={{
              position: 'absolute',
              top: 'clamp(10px, 2.5vh, 16px)',
              right: 'clamp(10px, 2.5vh, 16px)',
              background: 'black',
              color: 'white',
              width: 'clamp(32px, 8vh, 42px)',
              height: 'clamp(32px, 8vh, 42px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 'clamp(0.9rem, 2.8vh, 1.1rem)',
              border: '3px solid var(--accent-red)'
            }}>
              {currentType.score}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 'clamp(1.2rem, 4vh, 1.6rem)', fontWeight: 900 }}>
            投票完成！
          </div>
        )}
      </div>

      {/* 按钮区域 - 占 24% 高度 */}
      <div 
        style={{ 
          height: '24vh',
          minHeight: '120px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(16px, 4vw, 24px)',
          boxSizing: 'border-box',
          gap: 'clamp(10px, 2.5vh, 16px)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(10px, 2.5vw, 16px)'
        }}>
          <button
            className="comic-btn secondary"
            style={{ 
              flex: 1,
              padding: 'clamp(12px, 3.5vh, 18px)',
              fontSize: 'clamp(0.9rem, 3vh, 1.1rem)'
            }}
            onClick={(e) => {
              createSoundEffect(e.currentTarget, 'NO!');
              handleButtonVote(false);
            }}
          >
            ← 不是
          </button>
          <button
            className="comic-btn"
            style={{ 
              flex: 1,
              padding: 'clamp(12px, 3.5vh, 18px)',
              fontSize: 'clamp(0.9rem, 3vh, 1.1rem)'
            }}
            onClick={(e) => {
              createSoundEffect(e.currentTarget, 'YES!');
              handleButtonVote(true);
            }}
          >
            是的 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default VotePage;
