const fs = require('fs');
let c = fs.readFileSync('src/components/HistoryClient.tsx', 'utf8');

const targetFunction = `const handleDelete = async () => {`;
const replaceFunction = `const emptyCache = () => {
    if (confirm("Adakah anda benar-benar ingin mengosongkan cache data/imej di peranti ini? Tindakan ini HANYA memadam simpanan sementara (LocalStorage) bagi menjimatkan ruang memori bimbit anda. Rekod resit yang telah disegerakkan ke pangkalan data TIDAK akan terjejas.")) {
      try {
        let count = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('receipt_img_') || key === 'scannedImage')) {
            localStorage.removeItem(key);
            count++;
          }
        }
        alert(\`✅ Berjaya! Sebanyak \${count} cache imej resit telah dikosongkan.\`);
      } catch (err) {
        alert("Ralat semasa memadam cache.");
      }
    }
  };

  const handleDelete = async () => {`;

if (c.includes(targetFunction)) {
  c = c.replace(targetFunction, replaceFunction);
  
  const targetButton = `<button 
              type="button"
              onClick={fetchReceipts}`;
  const replaceButton = `<button 
              type="button"
              onClick={emptyCache}
              className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 active:scale-95 transition-all mr-1"
              title="Kosongkan Cache Imej"
            >
              <Trash2 size={16} />
            </button>
            <button 
              type="button"
              onClick={fetchReceipts}`;
  c = c.replace(targetButton, replaceButton);
  
  fs.writeFileSync('src/components/HistoryClient.tsx', c);
  console.log('Success updating HistoryClient');
} else {
  console.log('Target not found in HistoryClient');
}
