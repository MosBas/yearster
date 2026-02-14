// Script to verify all Spotify Track IDs via oEmbed API
// Run: node verify_songs.js

const songs = require('./songs_data.js');

async function checkTrack(id) {
    try {
        const res = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`);
        if (!res.ok) return { id, status: 'NOT_FOUND' };
        const data = await res.json();
        return { id, status: 'OK', actualTitle: data.title };
    } catch (e) {
        return { id, status: 'ERROR', error: e.message };
    }
}

async function main() {
    console.log('Verifying all track IDs...\n');

    const results = [];
    // Process in batches of 5 to avoid rate limiting
    for (let i = 0; i < songs.length; i += 5) {
        const batch = songs.slice(i, i + 5);
        const batchResults = await Promise.all(
            batch.map(song => checkTrack(song.id).then(r => ({ ...r, expectedTitle: song.title, artist: song.artist })))
        );
        results.push(...batchResults);

        for (const r of batchResults) {
            const match = r.actualTitle && r.actualTitle.toLowerCase().includes(r.expectedTitle.toLowerCase().substring(0, 10));
            const icon = r.status === 'NOT_FOUND' ? '❌' : match ? '✅' : '⚠️';
            console.log(`${icon} ${r.expectedTitle} | Expected: "${r.expectedTitle}" | Got: "${r.actualTitle || 'N/A'}"`);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const ok = results.filter(r => r.status === 'OK').length;
    const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
    const wrong = results.filter(r => r.status === 'OK' && r.actualTitle && !r.actualTitle.toLowerCase().includes(r.expectedTitle.toLowerCase().substring(0, 10))).length;

    console.log(`\n--- Summary ---`);
    console.log(`Total: ${results.length}`);
    console.log(`Found: ${ok}`);
    console.log(`Not Found: ${notFound}`);
    console.log(`Wrong Song: ${wrong}`);
}

main();
