import { ANIME } from '@consumet/extensions';

async function test() {
    const hianime = new ANIME.Hianime();
    console.log('Searching Hianime for "One Piece"...');
    try {
        const results = await hianime.search('One Piece');
        console.log('Results:', results.results?.length || 0);
        if (results.results?.length > 0) {
            console.log('First result:', results.results[0].title, results.results[0].id);
            console.log('Fetching info...');
            const info = await hianime.fetchAnimeInfo(results.results[0].id);
            console.log('Episodes:', info.episodes?.length || 0);
        }
    } catch (e: any) {
        console.error('Hianime failed:', e.message);
    }

    const pahe = new ANIME.AnimePahe();
    console.log('\nSearching AnimePahe for "One Piece"...');
    try {
        const results = await pahe.search('One Piece');
        console.log('Results:', results.results?.length || 0);
    } catch (e: any) {
        console.error('AnimePahe failed:', e.message);
    }
}

test();
