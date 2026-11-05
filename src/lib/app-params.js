const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
    !isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
    if (!isNode) {
        window.localStorage.removeItem('admin_token');
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('rk_token');
    }
};

const getAccessToken = () => {
    if (isNode) return null;
    return window.localStorage.getItem('token') || window.localStorage.getItem('rk_token') || null;
};

const getAppParams = () => {
    if (isClearAccessTokenRequested()) {
        clearStoredAccessToken();
    }
    return {
        appId: 'rk-printers-backend',
        token: getAccessToken(),
        functionsVersion: '1.0.0',
        appBaseUrl: isNode ? '' : window.location.origin,
    };
};

export const appParams = {
    ...getAppParams(),
    getAccessToken,
};
