// API 端点：保存公园数据（需要认证）
// POST /api/save
// Headers: { Authorization: "Bearer <session_token>" }
// Body: { places: [...] }

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'liubei_secret_2026';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;

// 验证 session token 是否有效（简单校验：能 base64 decode 且包含 secret）
function isValidSessionToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    return decoded.includes(SESSION_SECRET);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 鉴权
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!isValidSessionToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { places } = body;

    if (!Array.isArray(places)) {
      return res.status(400).json({ error: 'Invalid places data' });
    }

    // 更新 GitHub Gist
    const content = JSON.stringify(places, null, 2);
    
    const gistRes = await fetch(
      `https://api.github.com/gists/${GIST_ID}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Liubei-App/1.0'
        },
        body: JSON.stringify({
          description: '遛呗 · 北京 - 公园数据',
          files: {
            'parks.json': {
              content: content
            }
          }
        })
      }
    );

    if (!gistRes.ok) {
      const errText = await gistRes.text();
      console.error('Gist save error:', gistRes.status, errText);
      return res.status(502).json({ 
        error: 'Failed to save to Gist', 
        status: gistRes.status,
        detail: errText.slice(0, 200)
      });
    }

    const result = await gistRes.json();
    
    return res.status(200).json({
      ok: true,
      version: result.version,
      updated: result.updated_at
    });
  } catch (e) {
    console.error('Save error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
