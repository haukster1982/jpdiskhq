const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

let cache = { data: null, tid: 0 };
const CACHE_TTL = 30 * 60 * 1000;

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'JPDiskHQ/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON-feil')); }
      });
    }).on('error', reject);
  });
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/&rarr;/g, '→').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

app.get('/api/metrix/:id', async (req, res) => {
  try {
    const data = await fetchJson(`https://discgolfmetrix.com/api.php?content=result&id=${req.params.id}`);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Debug - vis råHTML rundt Liarlund
app.get('/api/debug', async (req, res) => {
  try {
    const html = await fetchHtml('https://discgolfmetrix.com/?u=competitions_list&country_code=NO&type=A&default_period=6');
    const idx = html.indexOf('3551556');
    const rundt = html.slice(Math.max(0, idx - 50), idx + 800);
    res.json({ pos: idx, html: rundt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`JP Disk HQ kjorer pa port ${PORT}`));
