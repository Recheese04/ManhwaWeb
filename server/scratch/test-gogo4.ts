const title = 'Classroom of the Elite';
fetch('https://gogoanime3.co/search.html?keyword=' + encodeURIComponent(title))
    .then(r => r.text())
    .then(async t => {
        const redir = t.match(/window\.location\.replace\('([^']+)'\)/);
        if (redir) {
            console.log('Redirecting to:', redir[1]);
            const r2 = await fetch(redir[1]);
            const t2 = await r2.text();
            console.log(t2.substring(0, 500));
            const m = t2.match(/href="\/category\/([^"]+)"/);
            console.log('Final Match:', m ? m[1] : 'No match');
        } else {
            console.log('No redirect found.');
        }
    })
    .catch(console.error);
