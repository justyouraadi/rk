import React, { useState, useEffect } from 'react';

/**
 * Drop-in adapter for react-router-dom in Astro.
 * Converts <Link to="..."> to standard HTML <a href="..."> with full accessibility and styling.
 */
export function Link({ to, href, className, children, onClick, ...props }) {
    const destination = to || href || '#';
    return (
        <a href={destination} className={className} onClick={onClick} {...props}>
            {children}
        </a>
    );
}

export function NavLink({ to, href, className, children, onClick, ...props }) {
    return <Link to={to} href={href} className={className} onClick={onClick} {...props}>{children}</Link>;
}

export function useLocation() {
    const [location, setLocation] = useState({
        pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: typeof window !== 'undefined' ? window.location.hash : ''
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const update = () => {
                setLocation({
                    pathname: window.location.pathname,
                    search: window.location.search,
                    hash: window.location.hash
                });
            };
            update();
            window.addEventListener('popstate', update);
            return () => window.removeEventListener('popstate', update);
        }
    }, []);

    return location;
}

export function useNavigate() {
    return (to, options) => {
        if (typeof window !== 'undefined') {
            if (options?.replace) {
                window.location.replace(to);
            } else {
                window.location.href = to;
            }
        }
    };
}

export function useParams() {
    return {};
}

export function useSearchParams() {
    const [searchParams, setSearchParams] = useState(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search);
        }
        return new URLSearchParams();
    });

    const updateParams = (newParams) => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.search = newParams.toString();
            window.history.pushState({}, '', url);
            setSearchParams(new URLSearchParams(url.search));
        }
    };

    return [searchParams, updateParams];
}

export function Outlet() {
    return null;
}

export function useOutlet() {
    return null;
}

export function useNavigationType() {
    return 'PUSH';
}

export function useHref(to) {
    return to || '#';
}

export function useResolvedPath(to) {
    return { pathname: to || '/', search: '', hash: '' };
}

export function useMatch() {
    return null;
}

export function Navigate({ to, replace }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (replace) window.location.replace(to);
            else window.location.href = to;
        }
    }, [to, replace]);
    return null;
}

export default {
    Link,
    NavLink,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
    useNavigationType,
    useOutlet,
    useHref,
    useResolvedPath,
    useMatch,
    Outlet,
    Navigate
};

