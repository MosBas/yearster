// Script to download Spotify songs dataset and build verified songs.js
// Merges English songs from TidyTuesday dataset with curated Hebrew songs
// Target: ~100 songs per decade from 1970-2020s
// Run: node build_songs.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const CSV_URL = 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv';

function downloadCSV(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const idIdx = headers.indexOf('track_id');
    const nameIdx = headers.indexOf('track_name');
    const artistIdx = headers.indexOf('track_artist');
    const popIdx = headers.indexOf('track_popularity');
    const albumDateIdx = headers.indexOf('track_album_release_date');

    const songs = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const fields = [];
        let field = '';
        let inQuotes = false;
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(field.trim());
                field = '';
            } else {
                field += char;
            }
        }
        fields.push(field.trim());

        if (fields.length <= Math.max(idIdx, nameIdx, artistIdx, popIdx, albumDateIdx)) continue;

        const id = fields[idIdx];
        const name = fields[nameIdx];
        const artist = fields[artistIdx];
        const popularity = parseInt(fields[popIdx]) || 0;
        const dateStr = fields[albumDateIdx];
        const year = parseInt(dateStr) || 0;

        if (id && name && artist && year >= 1970 && year <= 2025 && popularity > 0) {
            songs.push({ id, title: name, artist, year, popularity });
        }
    }

    return songs;
}

async function verifyTrack(id) {
    return new Promise((resolve) => {
        const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ valid: true, title: json.title });
                } catch {
                    resolve({ valid: false });
                }
            });
            res.on('error', () => resolve({ valid: false }));
        }).on('error', () => resolve({ valid: false }));
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    // Load Hebrew songs
    let hebrewSongs = [];
    try {
        const { HEBREW_SONGS } = require('./hebrew_songs.js');
        hebrewSongs = HEBREW_SONGS;
        console.log(`Loaded ${hebrewSongs.length} Hebrew songs from hebrew_songs.js`);
    } catch (e) {
        console.log('No hebrew_songs.js found, using only English songs');
    }

    // Count Hebrew songs per decade
    const hebrewByDecade = {};
    for (const song of hebrewSongs) {
        const decade = Math.floor(song.year / 10) * 10;
        hebrewByDecade[decade] = (hebrewByDecade[decade] || 0) + 1;
    }

    console.log('Hebrew songs per decade:', hebrewByDecade);

    // Download English songs
    console.log('\nDownloading Spotify songs dataset...');
    const csv = await downloadCSV(CSV_URL);
    console.log(`Downloaded ${csv.length} bytes`);

    const allSongs = parseCSV(csv);
    console.log(`Parsed ${allSongs.length} songs with year >= 1970`);

    // Remove duplicates (keep highest popularity)
    const uniqueMap = new Map();
    for (const song of allSongs) {
        const key = song.id;
        if (!uniqueMap.has(key) || uniqueMap.get(key).popularity < song.popularity) {
            uniqueMap.set(key, song);
        }
    }

    const unique = [...uniqueMap.values()];
    console.log(`Unique songs: ${unique.length}`);

    // Group by decade
    const byDecade = {};
    for (const song of unique) {
        const decade = Math.floor(song.year / 10) * 10;
        if (!byDecade[decade]) byDecade[decade] = [];
        byDecade[decade].push(song);
    }

    console.log('\nAvailable English songs per decade:');
    for (const [decade, songs] of Object.entries(byDecade).sort()) {
        console.log(`  ${decade}s: ${songs.length} songs`);
    }

    // Target: 100 per decade total (English + Hebrew)
    const TARGET_PER_DECADE = 100;

    const selected = [];
    const decades = [1970, 1980, 1990, 2000, 2010, 2020];

    for (const decade of decades) {
        const hebrewCount = hebrewByDecade[decade] || 0;
        const englishNeeded = TARGET_PER_DECADE - hebrewCount;

        const decadeSongs = (byDecade[decade] || [])
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, englishNeeded);

        selected.push(...decadeSongs);
        console.log(`  ${decade}s: ${decadeSongs.length} English + ${hebrewCount} Hebrew = ${decadeSongs.length + hebrewCount} total`);
    }

    // Add Hebrew songs
    selected.push(...hebrewSongs);
    console.log(`\nTotal selected: ${selected.length} songs`);

    // Verify a random sample of 15
    console.log('\nVerifying 15 random tracks...');
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, 15);
    let verified = 0;
    let failed = [];
    for (const song of sample) {
        const result = await verifyTrack(song.id);
        const icon = result.valid ? '✅' : '❌';
        console.log(`  ${icon} "${song.title}" by ${song.artist} (${song.year}) -> ${result.title || 'NOT FOUND'}`);
        if (result.valid) verified++;
        else failed.push(song);
        await sleep(100);
    }
    console.log(`  Verified: ${verified}/${sample.length}`);

    if (failed.length > 0) {
        console.log('\n⚠️  Failed tracks (consider updating IDs):');
        for (const f of failed) {
            console.log(`  - "${f.title}" by ${f.artist}: ${f.id}`);
        }
    }

    // Sort final list by year
    selected.sort((a, b) => a.year - b.year || (b.popularity || 0) - (a.popularity || 0));

    // Generate JS file
    const jsContent = `// Yearster Song Database - Auto-generated from verified Spotify data + Hebrew songs
// ${selected.length} songs from ${Math.min(...selected.map(s => s.year))}-${Math.max(...selected.map(s => s.year))}
// Target: ~100 songs per decade (English + Hebrew)
// Each entry: { id: Spotify Track ID, title, artist, year }

const SONGS = [
${selected.map(s => `  { id: "${s.id}", title: ${JSON.stringify(s.title)}, artist: ${JSON.stringify(s.artist)}, year: ${s.year} }`).join(',\n')}
];
`;

    fs.writeFileSync('./songs.js', jsContent);
    console.log(`\nWrote ${selected.length} songs to songs.js`);

    // Final year distribution
    const finalDecades = {};
    for (const s of selected) {
        const decade = Math.floor(s.year / 10) * 10;
        finalDecades[decade] = (finalDecades[decade] || 0) + 1;
    }
    console.log('\nFinal year distribution:');
    for (const [decade, count] of Object.entries(finalDecades).sort()) {
        console.log(`  ${decade}s: ${count} songs`);
    }
}

main().catch(console.error);
