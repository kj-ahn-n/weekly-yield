const fs = require('fs');
const appJs = fs.readFileSync('/tmp/app.js', 'utf-8');
const fetchMatches = appJs.match(/fetch\([^)]+\)/g);
const getMatches = appJs.match(/\$\.get(JSON)?\([^)]+\)/g);
const apiMatches = appJs.match(/https?:\/\/(?:api|data)[^"']+/g);
const csvMatches = appJs.match(/['"\`][^'"\`\n]*\.(csv|json)['"\`]/g);

console.log("Fetches:", fetchMatches ? fetchMatches.slice(0,10) : "none");
console.log("Gets:", getMatches ? getMatches.slice(0,10) : "none");
console.log("APIs:", apiMatches ? apiMatches.slice(0,10) : "none");
console.log("CSVs/JSONs:", csvMatches ? csvMatches.slice(0,10) : "none");
