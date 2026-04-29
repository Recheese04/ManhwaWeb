import { ANIME } from '@consumet/extensions';

async function testAll() {
    const providers = [
        'Hianime', 'AnimePahe', 'AnimeKai', 'KickAssAnime', 
        'AnimeSaturn', 'AnimeUnity', 'AnimeSama'
    ];

    for (const name of providers) {
        console.log(`\n--- Testing ${name} ---`);
        try {
            const provider = new (ANIME as any)[name]();
            const results = await provider.search('One Piece');
            console.log(`${name} Results:`, results.results?.length || 0);
            if (results.results?.length > 0) {
                console.log(`First result: ${results.results[0].title} (${results.results[0].id})`);
            }
        } catch (e: any) {
            console.log(`${name} Error:`, e.message);
        }
    }
}

testAll();
