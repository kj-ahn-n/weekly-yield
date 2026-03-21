const fs = require('fs');
const js = fs.readFileSync('/tmp/app.js', 'utf-8');
const ajaxMatches = js.match(/url\s*:\s*['"`][^'"`]+['"`]/g);
if (ajaxMatches) {
   const dedup = [...new Set(ajaxMatches)];
   console.log("URLs found in $.ajax calls:");
   console.log(dedup);
} else {
   console.log("No URLs found.");
}
