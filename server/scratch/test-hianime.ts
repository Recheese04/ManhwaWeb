const title = 'Classroom of the Elite';
fetch('https://hianime.to/search?keyword=' + encodeURIComponent(title))
    .then(r => r.text())
    .then(t => {
        console.log("Length:", t.length);
        const match = t.match(/href="\/([a-zA-Z0-9\-]+-\d+)"/);
        console.log('Match:', match ? match[1] : 'None');
    })
    .catch(console.error);
