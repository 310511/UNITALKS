import React, { useEffect, useRef } from 'react';

const ThirdPartyAd = ({ containerId, scriptSrc, width = '100%', height = 600 }) => {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const iframe = document.createElement('iframe');
    iframe.title = 'ad-frame';
    iframe.style.width = typeof width === 'number' ? `${width}px` : width;
    iframe.style.height = typeof height === 'number' ? `${height}px` : height;
    iframe.style.border = '0';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    hostRef.current.innerHTML = '';
    hostRef.current.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      return undefined;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body style="margin:0;padding:0;">
<script async data-cfasync="false" src="${scriptSrc}"></script>
<div id="${containerId}"></div>
</body></html>`;
    doc.open();
    doc.write(html);
    doc.close();

    return () => {
      try {
        hostRef.current && (hostRef.current.innerHTML = '');
      } catch (_) {
        // ignore
      }
    };
  }, [containerId, scriptSrc, width, height]);

  return <div ref={hostRef} />;
};

export default ThirdPartyAd;


