// Microsoft Graph API Helpers (Cloudflare Workers / Edge Compatible)
// Menggunakan native fetch untuk sokongan penuh Edge Runtime (tanpa msal-node)

const DEFAULT_TENANT_ID = '47020947-65c5-427e-be88-fdc455f97b89';
const DEFAULT_CLIENT_ID = '9720677c-41e1-4882-9a9b-ed1262dd8f06';

// SharePoint Site: EZakat OCR Scanner (jpibrunei.sharepoint.com/sites/EZakatOCRScanner)
const DEFAULT_SHAREPOINT_SITE_ID = 'jpibrunei.sharepoint.com,1fa0ce81-c3af-4f98-b753-15fa5834c4e7,1ea40027-da4f-4631-9baf-8ee311adc519';
const DEFAULT_SHAREPOINT_DRIVE_ID = 'b!gc6gH6_DmE-3UxX6WDTE5ycApB5P2jFGm6-O4xGtxRl6_McPzCoeS7A2m-3joIjh';

let cachedToken = '';
let tokenExpiry = 0;

export async function getGraphToken(): Promise<string> {
  const MS_TENANT_ID = process.env.MS_TENANT_ID || DEFAULT_TENANT_ID;
  const MS_CLIENT_ID = process.env.MS_CLIENT_ID || DEFAULT_CLIENT_ID;
  const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error('Konfigurasi Microsoft Graph (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) tidak lengkap dalam pembolehubah persekitaran (Cloudflare Environment Variables).');
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
  const SHAREPOINT_DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID || DEFAULT_SHAREPOINT_DRIVE_ID;
  return `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}`;
}

/**
 * Memuat naik fail fizikal (Gambar / PDF) terus ke SharePoint Site Document Library
 * @param path Lokasi dalam SharePoint Documents (Cth: Zakat-Images/CS004008/Utama-CS004008.jpg)
 * @param buffer Kandungan fail (Uint8Array / ArrayBuffer)
 * @param contentType Jenis MIME (image/jpeg, application/pdf)
 * @returns Rujukan data fail dari Graph API (termasuk webUrl)
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
    throw new Error(`Gagal memuat naik fail ke SharePoint Document Library: ${errorText}`);
  }

  return res.json(); // Mengembalikan data fail (termasuk id dan webUrl)
}

/**
 * Mencipta pautan perkongsian 'view-only' untuk SharePoint Document Library
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
      scope: "organization"
    })
  });

  if (!res.ok) {
    // Direct fallback: dapatkan terus webUrl asal dari item SharePoint
    const itemUrl = `${baseEndpoint}/items/${itemId}`;
    const itemRes = await fetch(itemUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (itemRes.ok) {
      const itemData = await itemRes.json();
      if (itemData.webUrl) return itemData.webUrl;
    }

    const errorText = await res.text();
    throw new Error(`Gagal mencipta link perkongsian SharePoint: ${errorText}`);
  }

  const data = await res.json();
  return data.link?.webUrl || data.webUrl;
}

/**
 * Uji Sambungan Azure Entra ID App 'Zakat OCR Scanner' dan SharePoint Site Document Library
 */
export async function testSharePointConnection() {
  const token = await getGraphToken();
  const SHAREPOINT_DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID || DEFAULT_SHAREPOINT_DRIVE_ID;
  const testUrl = `https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}`;

  const res = await fetch(testUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Pengesahan Entra ID Berjaya, tetapi sasaran SharePoint Document Library (${SHAREPOINT_DRIVE_ID}) gagal diakses (HTTP ${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    success: true,
    targetDesc: `SharePoint Document Library (EZakat OCR Scanner)`,
    name: `${data.name || 'Documents'} (${data.owner?.group?.displayName || 'EZakat OCR Scanner'})`,
    webUrl: data.webUrl || 'https://jpibrunei.sharepoint.com/sites/EZakatOCRScanner/Shared%20Documents',
    driveType: data.driveType || 'documentLibrary',
    id: data.id
  };
}
