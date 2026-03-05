// API 客户端

const API_BASE = '/api'

export interface SubmitVoteData {
  companyName: string
  maskedName: string
  voteDetails: Record<string, boolean>
  shits: number
}

export interface SubmitVoteResponse {
  success: boolean
  voteId?: number
  voteScore?: number
  message?: string
  error?: string
}

export interface VoteDetail {
  vote_id: number
  name_mask: string
  company_id: number
  vote_details: string
  shits: number
  score: number
  created_at: string
}

export interface SummaryDetail {
  summary_id: number
  company_id: number
  company_name: string
  name_mask: string
  vote_id_count: number
  shits_count: number
  vote_details?: string
  max_score: number
}

/**
 * 提交投票数据到后端
 */
export async function submitVote(data: SubmitVoteData): Promise<SubmitVoteResponse> {
  const response = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || '提交失败')
  }
  
  return result
}

/**
 * 获取排行榜数据（全部）
 */
export async function getRanking(): Promise<SummaryDetail[]> {
  const response = await fetch(`${API_BASE}/ranking`)
  
  if (!response.ok) {
    throw new Error('获取排行榜失败')
  }
  
  return response.json()
}

/**
 * 获取指定公司的排行榜数据
 */
export async function getRankingByCompany(companyId: number): Promise<SummaryDetail[]> {
  const response = await fetch(`${API_BASE}/ranking/company?companyId=${companyId}`)
  
  if (!response.ok) {
    throw new Error('获取公司排行榜失败')
  }
  
  return response.json()
}

/**
 * 获取指定公司和姓名的最后一条投票明细
 */
export async function getLatestVote(companyId: number, nameMask: string): Promise<VoteDetail> {
  const response = await fetch(`${API_BASE}/vote/latest?companyId=${companyId}&nameMask=${encodeURIComponent(nameMask)}`)
  
  if (!response.ok) {
    throw new Error('获取投票明细失败')
  }
  
  return response.json()
}

/**
 * 获取指定公司和姓名的汇总信息
 */
export async function getSummary(companyId: number, nameMask: string): Promise<SummaryDetail> {
  const response = await fetch(`${API_BASE}/summary?companyId=${companyId}&nameMask=${encodeURIComponent(nameMask)}`)
  
  if (!response.ok) {
    throw new Error('获取汇总信息失败')
  }
  
  return response.json()
}
