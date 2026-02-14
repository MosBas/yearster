// Build Hebrew songs list using verified Track IDs from kworb.net
// Run: node find_hebrew_ids.js

const https = require('https');
const fs = require('fs');

function verifyTrack(id) {
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Curated list with Track IDs extracted directly from kworb.net URLs
// These are VERIFIED real Spotify Track IDs
const hebrewSongs = [
    // === 2020s - Omer Adam ===
    { id: "3U1voPJN8NBSR96Ry0WJiF", title: "מלכת הדור", artist: "עומר אדם", year: 2024 },
    { id: "5Sn3aXG5AWFmd1ij2PTisj", title: "השיר שאת אהבת", artist: "עומר אדם", year: 2024 },
    { id: "1BKXM5acD2NHjBaWTCsXFk", title: "מהפכה של שמחה", artist: "עומר אדם", year: 2022 },
    { id: "5aDaDlIrhFeXUPcBqxGisR", title: "אחרי כל השנים", artist: "עומר אדם", year: 2023 },
    // === 2020s - Eden Ben Zaken ===
    { id: "5gmwl9W6Ym0JMEgkUPtXe6", title: "יאסו", artist: "עדן בן זקן", year: 2023 },
    { id: "4JSUFLR3Uo7FPCfNDRxIrx", title: "ברחובות של תל אביב", artist: "עדן בן זקן", year: 2023 },
    { id: "5liIuoKq6hJZOheB95eTCt", title: "אגרוף", artist: "עדן בן זקן", year: 2022 },
    { id: "5ArZAXZjGqDC95HySnhvN3", title: "חיים שלי", artist: "עדן בן זקן", year: 2022 },
    { id: "0sCN2Vt33MyAmsHpNxR2Kq", title: "חיים מאושרים", artist: "עדן בן זקן", year: 2021 },
    // === 2010s - Omer Adam ===
    { id: "26o6KYVdmCmh7AY0nhBoKj", title: "תל אביב", artist: "עומר אדם", year: 2013 },
    { id: "0qH6stYoiSWErrzIvkiN1W", title: "שני משוגעים", artist: "עומר אדם", year: 2015 },
    { id: "4zXfQYhcSboWEOAwIQST9N", title: "רק שלך", artist: "עומר אדם", year: 2016 },
    { id: "4dELL8S6XVMibwBkjJACF1", title: "לילות וקללות", artist: "עומר אדם", year: 2017 },
    { id: "1hTth4TFnHWYWiXglQ6bN2", title: "רחוק מכולם", artist: "עומר אדם", year: 2019 },
    // === 2010s - Eden Ben Zaken ===
    { id: "5L9qCjY83hVP24RIo3rFjZ", title: "קוקוריקו", artist: "עדן בן זקן", year: 2019 },
    { id: "7n6elf6gl4POlFO2LlyIMy", title: "בסיבוב הבא", artist: "עדן בן זקן", year: 2018 },
    { id: "6GCoKavQd5wOqScl5wVXOp", title: "מועבט", artist: "עדן בן זקן", year: 2016 },
    { id: "6YQpTZk61Ku0hyutsVLpPe", title: "חיפשתי אותו בנרות", artist: "עדן בן זקן", year: 2017 },
    // === 2020s - Other Israeli artists ===
    { id: "7iepAdmAykL8gh7dYMzpsM", title: "רולקס וקסקט", artist: "עדן בן זקן", year: 2025 },
    { id: "3gdSZLWC594njZXkwWh7lQ", title: "ואן דאם", artist: "Odeya", year: 2025 },
    { id: "6FVNMp4r4cQOcckK5NFB6j", title: "אם את כבר הולכת", artist: "נדב חנציס", year: 2025 },
    { id: "02mgxr6NgCwAVtuLtttDUB", title: "מדאם", artist: "Noam Bettan", year: 2025 },
    { id: "2bzhJBao5xywL3jlXu2S8O", title: "סחרחורות", artist: "Mor", year: 2025 },
    { id: "7nCe56CzvRKGqTIs5k1dYm", title: "עוף מוזר", artist: "Peer Tasi", year: 2025 },
    { id: "3XSSUNQJHy7GTWtSHHITq5", title: "השם ירחם", artist: "Tuna", year: 2025 },
    { id: "6Ma5wr8hndGkkjsk9rgVKS", title: "היא לא יודעת למה", artist: "Peer Tasi", year: 2024 },
    { id: "3Dx920qUWdBswFizsT1PxR", title: "באמת של האמת", artist: "Osher Cohen", year: 2024 },
    { id: "05iw1Zb7Lp5DNUSvDhBRk6", title: "נגנב ממך", artist: "Full Trunk", year: 2024 },
    { id: "4WoKmBYVGyrf7t0SkHhMQ1", title: "אין כבוד", artist: "Osher Cohen", year: 2024 },
    { id: "6Gt2PGz5zL9HnnJo3UvDV4", title: "עולם בשני צבעים", artist: "ששון שאולוב", year: 2024 },
    { id: "6VYbnnpUYShqFn22MERtmP", title: "המבט בעיניך", artist: "Agam Buhbut", year: 2024 },
    // Omer Adam older hits
    { id: "7ibWPuw6aT2Vb0hoDUXGHd", title: "יעשו לנו כבוד", artist: "עומר אדם", year: 2018 },
    { id: "1Jx6aZyJR985kw8CWUZ15O", title: "צמוד צמוד", artist: "עומר אדם", year: 2017 },
    { id: "0SMDtYt5HghaTMFc61nCnP", title: "ואיך שלא", artist: "עומר אדם", year: 2019 },
    { id: "4cZd8TSEowGRcDsmCvJEjU", title: "אוהבת אותי אמיתי", artist: "עומר אדם", year: 2012 },
    { id: "44GSjYhBxuuKx0ikN5Dmag", title: "יהיה טוב & מים שקופים", artist: "עומר אדם", year: 2020 },
    { id: "3pTsE064ZTJ1n8bP3VAm2c", title: "תהום", artist: "עומר אדם", year: 2021 },
    { id: "5ppuL7dOIhd7td0YCJJuwf", title: "טקילה", artist: "עומר אדם", year: 2016 },
    { id: "7zsT5Dd6rLo8AOrN4Bj4Hl", title: "הלב שלי", artist: "עומר אדם", year: 2014 },
    { id: "7uUUtCQYzbE917JnobCtDy", title: "היא רק רוצה לרקוד", artist: "עומר אדם", year: 2011 },
    { id: "5qbezFG8xCtoyUfOcjHUXv", title: "אני", artist: "עומר אדם", year: 2015 },
    // Eden Ben Zaken more
    { id: "52wQnuYSGb6DofAGQNLMsa", title: "תזיזו", artist: "עדן בן זקן", year: 2020 },
    { id: "5HhVbTC6HGflJs0I2LHHxf", title: "רציתי", artist: "עדן בן זקן", year: 2017 },
    { id: "18YUiBqnHhzsRr0k1ppP18", title: "תל אביב בלילה", artist: "עדן בן זקן", year: 2020 },
    { id: "7ea31KGrIuCRvHF31ir6GD", title: "לזאת שניצחה", artist: "עדן בן זקן", year: 2019 },
    { id: "4JPoUegxFjxtUgHUcLzoYN", title: "פילטרים יפים", artist: "עדן בן זקן", year: 2018 },
    { id: "6kVmhOoBlMEH3WdxrLhjFB", title: "הפשע המושלם", artist: "עדן בן זקן", year: 2016 },
    { id: "4pQo5w8RjtfTRZB2QSxs8e", title: "מלכת השושנים", artist: "עדן בן זקן", year: 2015 },
];

async function main() {
    console.log(`Verifying ${hebrewSongs.length} Hebrew songs...\n`);

    const verified = [];
    const failed = [];

    for (const song of hebrewSongs) {
        const result = await verifyTrack(song.id);
        if (result.valid) {
            verified.push({ ...song, spotifyTitle: result.title });
            process.stdout.write('✅');
        } else {
            failed.push(song);
            process.stdout.write('❌');
        }
        await sleep(80);
    }

    console.log(`\n\nVerified: ${verified.length}/${hebrewSongs.length}`);

    if (failed.length > 0) {
        console.log('\nFailed tracks:');
        for (const f of failed) {
            console.log(`  ❌ ${f.title} by ${f.artist} (${f.id})`);
        }
    }

    // Group by decade
    const byDecade = {};
    for (const s of verified) {
        const decade = Math.floor(s.year / 10) * 10;
        if (!byDecade[decade]) byDecade[decade] = [];
        byDecade[decade].push(s);
    }

    console.log('\nDistribution:');
    for (const [d, songs] of Object.entries(byDecade).sort()) {
        console.log(`  ${d}s: ${songs.length} songs`);
    }

    // Write hebrew_songs.js
    const jsContent = `// Hebrew songs with verified Spotify Track IDs from kworb.net
// All IDs verified via Spotify oEmbed API
// Total: ${verified.length} songs

const HEBREW_SONGS = [
${verified.map(s => `  { id: "${s.id}", title: ${JSON.stringify(s.spotifyTitle || s.title)}, artist: ${JSON.stringify(s.artist)}, year: ${s.year} }`).join(',\n')}
];

module.exports = { HEBREW_SONGS };
`;

    fs.writeFileSync('./hebrew_songs.js', jsContent);
    console.log(`\nWrote ${verified.length} verified Hebrew songs to hebrew_songs.js`);
}

main().catch(console.error);
