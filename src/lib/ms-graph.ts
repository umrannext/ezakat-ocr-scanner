// Microsoft Graph API Helpers (Cloudflare Workers / Edge Compatible)
// Menggunakan native fetch untuk sokongan penuh Edge Runtime (tanpa msal-node)

const MS_TENANT_ID = process.env.MS_TENANT_ID || '';
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || '';
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';
const UPN = 'ismail.jamil@jpi.edu.bn';

let cachedToken = '';
let tokenExpiry = 0;

export async function getGraphToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error('Konfigurasi Microsoft Graph tidak lengkap dalam .env');
  }

  const url = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mendapatkan token MS Graph: ${errorText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000); // Tolak 5 minit untuk buffer selamat
  
  return cachedToken;
}

/**
 * Memuat naik fail ke OneDrive pengguna
 * @param path Lokasi dalam OneDrive (Cth: /Zakat/Images/Resit-123.jpg)
 * @param buffer Kandungan fail
 * @param contentType Jenis MIME
 * @returns Rujukan maklumat fail dari Graph API
 */
export async function uploadToOneDrive(path: string, buffer: Buffer | ArrayBuffer, contentType: string) {
  const token = await getGraphToken();
  // Tulis ganti (replace) jika fail wujud
  const url = `https://graph.microsoft.com/v1.0/users/${UPN}/drive/root:/${path}:/content`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': contentType
    },
    body: buffer
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal memuat naik ke OneDrive: ${errorText}`);
  }

  return res.json(); // Mengembalikan data fail (termasuk id)
}

/**
 * Mencipta pautan perkongsian 'view-only' awam/dalaman
 * @param itemId ID fail dari OneDrive
 * @returns Pautan perkongsian (Sharing Link URL)
 */
export async function createSharingLink(itemId: string): Promise<string> {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${UPN}/drive/items/${itemId}/createLink`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: "view",
      scope: "anonymous" // Bergantung kepada polisi syarikat (Boleh ubah ke 'organization' jika anonymous dihalang)
    })
  });

  if (!res.ok) {
    // Sesetengah tenant halang anonymous link. Jika gagal, cuba 'organization' link
    if (res.status === 403 || res.status === 400) {
      const fallbackRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: "view",
          scope: "organization"
        })
      });
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        return fbData.link.webUrl;
      }
    }
    const errorText = await res.text();
    throw new Error(`Gagal mencipta link perkongsian OneDrive: ${errorText}`);
  }

  const data = await res.json();
  return data.link.webUrl;
}
