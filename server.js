import express from 'express';
import { createClient } from '@libsql/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static('dist'));

// 数据库连接
const DB_PATH = process.env.VITE_TURSO_DATABASE_URL || 'file:/app/data/local.db';
const client = createClient({ url: DB_PATH });

// 微信配置
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const SERVER_URL = process.env.SERVER_URL || '';

// 微信 access_token 和 jsapi_ticket 缓存
let wechatCache = {
  accessToken: '',
  accessTokenExpireTime: 0,
  jsapiTicket: '',
  jsapiTicketExpireTime: 0,
};

/**
 * 获取微信 access_token
 */
async function getWeChatAccessToken() {
  const now = Date.now();
  if (wechatCache.accessToken && now < wechatCache.accessTokenExpireTime) {
    return wechatCache.accessToken;
  }

  try {
    console.log('Fetching WeChat access_token...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await response.json();
    console.log('WeChat token response:', { errcode: data.errcode, expires_in: data.expires_in });
    
    if (data.access_token) {
      wechatCache.accessToken = data.access_token;
      // 提前 5 分钟过期
      wechatCache.accessTokenExpireTime = now + (data.expires_in - 300) * 1000;
      console.log('WeChat access_token cached, expires in', data.expires_in, 'seconds');
      return data.access_token;
    }
    throw new Error(data.errmsg || 'Failed to get access_token');
  } catch (error) {
    console.error('Error getting WeChat access_token:', error.message);
    throw error;
  }
}

/**
 * 获取微信 jsapi_ticket
 */
async function getWeChatJsapiTicket() {
  const now = Date.now();
  if (wechatCache.jsapiTicket && now < wechatCache.jsapiTicketExpireTime) {
    return wechatCache.jsapiTicket;
  }

  try {
    console.log('Fetching WeChat jsapi_ticket...');
    const accessToken = await getWeChatAccessToken();
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await response.json();
    console.log('WeChat ticket response:', { errcode: data.errcode, expires_in: data.expires_in });
    
    if (data.ticket) {
      wechatCache.jsapiTicket = data.ticket;
      // 提前 5 分钟过期
      wechatCache.jsapiTicketExpireTime = now + (data.expires_in - 300) * 1000;
      console.log('WeChat jsapi_ticket cached, expires in', data.expires_in, 'seconds');
      return data.ticket;
    }
    throw new Error(data.errmsg || 'Failed to get jsapi_ticket');
  } catch (error) {
    console.error('Error getting WeChat jsapi_ticket:', error.message);
    throw error;
  }
}

/**
 * 生成微信 JS-SDK 签名
 */
async function generateWeChatSignature(url) {
  const jsapiTicket = await getWeChatJsapiTicket();
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = Math.random().toString(36).substring(2, 15);
  
  // 按照微信要求的格式拼接字符串
  const string1 = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = crypto.createHash('sha1').update(string1).digest('hex');
  
  return {
    appId: WECHAT_APP_ID,
    timestamp,
    nonceStr,
    signature,
  };
}

// 初始化数据库
async function initDB() {
  try {
    // 创建表（如果不存在）
    await client.execute(`
      CREATE TABLE IF NOT EXISTS company (
        company_id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL UNIQUE
      )
    `);
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS vote (
        vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_mask TEXT NOT NULL,
        company_id INTEGER NOT NULL,
        vote_details TEXT NOT NULL,
        shits INTEGER DEFAULT 0 NOT NULL,
        score INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS summary (
        summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        name_mask TEXT NOT NULL,
        vote_id_count INTEGER DEFAULT 0 NOT NULL,
        shits_count INTEGER DEFAULT 0 NOT NULL,
        vote_details TEXT,
        max_score INTEGER DEFAULT 0 NOT NULL
      )
    `);
    
    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_company_name ON company(company_name)
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 数据库操作辅助函数
async function getCompanyByName(companyName) {
  const result = await client.execute({
    sql: 'SELECT * FROM company WHERE company_name = ?',
    args: [companyName]
  });
  return result.rows[0];
}

async function createCompany(companyName) {
  const result = await client.execute({
    sql: 'INSERT INTO company (company_name) VALUES (?) RETURNING *',
    args: [companyName]
  });
  return result.rows[0];
}

async function getSummary(companyId, nameMask) {
  const result = await client.execute({
    sql: 'SELECT * FROM summary WHERE company_id = ? AND name_mask = ?',
    args: [companyId, nameMask]
  });
  return result.rows[0];
}

async function createSummary(data) {
  const result = await client.execute({
    sql: `INSERT INTO summary (company_id, company_name, name_mask, vote_id_count, shits_count, vote_details, max_score) 
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [data.company_id, data.company_name, data.name_mask, data.vote_id_count, data.shits_count, data.vote_details, data.max_score]
  });
  return result.rows[0];
}

async function updateSummary(summaryId, data) {
  await client.execute({
    sql: `UPDATE summary SET vote_id_count = ?, shits_count = ?, vote_details = ?, max_score = ? WHERE summary_id = ?`,
    args: [data.vote_id_count, data.shits_count, data.vote_details, data.max_score, summaryId]
  });
}

async function createVote(data) {
  const result = await client.execute({
    sql: `INSERT INTO vote (name_mask, company_id, vote_details, shits, score) 
          VALUES (?, ?, ?, ?, ?) RETURNING *`,
    args: [data.name_mask, data.company_id, data.vote_details, data.shits, data.score]
  });
  return result.rows[0];
}

// API 路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 微信 JS-SDK 签名接口
app.get('/api/wechat-signature', async (req, res) => {
  try {
    // 检查配置
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      console.error('WeChat config not set');
      return res.status(500).json({ 
        error: 'WeChat config not set',
        message: '请在环境变量中配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET'
      });
    }

    let url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // URL 解码
    url = decodeURIComponent(url);
    console.log('Generating signature for URL:', url);
    
    const signature = await generateWeChatSignature(url);
    console.log('Signature generated successfully');
    res.json(signature);
  } catch (error) {
    console.error('Error generating WeChat signature:', error.message);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// 获取排行榜
app.get('/api/ranking', async (req, res) => {
  try {
    const result = await client.execute('SELECT * FROM summary ORDER BY shits_count DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ranking:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取公司排行榜
app.get('/api/ranking/company', async (req, res) => {
  try {
    const companyId = req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId' });
    }
    
    const result = await client.execute({
      sql: 'SELECT * FROM summary WHERE company_id = ? ORDER BY shits_count DESC',
      args: [parseInt(companyId)]
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching company ranking:', error);
    res.status(500).json({ error: error.message });
  }
});

// 提交投票
app.post('/api/submit', async (req, res) => {
  try {
    const { companyName, maskedName, voteDetails, shits } = req.body;
    
    if (!companyName || !maskedName || !voteDetails || shits === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 1. 获取或创建公司
    let companyRow = await getCompanyByName(companyName);
    
    let companyId;
    if (!companyRow) {
      const newCompany = await createCompany(companyName);
      companyId = newCompany.company_id;
    } else {
      companyId = companyRow.company_id;
    }
    
    // 计算投票总分
    let voteScore = 0;
    const ASSHOLE_TYPES = [
      { type_cn: "甩锅侠 —— 责任推卸专家", score: 13 },
      { type_cn: "成果窃贼 —— 知识产权掠夺者", score: 11 },
      { type_cn: "马屁精 —— 权力依附型人格", score: 11 },
      { type_cn: "双面阴阳人 —— 人格分裂者", score: 11 },
      { type_cn: "负能量黑洞 —— 情绪吸血鬼", score: 10 },
      { type_cn: "八卦制造机 —— 职场情报贩子", score: 10 },
      { type_cn: "微观控制狂 —— 不信任传播者", score: 9 },
      { type_cn: "划水摸鱼师 —— 公平感破坏者", score: 9 },
      { type_cn: "会议寄生虫 —— 时间杀手", score: 8 },
      { type_cn: "刺猬防御者 —— 玻璃心巨人", score: 8 }
    ];
    
    for (const type of ASSHOLE_TYPES) {
      if (voteDetails[type.type_cn]) {
        voteScore += type.score;
      }
    }
    
    // 2. 创建投票记录
    const voteResult = await createVote({
      name_mask: maskedName,
      company_id: companyId,
      vote_details: JSON.stringify(voteDetails),
      shits: shits,
      score: voteScore,
    });
    
    const voteId = voteResult.vote_id;
    
    // 3. 更新或创建汇总记录
    const existingSummary = await getSummary(companyId, maskedName);
    
    if (existingSummary) {
      const existingDetails = existingSummary.vote_details ? JSON.parse(existingSummary.vote_details) : {};
      const mergedDetails = { ...existingDetails, ...voteDetails };
      const newMaxScore = Math.max(existingSummary.max_score || 0, voteScore);
      
      await updateSummary(existingSummary.summary_id, {
        vote_id_count: existingSummary.vote_id_count + 1,
        shits_count: existingSummary.shits_count + shits,
        vote_details: JSON.stringify(mergedDetails),
        max_score: newMaxScore,
      });
    } else {
      await createSummary({
        company_id: companyId,
        company_name: companyName,
        name_mask: maskedName,
        vote_id_count: 1,
        shits_count: shits,
        vote_details: JSON.stringify(voteDetails),
        max_score: voteScore,
      });
    }
    
    res.json({ 
      success: true, 
      voteId,
      voteScore,
      message: '投票提交成功' 
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取指定公司和姓名的最后一条投票明细
app.get('/api/vote/latest', async (req, res) => {
  try {
    const companyId = req.query.companyId;
    const nameMask = req.query.nameMask;
    
    if (!companyId || !nameMask) {
      return res.status(400).json({ error: 'Missing companyId or nameMask' });
    }
    
    const result = await client.execute({
      sql: 'SELECT * FROM vote WHERE company_id = ? AND name_mask = ? ORDER BY vote_id DESC LIMIT 1',
      args: [parseInt(companyId), nameMask]
    });
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No vote found' });
    }
  } catch (error) {
    console.error('Error fetching latest vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取指定公司和姓名的汇总信息
app.get('/api/summary', async (req, res) => {
  try {
    const companyId = req.query.companyId;
    const nameMask = req.query.nameMask;
    
    if (!companyId || !nameMask) {
      return res.status(400).json({ error: 'Missing companyId or nameMask' });
    }
    
    const result = await client.execute({
      sql: 'SELECT * FROM summary WHERE company_id = ? AND name_mask = ?',
      args: [parseInt(companyId), nameMask]
    });
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No summary found' });
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// 所有其他路由返回 index.html（前端路由支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database path: ${DB_PATH}`);
  });
});
