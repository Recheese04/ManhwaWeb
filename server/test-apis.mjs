import { MANGA } from '@consumet/extensions'
const pill = new MANGA.MangaPill()

// Show ALL search results for "solo leveling"
const r = await pill.search('solo leveling')
console.log('Total results:', r.results.length)
r.results.forEach((res, i) => {
    console.log(`${i}: title="${res.title}" id="${res.id}"`)
})
