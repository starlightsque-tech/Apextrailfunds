'use client';

import Script from 'next/script';

/**
 * Tawk.to live chat.
 * Property id is configurable so a staging environment can point elsewhere.
 */
export default function TawkWidget() {
  const property = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '6af50a019d9ba43c443be7ac';
  const widget = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1k76iu5hr';

  return (
    <Script id="tawk-to" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
        (function () {
          var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = 'https://embed.tawk.to/${property}/${widget}';
          s1.charset = 'UTF-8';
          s1.setAttribute('crossorigin', '*');
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
