import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DisclaimerPage from './pages/DisclaimerPage';
import HomePage from './pages/HomePage';
import RankingPage from './pages/RankingPage';
import MeditationPage from './pages/MeditationPage';
import VotePage from './pages/VotePage';
import NamePage from './pages/NamePage';
import ShitPage from './pages/ShitPage';
import SharePage from './pages/SharePage';
import { VoteDetails } from './types';
import { submitVote } from './api/client';

// 全局状态类型
interface AppState {
  agreed: boolean;
  companyName: string;
  companyId: number;
  voteDetails: VoteDetails;
  realName: string;
  maskedName: string;
  shits: number;
}

// 初始状态
const initialState: AppState = {
  agreed: false,
  companyName: '',
  companyId: 0,
  voteDetails: {},
  realName: '',
  maskedName: '',
  shits: 0,
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 页面映射
  const pageRoutes = [
    '/disclaimer',  // Page 1
    '/home',        // Page 2
    '/ranking',     // Page 3
    '/meditation',  // Page 4
    '/vote',        // Page 5
    '/name',        // Page 6
    '/shit',        // Page 7
    '/share',       // Page 8
  ];

  // 根据路由设置当前页码
  useEffect(() => {
    const index = pageRoutes.indexOf(location.pathname);
    if (index !== -1) {
      setCurrentPage(index + 1);
    }
  }, [location.pathname]);

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 导航函数
  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= pageRoutes.length) {
      navigate(pageRoutes[pageNum - 1]);
    }
  }, [navigate]);

  // 更新状态
  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 保存投票数据到数据库
  const saveVoteToDatabase = useCallback(async (): Promise<boolean> => {
    if (!state.companyName || !state.maskedName) {
      console.error('Missing required data');
      return false;
    }
    
    try {
      const result = await submitVote({
        companyName: state.companyName,
        maskedName: state.maskedName,
        voteDetails: state.voteDetails,
        shits: state.shits,
      });
      
      if (result.success) {
        console.log('Vote saved successfully:', result.voteId);
        // 更新companyId（从提交结果中获取）
        if (result.voteId) {
          // 投票成功后，我们需要获取公司ID
          // 这里通过查询公司名获取ID
          try {
            const response = await fetch(`/api/ranking`);
            if (response.ok) {
              const allSummaries = await response.json();
              const found = allSummaries.find(
                (s: any) => s.company_name === state.companyName && s.name_mask === state.maskedName
              );
              if (found) {
                updateState({ companyId: found.company_id });
              }
            }
          } catch (e) {
            console.error('Failed to get companyId:', e);
          }
        }
        return true;
      } else {
        console.error('Failed to save vote:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving vote:', error);
      return false;
    }
  }, [state.companyName, state.maskedName, state.voteDetails, state.shits]);

  // 页面指示器组件
  const PageIndicator = () => (
    <div className="page-indicator" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      
      <a 
        href="https://github.com/bionexit/come_on_asshole" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'inherit',
          textDecoration: 'none'
        }}
        title="请为家谱排位添砖加瓦"
        onClick={(e) => e.stopPropagation()}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ verticalAlign: 'middle', pointerEvents: 'none' }}
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  );

  return (
    <>
      {/* 背景 */}
      <div className="comic-bg"></div>
      <div className="speed-lines"></div>

      {/* 加载器 */}
      <div className={`loader ${!isLoading ? 'hidden' : ''}`}>
        LOADING...
      </div>

      {/* 主容器 */}
      <div className="app-container">
        <PageIndicator />
        
        <div className="pages-wrapper">
          <Routes>
            <Route 
              path="/disclaimer" 
              element={
                <DisclaimerPage 
                  onAgree={() => {
                    updateState({ agreed: true });
                    goToPage(2);
                  }}
                />
              } 
            />
            <Route 
              path="/home" 
              element={
                <HomePage 
                  onNext={(companyName) => {
                    updateState({ companyName });
                  }}
                  onGoToRanking={() => {
                    // 从首页查看排行榜，清空公司筛选，查询全量排行
                    updateState({ companyId: 0 });
                    goToPage(3);
                  }}
                  onGoToMeditation={() => goToPage(4)}
                />
              } 
            />
            <Route 
              path="/ranking" 
              element={
                <RankingPage 
                  companyName={state.companyName}
                  companyId={state.companyId || undefined}
                  onBack={() => {
                    // 返回首页时清空公司相关状态
                    updateState({ companyName: '', companyId: 0 });
                    goToPage(2);
                  }}
                />
              } 
            />
            <Route 
              path="/meditation" 
              element={
                <MeditationPage 
                  onComplete={() => goToPage(5)}
                />
              } 
            />
            <Route 
              path="/vote" 
              element={
                <VotePage 
                  onComplete={(voteDetails) => {
                    updateState({ voteDetails });
                    goToPage(6);
                  }}
                />
              } 
            />
            <Route 
              path="/name" 
              element={
                <NamePage 
                  onComplete={(realName, maskedName) => {
                    updateState({ realName, maskedName });
                    goToPage(7);
                  }}
                />
              } 
            />
            <Route 
              path="/shit" 
              element={
                <ShitPage 
                  maskedName={state.maskedName}
                  onComplete={(shits) => {
                    updateState({ shits });
                    goToPage(8);
                  }}
                />
              } 
            />
            <Route 
              path="/share" 
              element={
                <SharePage 
                  companyName={state.companyName}
                  maskedName={state.maskedName}
                  shits={state.shits}
                  onSaveData={saveVoteToDatabase}
                  onGoToRanking={() => goToPage(3)}
                />
              } 
            />
            <Route 
              path="/" 
              element={<DisclaimerPage onAgree={() => goToPage(2)} />} 
            />
          </Routes>
        </div>

      </div>
    </>
  );
}

export default App;
