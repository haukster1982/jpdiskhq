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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'JPDiskHQ/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON-feil: ' + data.slice(0,100))); }
      });
    }).on('error', reject);
  });
}

// Hent resultater for en konkurranse
app.get('/api/metrix/:id', async (req, res) => {
  try {
    const data = await fetchJson(`https://discgolfmetrix.com/api.php?content=result&id=${req.params.id}`);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hent alle norske baner
app.get('/api/baner', async (req, res) => {
  try {
    const data = await fetchJson('https://discgolfmetrix.com/api.php?content=courses_list&country_code=NO');
    const baner = Array.isArray(data) ? data : (data.Courses || []);
    console.log('Totalt baner:', baner.length);
    if (baner.length > 0) console.log('Forste bane:', JSON.stringify(baner[0]));
    else console.log('Ingen baner. Data:', JSON.stringify(data).slice(0,300));
    res.json(data);
  } catch (e) {
    console.log('Feil:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  try {
    const data = await fetchJson('https://discgolfmetrix.com/api.php?content=courses_list&country_code=NO');
    const baner = Array.isArray(data) ? data : (data.Courses || []);
    res.json({ antall: baner.length, forste3: baner.slice(0, 3) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hent konkurranser for en bane
app.get('/api/bane/:id', async (req, res) => {
  try {
    const data = await fetchJson(`https://discgolfmetrix.com/api.php?content=result&id=${req.params.id}`);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`JP Disk HQ kjorer pa port ${PORT}`));
