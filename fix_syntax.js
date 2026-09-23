const fs = require('fs');

// Fix AdminSettings.tsx - backslash-escaped braces
let a = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

// Replace the broken nisab line
a = a.split('\n').map((line, i) => {
  // Line 167 (0-indexed: 166)
  if (i === 166 && line.includes('parseFloat(goldPrice')) {
    return '            <div className="text-lg font-bold text-slate-800">${parseFloat(goldPrice || \'0\') > 0 ? (parseFloat(goldPrice) * 85).toFixed(2) : \'0.00\'}</div>';
  }
  // Line 170 (0-indexed: 169)
  if (i === 169 && line.includes('isSavingGold')) {
    return '            {isSavingGold ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}';
  }
  return line;
}).join('\n');

fs.writeFileSync('src/components/AdminSettings.tsx', a);
console.log('AdminSettings.tsx fixed');

// Fix review/page.tsx
let r = fs.readFileSync('src/app/review/page.tsx', 'utf8');
r = r.replace(
  '            </select>\n            </div>\n          )}\n          </div>',
  '            </select>\n            </div>\n          </div>\n          )}'
);
fs.writeFileSync('src/app/review/page.tsx', r);
console.log('review/page.tsx fixed');
