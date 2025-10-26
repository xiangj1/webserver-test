#!/usr/bin/env node
/*
 * Planetary + house data generator for AstroChart using swisseph.
 * Usage:
 *   node scripts/generate-data.js --date "1995-08-19T10:25:00+08:00" --lat 30.6 --lon 114.3 --house P --out data.json
 * Defaults:
 *   date = 1995-08-19T10:25:00+08:00 (+08:00 local)
 *   lat  = 30.6
 *   lon  = 114.3
 *   house system = P (Placidus)
 * Notes:
 *   - This script uses swisseph (Swiss Ephemeris). Ensure licensing compliance if used beyond demo.
 */

const swe = require('swisseph');
const fs = require('fs');

// Simple argv parser
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = args.indexOf('--' + name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return def;
};

const dateStr = getArg('date', '1995-08-19T10:25:00+08:00');
const lat = parseFloat(getArg('lat', '30.6'));
const lon = parseFloat(getArg('lon', '114.3'));
const houseSys = getArg('house', 'P'); // Placidus
const outFile = getArg('out', 'data.json');

// Convert date string to Date and then to Julian Day (UTC)
const localDate = new Date(dateStr);
if (isNaN(localDate.getTime())) {
  console.error('Invalid date:', dateStr);
  process.exit(1);
}

// Convert to UTC components for Swiss Ephemeris
const year = localDate.getUTCFullYear();
const month = localDate.getUTCMonth() + 1; // 1-based
const day = localDate.getUTCDate();
const hourDecimal = localDate.getUTCHours() + localDate.getUTCMinutes() / 60 + localDate.getUTCSeconds() / 3600;

// Julian day (UT)
const jd = swe.swe_julday(year, month, day, hourDecimal, swe.SE_GREG_CAL);

// Planets list (Swiss Ephemeris constants)
// Excluding Earth; adding True Node for NNode.
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
    swe.swe_houses(jd, lat, lon, system, (res) => {
      if (res.error) return reject(res.error);
      resolve(res);
    });
  });
}

(async () => {
  try {
  // Optionally set ephemeris path (defaults to bundled data). You could customize with swe.swe_set_ephe_path('path');
  const planetsData = {};
    for (const p of PLANETS) {
      try {
        const r = await calcPlanet(jd, p.id);
        planetsData[p.key] = [Number(r.longitude.toFixed(6)), Number((r.speedLong||r.speedLongitude||0).toFixed(6))];
      } catch (e) {
        console.warn('Planet calc failed for', p.key, e);
      }
    }

    // Houses
    let cuspsRaw = [];
    try {
      const houses = await calcHouses(jd, lat, lon, houseSys);
      // library may return .cusps or .house array (1-based)
      const arr = houses.cusps || houses.house || [];
      if (Array.isArray(arr) && arr.length >= 13) {
        cuspsRaw = arr.slice(1, 13);
      }
    } catch (e) {
      console.warn('House calc failed:', e);
    }
    const cusps = cuspsRaw.map(c => Number(Number(c).toFixed(6)));

    const out = {
      meta: {
        source: 'swisseph',
        dateInput: dateStr,
        dateUTC: localDate.toISOString(),
        julianDay: jd,
        latitude: lat,
        longitude: lon,
        houseSystem: houseSys
      },
      planets: planetsData,
      cusps
    };

    fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf-8');
    console.log('Ephemeris data written to', outFile);
  } catch (e) {
    console.error('Generation failed:', e);
    process.exit(1);
  }
})();
