// API 端点：读取公园数据
// GET /api/data
// 返回: { places: [...], version: "..." }

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

  try {
    // 从 GitHub Gist 获取数据
    const gistRes = await fetch(
      `https://api.github.com/gists/${GIST_ID}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Liubei-App/1.0'
        }
      }
    );

    if (!gistRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch data from Gist', status: gistRes.status });
    }

    const gist = await gistRes.json();
    
    // 找到 parks.json 文件
    const files = gist.files || {};
    const parksFile = files['parks.json'] || files[Object.keys(files)[0]];
    
    if (!parksFile || !parksFile.content) {
      return res.status(500).json({ error: 'No parks data found in Gist' });
    }

    const places = JSON.parse(parksFile.content);
    
    return res.status(200).json({
      places: places,
      version: gist.version,
      updated: gist.updated_at
    });
  } catch (e) {
    console.error('Data fetch error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
