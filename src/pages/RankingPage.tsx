import { useState, useEffect } from 'react';
import { createSoundEffect } from '../utils/animations';
import { getRanking, getRankingByCompany, type SummaryDetail } from '../api/client';
import { getSummaryRating } from '../types';

const TITLES = ['👑 翔王', '🏆 翔圣', '🥉 翔尊'];

interface RankingPageProps {
  companyName?: string;
  companyId?: number;
  onBack: () => void;
}

function RankingPage({ companyName, companyId, onBack }: RankingPageProps) {
  const [rankings, setRankings] = useState<SummaryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<SummaryDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadRankings();
  }, [companyId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      // 如果有companyId，则获取该公司下的排名；否则获取全部
      const data = companyId 
        ? await getRankingByCompany(companyId)
        : await getRanking();
      // 按 shits_count 降序排序
      const sorted = data.sort((a, b) => b.shits_count - a.shits_count);
      setRankings(sorted);
      setError('');
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setError('加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: SummaryDetail) => {
    createSoundEffect(document.body, `查看详情!`);
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    createSoundEffect(e.currentTarget, 'BACK!');
    setTimeout(onBack, 200);
  };

  // 解析投票详情
  const parseVoteDetails = (details?: string): Record<string, boolean> => {
    if (!details) return {};
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  };

  // 获取勾选了的类型列表
  const getCheckedTypes = (details: Record<string, boolean>): string[] => {
    return Object.entries(details)
      .filter(([_, checked]) => checked)
      .map(([type]) => type);
  };

  // 合并真实数据和模拟数据（当真实数据不足时）
  const displayRankings: SummaryDetail[] = rankings.length > 0 
    ? rankings 
    : [
        { summary_id: 1, company_id: 1, company_name: '暂无数据', name_mask: '暂无数据', vote_id_count: 0, shits_count: 0, max_score: 0 },
      ];

  // 获取选中项的投票详情
  const selectedDetails = selectedItem ? parseVoteDetails(selectedItem.vote_details) : {};
  const selectedCheckedTypes = getCheckedTypes(selectedDetails);
  
  // 获取选中项的评价
  const selectedRating = selectedItem ? getSummaryRating(selectedItem.max_score) : null;

  return (
    <div 
      className="comic-page active" 
      id="page-3"
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
        minHeight: '70px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        padding: 'clamp(8px, 1.5vh, 16px) clamp(16px, 4vw, 24px)',
        boxSizing: 'border-box'
      }}>
        <h2 
          className="comic-title comic-title-zh" 
          style={{ 
            fontSize: 'clamp(1.2rem, 4vh, 1.8rem)',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.3
          }}
        >
          {companyName || '全站'}
          <br />
          排行榜
        </h2>
      </div>
      <div 
          className="speech-bubble" 
          style={{ 
            fontSize: 'clamp(0.75rem, 3.5vh, 0.9rem)',
            textAlign: 'center',
            padding: 'clamp(20px, 2.5vh, 14px)',
            maxWidth: '280px'
          }}
        >
          人言可爱<br /> 点点看🫵
          
        </div>    
      {/* 列表区域 - 占 55% 高度，可滚动 */}
      <div 
        style={{ 
          height: '55vh',
          minHeight: '280px',
          flexShrink: 0,
          overflowY: 'auto',
          margin: 'clamp(8px, 2vh, 16px) clamp(16px, 4vw, 24px)',
          padding: '0 clamp(8px, 2vw, 16px)',
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
          scrollbarColor: '#999 #f0f0f0'
        }}
      >
        <style>{`
          #page-3::-webkit-scrollbar {
            width: 6px;
          }
          #page-3::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 3px;
          }
          #page-3::-webkit-scrollbar-thumb {
            background: #999;
            border-radius: 3px;
          }
          #page-3::-webkit-scrollbar-thumb:hover {
            background: #666;
          }
        `}</style>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', fontSize: 'clamp(1rem, 3vh, 1.2rem)' }}>
            加载中...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--accent-red)' }}>
            {error}
          </div>
        ) : (
          displayRankings.slice(0, 20).map((item, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const title = isTop3 ? TITLES[index] : '';

            return (
              <div 
                key={item.summary_id}
                className={`ranking-item rank-${rank}`}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: 'clamp(10px, 2.5vh, 14px)',
                  margin: 'clamp(6px, 1.5vh, 10px) 0',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div 
                  className="rank-number"
                  style={{ 
                    fontSize: 'clamp(1.2rem, 3.5vh, 1.6rem)',
                    width: 'clamp(32px, 8vw, 40px)',
                    height: 'clamp(32px, 8vw, 40px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {rank}
                </div>
                <div style={{ 
                  flex: 1, 
                  padding: '0 clamp(8px, 2vw, 12px)',
                  minWidth: 0
                }}>
                  <div style={{ 
                    fontWeight: 900, 
                    fontSize: 'clamp(0.95rem, 2.8vh, 1.1rem)',
                    whiteSpace: 'nowrap',
                    // overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name_mask}&nbsp;&nbsp;{item.company_name}
                  </div>
                  {isTop3 && (
                    <div 
                      className="rank-title"
                      style={{ 
                        fontSize: 'clamp(1.35rem, 2vh, 1.9rem)',
                        marginTop: '2px'
                      }}
                    >
                      {title}
                    </div>
                  )}
                </div>
                <div style={{ 
                  textAlign: 'right',
                  flexShrink: 0,
                  width: '40%'
                }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: '#666', 
                    fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)' 
                  }}>
                    {item.vote_id_count}票
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(0.7rem, 2vh, 0.8rem)', 
                    color: '#999',
                    marginTop: '2px'
                  }}>
                    💩 {item.shits_count}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetail && selectedItem && (
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
          onClick={handleCloseDetail}
        >
          <div 
            style={{
              background: 'white',
              border: '4px solid black',
              boxShadow: '8px 8px 0 black',
              padding: 'clamp(16px, 4vh, 24px)',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                {selectedItem.name_mask}
              </div>
              <div style={{ 
                fontSize: 'clamp(0.8rem, 2.2vh, 0.95rem)', 
                color: '#666',
                marginTop: '4px'
              }}>
                {selectedItem.company_name}
              </div>
              <div style={{ 
                fontSize: 'clamp(0.8rem, 2.2vh, 0.95rem)', 
                color: '#666',
                marginTop: '4px'
              }}>
                💩 累计投喂 {selectedItem.shits_count} 个粑粑 · {selectedItem.vote_id_count} 次投票
              </div>
              
              {/* 等级称号和评级 */}
              {selectedRating && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: 'var(--accent-yellow)',
                  border: '3px solid black',
                  transform: 'rotate(-1deg)'
                }}>
                  <div style={{
                    fontSize: 'clamp(1rem, 3vh, 1.2rem)',
                    fontWeight: 900,
                    marginBottom: '4px'
                  }}>
                    {selectedRating.level_cn}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)',
                    color: '#666',
                    fontStyle: 'italic',
                    marginBottom: '6px'
                  }}>
                    {selectedRating.level_en}
                  </div>
                  <div style={{
                    background: 'black',
                    color: 'white',
                    display: 'inline-block',
                    padding: '3px 10px',
                    fontWeight: 900,
                    fontSize: 'clamp(0.8rem, 2.5vh, 1rem)'
                  }}>
                    {selectedRating.rating_cn} · {selectedItem.max_score}分
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontWeight: 900, 
                fontSize: 'clamp(1rem, 3vh, 1.2rem)',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                🎯 被标记的特质
              </div>
              {selectedCheckedTypes.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedCheckedTypes.map((type, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'var(--accent-yellow)',
                        border: '2px solid black',
                        padding: '4px 8px',
                        fontSize: 'clamp(0.75rem, 2.2vh, 0.9rem)',
                        fontWeight: 700
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  暂无标记的特质
                </div>
              )}
            </div>

            <button
              className="comic-btn"
              onClick={handleCloseDetail}
              style={{ 
                width: '100%',
                padding: 'clamp(10px, 2.5vh, 14px)'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 底部区域 - 占 25% 高度 */}
      <div style={{
        height: '25vh',
        minHeight: '120px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vh, 32px)',
        boxSizing: 'border-box',
        gap: 'clamp(8px, 2vh, 16px)'
      }}>
        
        <button
          className="comic-btn"
          onClick={handleBack}
          style={{ 
            width: '100%',
            maxWidth: '320px',
            fontSize: 'clamp(0.95rem, 3vh, 1.1rem)',
            padding: 'clamp(12px, 3vh, 16px)'
          }}
        >
          ← 返回首页
        </button>
      </div>
    </div>
  );
}

export default RankingPage;
