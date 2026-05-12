// API 端点：验证管理员密码
// POST /api/auth
// Body: { password: "xxx" }
// 返回: { ok: true, token: "session_token" } 或 { ok: false }

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'liubei_secret_2026';

// 简单的 HMAC-like session token（非严格安全，但对朋友工具够用）
function createSessionToken() {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2);
  return Buffer.from(`${ts}.${rand}.${SESSION_SECRET}`).toString('base64url');
}

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { password } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (password === ADMIN_PASSWORD) {
      return res.status(200).json({
        ok: true,
        token: createSessionToken()
      });
    }

    return res.status(200).json({ ok: false });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request' });
  }
}
