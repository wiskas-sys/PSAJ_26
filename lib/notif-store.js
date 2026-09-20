const NOTIF_KEY = 'dian-motor-unread';
const NOTIF_EVENT = 'dian-motor:unread';

export function getUnread() {
    try { return Math.max(0, Number(window.localStorage.getItem(NOTIF_KEY)) || 0); }
    catch { return 0; }
}

export function setUnread(count) {
    try {
        window.localStorage.setItem(NOTIF_KEY, String(Math.max(0, Number(count) || 0)));
        window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
    }
    catch {}
}

export function subscribeUnread(listener) {
    const onEvent = () => listener(getUnread());
    onEvent();
    window.addEventListener(NOTIF_EVENT, onEvent);
    return () => window.removeEventListener(NOTIF_EVENT, onEvent);
}