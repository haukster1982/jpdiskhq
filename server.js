const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

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
  return (s || '').replace(/<[^>]+>/g, '').replace(/&rarr;/g, '->').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

app.get('/api/metrix/:id', async (req, res) => {
  try {
    const data = await fetchJson(`https://discgolfmetrix.com/api.php?content=result&id=${req.params.id}`);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/debug', async (req, res) => {
  try {
    const html = await fetchHtml('https://discgolfmetrix.com/?u=competitions_list&country_code=NO&type=A&default_period=6');
    const idx = html.indexOf('Kopervik');
    res.json({
      versjon: '3.0',
      lengde: html.length,
      kopervik_pos: idx,
      rundt_kopervik: idx > 0 ? html.slice(Math.max(0, idx-300), idx+600) : 'ikke funnet'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log('JP Disk HQ v3.0 kjorer pa port ' + PORT));
