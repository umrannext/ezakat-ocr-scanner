import { NextResponse } from 'next/server';
import { getGraphToken } from '@/lib/ms-graph';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const link = searchParams.get('url');

    if (!link) {
      return new NextResponse('URL parameter is missing', { status: 400 });
    }

    // Convert Sharing URL to Graph API Share ID
    const base64Value = Buffer.from(link).toString('base64');
    const encodedUrl = base64Value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const shareId = `u!${encodedUrl}`;

    const token = await getGraphToken();
    const graphUrl = `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/thumbnails/0/small/content`;

    const res = await fetch(graphUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      redirect: 'follow'
    });

    if (!res.ok) {
      // Fallback: cuba dapatkan fail asal terus
      const contentUrl = `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/content`;
      const fallbackRes = await fetch(contentUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
        redirect: 'follow'
      });
      
      if (!fallbackRes.ok) {
        throw new Error(`Graph API failed with status ${fallbackRes.status}`);
      }
      
      const imageBuffer = await fallbackRes.arrayBuffer();
      const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
      
      const response = new NextResponse(imageBuffer);
      response.headers.set('Content-Type', contentType);
      response.headers.set('Cache-Control', 'public, max-age=86400');
      return response;
    }

    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    const response = new NextResponse(imageBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return response;
  } catch (error) {
    console.warn('Thumbnail proxy notice:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
