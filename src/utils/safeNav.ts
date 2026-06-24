import { Base64 } from 'js-base64';

export const safeNav = (url: string) => {
  if (window.location.pathname !== url) {
    window.location.href = url;
  }
};

export const safeToLogin = () => {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  safeNav(`/login?next=${next}`);
};

export const getNextUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const next = searchParams.get('next');
  if (next) {
    return `${window.location.origin}?next=${Base64.encode(next)}`;
  }
  return `${window.location.origin}?next=${Base64.encode('/')}`;
};
