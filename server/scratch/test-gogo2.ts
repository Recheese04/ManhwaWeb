const title = 'Classroom of the Elite';
fetch('https://gogoanime3.co/search.html?keyword=' + encodeURIComponent(title))
    .then(r => r.text())
    .then(t => {
        const m = t.match(/href="\/category\/([^"]+)"/);
        console.log(m ? m[1] : 'No match');
    })
    .catch(console.error);
