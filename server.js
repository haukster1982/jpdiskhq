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
        catch (e) { reject(new Error('JSON-feil')); }
      });
    }).on('error', reject);
  });
}

// Hent ALLE norske baner ved å søke på hvert bokstav
app.get('/api/baner', async (req, res) => {
  try {
    const bokstaver = 'abcdefghijklmnopqrstuvwxyzæøå';
    const alleIds = new Set();
    const alleBaner = [];

    await Promise.all(bokstaver.split('').map(async (b) => {
      try {
        const data = await fetchJson(
          `https://discgolfmetrix.com/api.php?content=courses_list&country_code=NO&name=${b}`
        );
        const baner = Array.isArray(data) ? data : (data.Courses || []);
        baner.forEach(bane => {
          if (!alleIds.has(bane.ID)) {
            alleIds.add(bane.ID);
            alleBaner.push(bane);
          }
        });
      } catch(e) {}
    }));

    console.log(`Totalt ${alleBaner.length} baner hentet`);
    res.json(alleBaner);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Debug
app.get('/api/debug', async (req, res) => {
  try {
    const data = await fetchJson('https://discgolfmetrix.com/api.php?content=courses_list&country_code=NO&name=k');
    const baner = Array.isArray(data) ? data : (data.Courses || []);
    res.json({ antall_med_k: baner.length, forste3: baner.slice(0, 3) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hent resultater for en konkurranse
app.get('/api/metrix/:id', async (req, res) => {
  try {
    const data = await fetchJson(`https://discgolfmetrix.com/api.php?content=result&id=${req.params.id}`);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`JP Disk HQ kjorer pa port ${PORT}`));
