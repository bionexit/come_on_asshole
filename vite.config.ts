import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { company, vote, summary } from './src/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { ASSHOLE_TYPES } from './src/types' // 导入ASSHOLE_TYPES用于计算分数

const DB_PATH = process.env.VITE_TURSO_DATABASE_URL || 'file:local.db'

// 创建数据库连接（服务端使用）
function createDB() {
  const client = createClient({
    url: DB_PATH,
  })
  return drizzle(client, { schema: { company, vote, summary } })
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use('/api', async (req, res, next) => {
          const url = new URL(req.url || '/', `http://${req.headers.host}`)
          const pathname = url.pathname.replace('/api', '') || '/'
          
          // 设置响应头
          res.setHeader('Content-Type', 'application/json')
          
          try {
            // GET /api/ranking - 获取排行榜
            if (pathname === '/ranking' && req.method === 'GET') {
              const db = createDB()
              const result = await db.select().from(summary).orderBy(summary.shits_count)
              res.statusCode = 200
              res.end(JSON.stringify(result))
              return
            }
            
            // POST /api/submit - 提交投票
            if (pathname === '/submit' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk: Buffer) => { body += chunk })
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body)
                  const { companyName, maskedName, voteDetails, shits } = data
                  
                  if (!companyName || !maskedName || !voteDetails || shits === undefined) {
                    res.statusCode = 400
                    res.end(JSON.stringify({ error: 'Missing required fields' }))
                    return
                  }
                  
                  const db = createDB()
                  
                  // 1. 获取或创建公司
                  let existingCompany = await db.select().from(company).where(eq(company.company_name, companyName)).get()
                  
                  let companyId: number
                  if (!existingCompany) {
                    const result = await db.insert(company).values({ company_name: companyName }).returning()
                    companyId = result[0].company_id
                  } else {
                    companyId = existingCompany.company_id
                  }
                  
                  // 计算投票总分
                  let voteScore = 0
                  for (const type of ASSHOLE_TYPES) {
                    if (voteDetails[type.type_cn]) {
                      voteScore += type.score
                    }
                  }
                  
                  // 2. 创建投票记录（包含分数）
                  const voteResult = await db.insert(vote).values({
                    name_mask: maskedName,
                    company_id: companyId,
                    vote_details: JSON.stringify(voteDetails),
                    shits: shits,
                    score: voteScore,
                  }).returning()
                  
                  const voteId = voteResult[0].vote_id
                  
                  // 3. 更新或创建汇总记录（合并所有 vote details，保存最高分）
                  const existingSummary = await db.select().from(summary).where(
                    and(eq(summary.company_id, companyId), eq(summary.name_mask, maskedName))
                  ).get()
                  
                  if (existingSummary) {
                    // 合并 vote_details - 将新的 details 与现有的合并
                    const existingDetails = existingSummary.vote_details ? JSON.parse(existingSummary.vote_details) : {}
                    const mergedDetails = { ...existingDetails, ...voteDetails }
                    
                    // 取最高分
                    const newMaxScore = Math.max(existingSummary.max_score || 0, voteScore)
                    
                    await db.update(summary).set({
                      vote_id_count: existingSummary.vote_id_count + 1,
                      shits_count: existingSummary.shits_count + shits,
                      vote_details: JSON.stringify(mergedDetails),
                      max_score: newMaxScore,
                    }).where(eq(summary.summary_id, existingSummary.summary_id))
                  } else {
                    await db.insert(summary).values({
                      company_id: companyId,
                      company_name: companyName,
                      name_mask: maskedName,
                      vote_id_count: 1,
                      shits_count: shits,
                      vote_details: JSON.stringify(voteDetails),
                      max_score: voteScore,
                    })
                  }
                  
                  res.statusCode = 200
                  res.end(JSON.stringify({ 
                    success: true, 
                    voteId,
                    voteScore,
                    message: '投票提交成功' 
                  }))
                } catch (error: any) {
                  console.error('API Error:', error)
                  res.statusCode = 500
                  res.end(JSON.stringify({ error: error.message }))
                }
              })
              return
            }
            
            // GET /api/vote/latest - 获取指定公司和姓名的最后一条投票明细
            if (pathname === '/vote/latest' && req.method === 'GET') {
              const companyId = url.searchParams.get('companyId')
              const nameMask = url.searchParams.get('nameMask')
              
              if (!companyId || !nameMask) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing companyId or nameMask' }))
                return
              }
              
              try {
                const db = createDB()
                const result = await db.select().from(vote)
                  .where(and(
                    eq(vote.company_id, parseInt(companyId)),
                    eq(vote.name_mask, nameMask)
                  ))
                  .orderBy(vote.vote_id)
                  .limit(1)
                  .get()
                
                if (result) {
                  res.statusCode = 200
                  res.end(JSON.stringify(result))
                } else {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'No vote found' }))
                }
                return
              } catch (error: any) {
                console.error('API Error:', error)
                res.statusCode = 500
                res.end(JSON.stringify({ error: error.message }))
                return
              }
            }
            
            // GET /api/summary - 获取指定公司和姓名的汇总信息
            if (pathname === '/summary' && req.method === 'GET') {
              const companyId = url.searchParams.get('companyId')
              const nameMask = url.searchParams.get('nameMask')
              
              if (!companyId || !nameMask) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing companyId or nameMask' }))
                return
              }
              
              try {
                const db = createDB()
                const result = await db.select().from(summary)
                  .where(and(
                    eq(summary.company_id, parseInt(companyId)),
                    eq(summary.name_mask, nameMask)
                  ))
                  .get()
                
                if (result) {
                  res.statusCode = 200
                  res.end(JSON.stringify(result))
                } else {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'No summary found' }))
                }
                return
              } catch (error: any) {
                console.error('API Error:', error)
                res.statusCode = 500
                res.end(JSON.stringify({ error: error.message }))
                return
              }
            }
            
            // GET /api/ranking/company - 获取指定公司的排行榜
            if (pathname === '/ranking/company' && req.method === 'GET') {
              const companyId = url.searchParams.get('companyId')
              
              if (!companyId) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing companyId' }))
                return
              }
              
              try {
                const db = createDB()
                const result = await db.select().from(summary)
                  .where(eq(summary.company_id, parseInt(companyId)))
                  .orderBy(summary.shits_count)
                
                res.statusCode = 200
                res.end(JSON.stringify(result))
                return
              } catch (error: any) {
                console.error('API Error:', error)
                res.statusCode = 500
                res.end(JSON.stringify({ error: error.message }))
                return
              }
            }
            
            // 404
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Not found' }))
            
          } catch (error: any) {
            console.error('API Error:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
