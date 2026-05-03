const http = require('http');
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});
server.listen(3004, '127.0.0.1', () => {
    console.log('Server running at http://127.0.0.1:3004/');
    setTimeout(() => { process.exit(0); }, 5000);
});
