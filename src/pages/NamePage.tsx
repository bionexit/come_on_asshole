import { useState, useRef, useCallback } from 'react';
import { createSoundEffect } from '../utils/animations';
import { maskName } from '../utils/nameMasker';

interface NamePageProps {
  companyName: string;
  onComplete: (realName: string, maskedName: string) => void;
}

function NamePage({ companyName, onComplete }: NamePageProps) {
  const [realName, setRealName] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [error, setError] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMaskedName = useCallback((name: string) => {
    const masked = maskName(name, companyName);
    setMaskedName(masked);
  }, [companyName]);

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const value = e.currentTarget.value;
    const chineseOnly = value.replace(/[^\u4e00-\u9fa5]/g, '').slice(0, 4);
    setRealName(chineseOnly);
    setError('');
    updateMaskedName(chineseOnly);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (isComposing) {
      setRealName(value);
      return;
    }
    
    const chineseOnly = value.replace(/[^\u4e00-\u9fa5]/g, '');
    
    if (chineseOnly.length <= 4) {
      setRealName(chineseOnly);
      setError('');
      updateMaskedName(chineseOnly);
    }
  };

  const handleConfirm = () => {
    if (!realName.trim()) {
      setError('请输入姓名');
      return;
    }
    if (realName.length < 2) {
      setError('姓名至少需要2个字');
      return;
    }

    if (inputRef.current) {
      createSoundEffect(inputRef.current, 'GO!');
    }
    
    setTimeout(() => {
      onComplete(realName, maskedName);
    }, 300);
  };

  return (
    <div 
      className="comic-page active" 
      id="page-6"
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
      {/* 标题区域 - 占 15% 高度 */}
      <div style={{
        height: '15vh',
        minHeight: '70px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 
          className="comic-title comic-title-zh" 
          style={{ 
            fontSize: 'clamp(1.3rem, 5vh, 1.9rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          揭露真相
          <br />
          时刻
        </h2>
      </div>

      {/* 输入区域 - 占 40% 高度 */}
      {!maskedName && (
          <div 
            className="speech-bubble" 
            style={{ 
              fontSize: 'clamp(0.8rem, 2.8vh, 0.95rem)',
              marginTop: 'clamp(12px, 3vh, 20px)',
              textAlign: 'center',
              padding: 'clamp(10px, 2.5vh, 14px)'
            }}
          >
            放心，法制社会救了TA！
            <br />
            真实姓名只会用来生成脱敏版本~ 😏
          </div>
        )}
      <div 
        className="comic-panel tilt-left"
        style={{ 
          height: '40vh',
          minHeight: '220px',
          flexShrink: 0,
          margin: '0 clamp(16px, 4vw, 24px)',
          padding: 'clamp(16px, 4vh, 28px)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div className="comic-input-group" style={{ marginBottom: 'auto' }}>
          <label 
            className="comic-label"
            style={{ 
              fontSize: 'clamp(0.9rem, 3vh, 1.1rem)',
              marginBottom: 'clamp(10px, 2.5vh, 16px)',
              display: 'block'
            }}
          >
            翔王的真实姓名（2-4字）
          </label>
          <input
            ref={inputRef}
            type="text"
            className="comic-input"
            placeholder="输入姓名..."
            value={realName}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            style={{
              fontSize: 'clamp(1rem, 3.5vh, 1.2rem)',
              padding: 'clamp(12px, 3vh, 16px)'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: 'var(--accent-red)', 
            fontWeight: 700, 
            marginTop: 'auto',
            fontSize: 'clamp(0.85rem, 2.8vh, 1rem)',
            padding: 'clamp(8px, 2vh, 12px) 0'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ 
          marginTop: 'auto',
          fontSize: 'clamp(0.8rem, 2.5vh, 0.95rem)',
          color: '#666',
          fontStyle: 'italic',
          paddingTop: 'clamp(8px, 2vh, 12px)'
        }}>
          💡 承诺不会记录任何隐私敏感数据
        </div>
      </div>

      {/* 掩码显示区域 - 占 20% 高度 */}
      {maskedName && (
        <div 
          className="masked-display" 
          style={{
            height: '20vh',
            minHeight: '100px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--accent-yellow)',
            border: '4px solid black',
            margin: 'clamp(10px, 2.5vh, 16px) clamp(16px, 4vw, 24px)',
            boxShadow: '6px 6px 0 black',
            transform: 'rotate(-1deg)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            fontSize: 'clamp(0.85rem, 2.8vh, 1rem)',
            fontWeight: 700,
            marginBottom: 'clamp(6px, 1.5vh, 10px)',
            color: '#666'
          }}>
            脱敏后显示为：
          </div>
          <div style={{
            fontSize: 'clamp(1.6rem, 6vh, 2.4rem)',
            fontWeight: 900,
            color: 'var(--accent-red)',
            textShadow: '3px 3px 0 black'
          }}>
            {maskedName}
          </div>
        </div>
      )}

      {/* 底部按钮区域 - 占 25% 高度（无掩码时）或 5% 高度（有掩码时） */}
      <div style={{
        height: maskedName ? '5vh' : '25vh',
        minHeight: maskedName ? '40px' : '120px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 clamp(16px, 4vw, 24px)',
        boxSizing: 'border-box',
        marginTop: 'auto'
      }}>
        
        <button
          className="comic-btn"
          onClick={handleConfirm}
          disabled={!realName || realName.length < 2}
          style={{
            padding: 'clamp(14px, 4vh, 20px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)'
          }}
        >
          确认，继续 →
        </button>

        
      </div>
    </div>
  );
}

export default NamePage;
