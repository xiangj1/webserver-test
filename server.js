#!/usr/bin/env node
const express = require('express');
const path = require('path');
const swe = require('swisseph');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (index.html, astrochart.js, etc.)
app.use(express.static(path.join(__dirname)));

// Try set ephemeris path (bundled within swisseph package under /ephe). Not strictly required for some computations
// but improves reliability for houses and node calculations.
try {
  const ephePath = path.join(__dirname, 'node_modules', 'swisseph', 'ephe');
  if (typeof swe.swe_set_ephe_path === 'function') {
    swe.swe_set_ephe_path(ephePath);
    // console.log('Ephemeris path set to', ephePath);
  }
} catch (e) {
  // silent fallback
}

// Utility: compute Julian day
function toJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hourDecimal = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swe.swe_julday(year, month, day, hourDecimal, swe.SE_GREG_CAL);
}

const PLANETS = [
  { key: 'Sun', id: swe.SE_SUN },
  { key: 'Moon', id: swe.SE_MOON },
  { key: 'Mercury', id: swe.SE_MERCURY },
  { key: 'Venus', id: swe.SE_VENUS },
  { key: 'Mars', id: swe.SE_MARS },
  { key: 'Jupiter', id: swe.SE_JUPITER },
  { key: 'Saturn', id: swe.SE_SATURN },
  { key: 'Uranus', id: swe.SE_URANUS },
  { key: 'Neptune', id: swe.SE_NEPTUNE },
  { key: 'Pluto', id: swe.SE_PLUTO },
  { key: 'NNode', id: swe.SE_MEAN_NODE }
];

function calcPlanet(jd, planetId) {
  return new Promise((resolve, reject) => {
    swe.swe_calc_ut(jd, planetId, swe.SEFLG_SWIEPH, (res) => {
      if (res.error) return reject(res.error);
      resolve(res);
    });
  });
}

function calcHouses(jd, lat, lon, system) {
  return new Promise((resolve, reject) => {
    const fn = swe.swe_houses_ex2 || swe.swe_houses_ex || swe.swe_houses;
    try {
      // Extended signatures differ; we try simple variant first.
      fn(jd, lat, lon, system, (res) => {
        if (res.error) return reject(res.error);
        resolve(res);
      });
    } catch (e) {
      reject(e);
    }
  });
}

app.get('/api/ephemeris', async (req, res) => {
  try {
    const { date, lat, lon, house = 'P', tz = '0' } = req.query;
    if (!date || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'Missing required query params: date, lat, lon' });
    }

    // date expected in ISO local form, tz offset hours (string)
    const tzOffset = parseFloat(tz || '0');
    const localDate = new Date(date);
    if (isNaN(localDate.getTime())) return res.status(400).json({ error: 'Invalid date format' });

    const utcDate = new Date(localDate.getTime() - tzOffset * 3600 * 1000);
    const jd = toJulianDay(utcDate);

    const planetsData = {};
    for (const p of PLANETS) {
      try {
        const r = await calcPlanet(jd, p.id);
        planetsData[p.key] = [Number(r.longitude.toFixed(6)), Number((r.speedLong || r.speedLongitude || 0).toFixed(6))];
      } catch (e) {
        planetsData[p.key] = [null, 0];
      }
    }

    let cusps = [];
    let cuspsSource = 'houses';
    try {
      const houses = await calcHouses(jd, parseFloat(lat), parseFloat(lon), house);
      const arr = houses.cusps || houses.house || [];
      if (Array.isArray(arr) && arr.length >= 13) {
        cusps = arr.slice(1, 13).map(c => Number(Number(c).toFixed(6)));
      }
    } catch (e) {
      cuspsSource = 'fallback';
    }
    if (cusps.length !== 12) {
      // Fallback: evenly spaced 30° starting at Asc approximate = first planet or 0°, simple demo only.
      cusps = Array.from({ length: 12 }, (_, i) => (i * 30) % 360);
      cuspsSource = 'fallback';
    }

    res.json({
      meta: { date, tz: tzOffset, usedUTC: utcDate.toISOString(), jd, lat: parseFloat(lat), lon: parseFloat(lon), house, cuspsSource },
      planets: planetsData,
      cusps
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal error', details: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Astro server running at http://localhost:${PORT}`);
});
