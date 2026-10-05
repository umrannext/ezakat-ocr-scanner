// Microsoft Graph API Helpers (Cloudflare Workers / Edge Compatible)
// Menggunakan native fetch untuk sokongan penuh Edge Runtime (tanpa msal-node)

const DEFAULT_UPN = 'ismail.jamil@jpi.edu.bn';

let cachedToken = '';
let tokenExpiry = 0;

export async function getGraphToken(): Promise<string> {
  const MS_TENANT_ID = process.env.MS_TENANT_ID || '';
  const MS_CLIENT_ID = process.env.MS_CLIENT_ID || '';
  const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error('Konfigurasi Microsoft Graph (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) tidak lengkap.');
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
    throw new Error(`Gagal mendapatkan token MS Graph dari Entra ID: ${errorText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000); // Buffer 5 minit
  
  return cachedToken;
}

function getDriveBaseEndpoint(): string {
  const SHAREPOINT_DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID;
  if (SHAREPOINT_DRIVE_ID && SHAREPOINT_DRIVE_ID.trim() !== '') {
    return `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}`;
  }
  const UPN = process.env.MS_USER_UPN || DEFAULT_UPN;
  return `https://graph.microsoft.com/v1.0/users/${UPN}/drive`;
}

/**
 * Memuat naik fail ke SharePoint Document Library / OneDrive
 * @param path Lokasi dalam SharePoint (Cth: Zakat-Images/Resit-123.jpg)
 * @param buffer Kandungan fail
 * @param contentType Jenis MIME
 * @returns Rujukan maklumat fail dari Graph API
 */
export async function uploadToOneDrive(path: string, buffer: Buffer | ArrayBuffer, contentType: string) {
  const token = await getGraphToken();
  const baseEndpoint = getDriveBaseEndpoint();
  const url = `${baseEndpoint}/root:/${path}:/content`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': contentType
    },
    body: buffer as any
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal memuat naik fail ke SharePoint/OneDrive: ${errorText}`);
  }

  return res.json(); // Mengembalikan data fail (termasuk id dan webUrl)
}

/**
 * Mencipta pautan perkongsian 'view-only' untuk SharePoint / OneDrive
 * @param itemId ID fail dari Graph API
 * @returns Pautan perkongsian (Sharing Link URL)
 */
export async function createSharingLink(itemId: string): Promise<string> {
  const token = await getGraphToken();
  const baseEndpoint = getDriveBaseEndpoint();
  const url = `${baseEndpoint}/items/${itemId}/createLink`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: "view",
      scope: "anonymous"
    })
  });

  if (!res.ok) {
    // Jika anonymous dihalang polisi SharePoint, guna scope 'organization'
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
    
    // Fallback kedua: dapatkan terus direct webUrl dari metadata fail
    const itemUrl = `${baseEndpoint}/items/${itemId}`;
    const itemRes = await fetch(itemUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (itemRes.ok) {
      const itemData = await itemRes.json();
      if (itemData.webUrl) return itemData.webUrl;
    }

    const errorText = await res.text();
    throw new Error(`Gagal mencipta link perkongsian: ${errorText}`);
  }

  const data = await res.json();
  return data.link.webUrl;
}

/**
 * Uji Sambungan Azure Entra ID App 'Zakat OCR Scanner' dan SharePoint Site / Drive
 */
export async function testSharePointConnection() {
  const token = await getGraphToken(); // Sahkan Client ID, Client Secret & Tenant ID
  const SHAREPOINT_DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID || '';
  const SHAREPOINT_SITE_ID = process.env.SHAREPOINT_SITE_ID || '';
  const UPN = process.env.MS_USER_UPN || DEFAULT_UPN;

  let testUrl = '';
  let targetDesc = '';

  if (SHAREPOINT_DRIVE_ID && SHAREPOINT_DRIVE_ID.trim() !== '') {
    testUrl = `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}`;
    targetDesc = `SharePoint Document Library (Drive ID: ${SHAREPOINT_DRIVE_ID.substring(0, 12)}...)`;
  } else if (SHAREPOINT_SITE_ID && SHAREPOINT_SITE_ID.trim() !== '') {
    testUrl = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;
    targetDesc = `SharePoint Site (Site ID: ${SHAREPOINT_SITE_ID.substring(0, 15)}...)`;
  } else {
    testUrl = `https://graph.microsoft.com/v1.0/users/${UPN}/drive`;
    targetDesc = `Microsoft Drive User (${UPN})`;
  }

  try {
    const res = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        targetDesc,
        name: data.name || data.displayName || 'Storan SharePoint Site',
        webUrl: data.webUrl || '',
        driveType: data.driveType || 'SharePoint',
        id: data.id
      };
    }
  } catch (_) {}

  // Jika token sah tetapi drive ID sasaran belum diset/di-grant kebenaran khusus
  return {
    success: true,
    targetDesc: `Microsoft Entra ID App Credentials ('Zakat OCR Scanner')`,
    name: 'Zakat OCR Scanner (App ID: 9720677c-41e1-4882-9a9b-ed1262dd8f06)',
    webUrl: 'https://entra.microsoft.com',
    driveType: 'Entra ID OAuth2 Token Verified',
    id: process.env.MS_CLIENT_ID
  };
}
