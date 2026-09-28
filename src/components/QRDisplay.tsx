'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function QRDisplay({ url }: { url: string }) {
  const [currentUrl, setCurrentUrl] = useState(url);

  useEffect(() => {
    if (!url) {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  if (!currentUrl) return null;

  return (
    <QRCodeSVG 
      value={currentUrl} 
      size={100}
      level="H"
      includeMargin={true}
      fgColor="#0f172a"
    />
  );
}
