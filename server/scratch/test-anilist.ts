import { META } from '@consumet/extensions';

async function test() {
    const anilist = new META.Anilist();
    console.log('Searching Anilist for "One Piece"...');
    try {
        const results = await anilist.search('One Piece');
        console.log('Results:', results.results?.length || 0);
        if (results.results?.length > 0) {
            console.log('First result:', results.results[0].title, results.results[0].id);
            const info = await anilist.fetchAnimeInfo(results.results[0].id);
            console.log('Episodes:', info.episodes?.length || 0);
            if (info.episodes?.length > 0) {
                const ep = info.episodes[0];
                console.log('Fetching sources for ep:', ep.id);
                const sources = await anilist.fetchEpisodeSources(ep.id);
                console.log('Sources:', sources.sources?.length || 0);
            }
        }
    } catch (e: any) {
        console.error('Anilist failed:', e.message);
    }
}
test();
