/* This is a middleware for handling API requests
    * It can be used to add authentication, logging, etc.
    * Currently, it just passes the request to the next handler.
    * You can expand this as needed.
    * The middleware is applied to all API routes.
    * This middleware is applied to all frontend routes as well.
    * Author: Krishna Prajapati
    * Date: 2023-10-05
    */

import { NextResponse } from 'next/server';
export async function middleware(request) {
    console.log("Middleware executed for: ", request.url);
    const { pathname } = request.nextUrl;

    const allowedPaths = ['/api/signIn', '/api/signUp', '/api/signOut', '/api/tokenverify', '/api/contacts','/api/webhooks/facebook', '/api/run_bot'];
    const allowedPathsUI = ['/join-with-us','/'];

    const headers = new Headers(request.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
        return NextResponse.json(null, { status: 200, headers });
    }

    // Allow specific paths without authentication
    if (allowedPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next({ request: { headers } });
    }

    // Handle API requests requiring Bearer token authorization
    if (pathname.startsWith('/api')) {
        const cookie = request.headers.get('cookie') || '';
        console.log("Coookiee data:: ",cookie)
        const tokenCookie = cookie.split('; ').find(c => c.startsWith('token='));

        if (!tokenCookie) {
        return NextResponse.json({ status: 'Unauthorized' }, { status: 401, headers});
        }

        const token = tokenCookie.split('=')[1];

        try {
            const response = await fetch(`${request.nextUrl.origin}/api/tokenverify`, {
                method: 'GET',
                headers: { authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                return NextResponse.next({ request: { headers } });
            } else {
                return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
            }
        } catch (error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // Check authentication for UI routes
    if (!(allowedPathsUI.some(path => pathname.startsWith(path)) && pathname == '/')) {
        const token = request.cookies.get('token');
        console.log("Token found: ", token);
        if (!token) {
            // Prevent redirection loop by checking if user is already on the login page
            if (pathname !== '/join-with-us') {
                return NextResponse.redirect(new URL('/join-with-us?mode=login', request.url));
            }
            return NextResponse.next();
        }

        try {
            // Verify the token by calling the /api/tokenverify endpoint
            console.log("Verifying token with /api/tokenverify");
            const verifyResponse = await fetch(`${request.nextUrl.origin}/api/tokenverify`, {
                method: 'GET',
                headers: { authorization: `Bearer ${token.value}` },
            });
            const decoded = await verifyResponse.json();
            if (verifyResponse.status === 200) {
                // Redirect based on user type if not already on the respective dashboard
                if (decoded.type === 'Admin' && pathname !== '/admin/dashboard') {
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                } 
                // else if (decoded.type === 'User' && pathname !== '/dashboard') {
                //     return NextResponse.redirect(new URL('/dashboard', request.url));
                // }
            } else {
                // Redirect to login if verification fails
                if (pathname !== '/join-with-us') {
                    return NextResponse.redirect(new URL('/join-with-us?mode=login', request.url));
                }
            }
        } catch (error) {
            // Redirect to login if token verification fails due to error
            if (pathname !== '/join-with-us') {
                return NextResponse.redirect(new URL('/join-with-us?mode=login', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/user-dashboard/:path*', ],
};
