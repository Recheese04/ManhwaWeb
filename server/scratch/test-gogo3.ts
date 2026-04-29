const title = 'Classroom of the Elite';
fetch('https://gogoanime3.co/search.html?keyword=' + encodeURIComponent(title))
    .then(r => r.text())
    .then(t => {
        console.log(t.substring(t.indexOf('items'), t.indexOf('items') + 1000));
    })
    .catch(console.error);
