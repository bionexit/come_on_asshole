import { useState, useRef, useEffect, useCallback } from 'react';
import { createSoundEffect } from '../utils/animations';

const MOCK_COMPANIES = [
  '阿里巴巴',
  '腾讯科技',
  '字节跳动',
  '美团点评',
  '京东集团',
  '百度公司',
  '网易科技',
  '小米科技',
  '华为技术',
  '滴滴出行',
  '拼多多',
  '快手科技',
  '哔哩哔哩',
  '新浪微博',
  '知乎',
];

interface HomePageProps {
  onNext: (companyName: string) => void;
  onGoToRanking: () => void;
  onGoToMeditation: () => void;
}

function HomePage({ onNext, onGoToRanking, onGoToMeditation }: HomePageProps) {
  const [companyName, setCompanyName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filterSuggestions = useCallback((input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    
    const filtered = MOCK_COMPANIES.filter(c => 
      c.toLowerCase().includes(input.toLowerCase())
    );
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
    setSelectedIndex(-1);
  }, []);

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const value = e.currentTarget.value.slice(0, 5);
    setCompanyName(value);
    setError('');
    filterSuggestions(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (isComposing) {
      setCompanyName(value);
      return;
    }
    
    if (value.length <= 5) {
      setCompanyName(value);
      setError('');
      filterSuggestions(value);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setCompanyName(suggestion);
    setShowDropdown(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleConfirm();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirm = () => {
    if (!companyName.trim()) {
      setError('请输入公司名称');
      return;
    }
    if (companyName.length < 2) {
      setError('公司名称至少需要2个字');
      return;
    }
    
    onNext(companyName);
    onGoToMeditation();
  };

  return (
    <div 
      className="comic-page active" 
      id="page-2"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* 标题区域 - 占 18% 高度 */}
      <div style={{
        height: '18vh',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 
          className="comic-title comic-title-zh" 
          style={{ 
            fontSize: 'clamp(1.5rem, 6vh, 2.2rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          选择你的
          <br />
          战场
        </h2>
      </div>

      {/* 输入区域 - 占 50% 高度，视觉核心 */}
      <div 
        ref={containerRef} 
        className="comic-panel tilt-right"
        style={{ 
          height: '50vh',
          minHeight: '280px',
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
            公司名称（最多5个字）
          </label>
          <input
            ref={inputRef}
            type="text"
            className="comic-input"
            placeholder="输入公司名称..."
            value={companyName}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: 'clamp(1rem, 3.5vh, 1.2rem)',
              padding: 'clamp(12px, 3vh, 16px)'
            }}
          />
          
          {/* 下拉建议列表 */}
          {showDropdown && (
            <div 
              className="comic-dropdown"
              style={{
                maxHeight: '25vh',
                overflowY: 'auto',
                marginTop: 'clamp(6px, 1.5vh, 10px)'
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`comic-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: 'clamp(10px, 2.5vh, 14px)',
                    fontSize: 'clamp(0.9rem, 3vh, 1.05rem)'
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
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
          💡 输入2个字后显示相似选项
        </div>
      </div>

      {/* 按钮区域 - 占 32% 高度 */}
      <div style={{
        height: '32vh',
        minHeight: '160px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 clamp(16px, 4vw, 24px)',
        boxSizing: 'border-box',
        gap: 'clamp(10px, 2.5vh, 16px)'
      }}>
        <button
          className="comic-btn"
          onClick={(e) => {
            createSoundEffect(e.currentTarget, 'GO!');
            handleConfirm();
          }}
          style={{
            padding: 'clamp(14px, 4vh, 20px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)'
          }}
        >
          确认进入 →
        </button>

        <button
          className="comic-btn secondary"
          onClick={(e) => {
            createSoundEffect(e.currentTarget, 'VIEW!');
            onGoToRanking();
          }}
          style={{
            padding: 'clamp(14px, 4vh, 20px)',
            fontSize: 'clamp(1rem, 3.5vh, 1.2rem)'
          }}
        >
          📊 查看排行榜
        </button>
      </div>
    </div>
  );
}

export default HomePage;
