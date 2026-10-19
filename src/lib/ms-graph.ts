// Microsoft Graph API Helpers for SharePoint Document Library & Lists
// Direct native fetch - edge and server compatible, lightweight, zero dependencies

const DEFAULT_TENANT_ID = process.env.MS_TENANT_ID || '47020947-65c5-427e-be88-fdc455f97b89';
const DEFAULT_CLIENT_ID = process.env.MS_CLIENT_ID || '9720677c-41e1-4882-9a9b-ed1262dd8f06';
const DEFAULT_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';
const DEFAULT_SITE_ID = process.env.SHAREPOINT_SITE_ID || 'jpibrunei.sharepoint.com,1fa0ce81-c3af-4f98-b753-15fa5834c4e7,1ea40027-da4f-4631-9baf-8ee311adc519';
const DEFAULT_DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID || 'b!gc6gH6_DmE-3UxX6WDTE5ycApB5P2jFGm6-O4xGtxRl6_McPzCoeS7A2m-3joIjh';

let cachedToken = '';
let tokenExpiry = 0;

export async function getGraphToken(): Promise<string> {
  const MS_TENANT_ID = process.env.MS_TENANT_ID || DEFAULT_TENANT_ID;
  const MS_CLIENT_ID = process.env.MS_CLIENT_ID || DEFAULT_CLIENT_ID;
  const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gagal mendapatkan token MS Graph (HTTP ${res.status}): ${errorText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
    return cachedToken;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getSharePointSiteId(): string {
  return process.env.SHAREPOINT_SITE_ID || DEFAULT_SITE_ID;
}

export function getSharePointDriveId(): string {
  return process.env.SHAREPOINT_DRIVE_ID || DEFAULT_DRIVE_ID;
}

export function getDriveBaseEndpoint(): string {
  const driveId = getSharePointDriveId();
  return `https://graph.microsoft.com/v1.0/drives/${driveId}`;
}

/**
 * Muat naik fail fizikal (Gambar resit) ke SharePoint Document Library
 */
export async function uploadToOneDrive(
  path: string, 
  buffer: Buffer | ArrayBuffer, 
  contentType: string
) {
  const token = await getGraphToken();
  const baseEndpoint = getDriveBaseEndpoint();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${baseEndpoint}/root:/${cleanPath}:/content`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType
      },
      body: buffer as any,
      signal: controller.signal
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gagal memuat naik fail ke SharePoint (HTTP ${res.status}): ${errorText}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Cipta pautan perkongsian 'view' untuk fail di SharePoint Document Library
 */
export async function createSharingLink(itemId: string): Promise<string> {
  const token = await getGraphToken();
  const baseEndpoint = getDriveBaseEndpoint();
  const url = `${baseEndpoint}/items/${itemId}/createLink`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'view',
        scope: 'organization'
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      // Fallback: cuba dapatkan webUrl asal terus dari item
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
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Uji sambungan ke Microsoft Graph dan SharePoint
 */
export async function testSharePointConnection() {
  const token = await getGraphToken();
  const driveId = getSharePointDriveId();
  const siteId = getSharePointSiteId();

  const [driveRes, siteRes] = await Promise.all([
    fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  ]);

  if (!driveRes.ok || !siteRes.ok) {
    throw new Error('Gagal menyambung ke SharePoint Drive atau Site');
  }

  const [driveData, siteData] = await Promise.all([driveRes.json(), siteRes.json()]);

  return {
    success: true,
    siteName: siteData.displayName || 'EZakat OCR Scanner',
    siteUrl: siteData.webUrl,
    driveName: driveData.name,
    driveType: driveData.driveType
  };
}
