import { ANIME } from '@consumet/extensions';

async function test() {
    const gogo = new ANIME.Gogoanime();
    console.log('Searching for Naruto...');
    const results = await gogo.search('Naruto');
    console.log('Results:', results.results?.length || 0);
    if (results.results?.length > 0) {
        console.log('First result:', results.results[0].title);
    }
}

test();
