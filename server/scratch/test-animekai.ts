import { ANIME } from '@consumet/extensions';

async function test() {
    const kai = new ANIME.AnimeKai();
    const id = 'one-piece-dk6r';
    console.log('Fetching info for:', id);
    try {
        const info = await kai.fetchAnimeInfo(id);
        console.log('Episodes:', info.episodes?.length || 0);
        if (info.episodes?.length > 0) {
            const ep = info.episodes[0];
            console.log('Fetching sources for ep:', ep.id);
            const sources = await kai.fetchEpisodeSources(ep.id);
            console.log('Sources:', sources.sources?.length || 0);
            if (sources.sources?.length > 0) {
                console.log('First source:', sources.sources[0].url);
            }
        }
    } catch (e: any) {
        console.error('AnimeKai failed:', e.message);
    }
}
test();
