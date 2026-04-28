const { ANIME } = require('@consumet/extensions');

async function testProvider(name, provider, searchTerm) {
    console.log(`\n=== Testing ${name} ===`);
    try {
        const results = await provider.search(searchTerm);
        if (!results.results?.length) {
            console.log(`  ❌ No search results`);
            return false;
        }
        const match = results.results[0];
        console.log(`  ✅ Search: "${match.title}" (${match.id})`);

        const info = await provider.fetchAnimeInfo(match.id);
        if (!info.episodes?.length) {
            console.log(`  ❌ No episodes`);
            return false;
        }
        console.log(`  ✅ Episodes: ${info.episodes.length}`);
        
        const ep = info.episodes[0];
        console.log(`  Episode 1 ID: ${ep.id}`);

        try {
            const sources = await provider.fetchEpisodeSources(ep.id);
            if (sources?.sources?.length) {
                console.log(`  ✅ SOURCES FOUND: ${sources.sources.length}`);
                console.log(`  First source: ${sources.sources[0].url?.substring(0, 100)}`);
                return true;
            } else {
                console.log(`  ❌ No sources in response`);
                return false;
            }
        } catch (e) {
            console.log(`  ❌ fetchEpisodeSources error: ${e.message?.substring(0, 100)}`);
            return false;
        }
    } catch (e) {
        console.log(`  ❌ Error: ${e.message?.substring(0, 100)}`);
        return false;
    }
}

async function main() {
    const providers = [
        ['AnimeKai', new ANIME.AnimeKai()],
        ['Hianime', new ANIME.Hianime()],
        ['AnimePahe', new ANIME.AnimePahe()],
        ['AnimeUnity', new ANIME.AnimeUnity()],
        ['AnimeSaturn', new ANIME.AnimeSaturn()],
    ];

    let working = [];
    for (const [name, provider] of providers) {
        const ok = await testProvider(name, provider, 'Naruto');
        if (ok) working.push(name);
    }

    console.log('\n=== RESULTS ===');
    if (working.length) {
        console.log('Working providers:', working.join(', '));
    } else {
        console.log('No working providers found!');
    }
}

main();
