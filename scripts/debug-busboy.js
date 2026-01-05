const busboy = require('busboy');
console.log('Require busboy:', busboy);
console.log('Type:', typeof busboy);
console.log('Busboy.default:', busboy.default);
try {
    new busboy({ headers: {} });
    console.log('Wrapper: standard new works');
} catch (e) {
    console.log('Wrapper: standard new failed', e.message);
}
