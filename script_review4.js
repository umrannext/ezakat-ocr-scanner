const fs = require('fs');
let c = fs.readFileSync('src/app/review/page.tsx', 'utf8');

c = c.replace("              return;\n            }\n            if (isQuickMode", "              return;\n            }\n            alert('✅ Berjaya! Data telah disahkan dan disegerakkan (Synced) ke dalam pangkalan data.');\n            if (isQuickMode");

fs.writeFileSync('src/app/review/page.tsx', c);
console.log('Success');
