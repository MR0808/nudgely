// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
    const url = req.nextUrl;
    const pathname = url.pathname;

    const res = NextResponse.next();

    // Expose pathname to server components via headers()
    res.headers.set('x-pathname', pathname);

    return res;
}

export const config = {
    // Run on all "app" routes, skip assets, api and static files
    matcher: ['/((?!_next/|api/|static/|.*\\..*).*)']
};
