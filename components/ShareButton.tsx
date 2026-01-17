'use client';

import { useState } from 'react';

const SHARE_RESET_DELAY = 2000;

export default function ShareButton() {
  const [label, setLabel] = useState('Share');

  const handleShare = async () => {
    const url = typeof window === 'undefined' ? '' : window.location.href;
    const payload = {
      title: 'Dubai Cookie Dash',
      text: 'Dubai Cookie Dash - 8-bit Arcade Runner',
      url
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setLabel('Shared!');
        window.setTimeout(() => setLabel('Share'), SHARE_RESET_DELAY);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setLabel('Copied!');
        window.setTimeout(() => setLabel('Share'), SHARE_RESET_DELAY);
        return;
      }

      window.prompt('Copy this link', url);
    } catch (error) {
      console.error('Share failed', error);
    }
  };

  return (
    <button type="button" className="share-button" onClick={handleShare}>
      {label}
    </button>
  );
}
