import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Clerk middleware — gates /console routes behind authentication.
 *
 * Marketing site (everything else: /, /walkthrough, /protocol, etc.)
 * remains public. The JWKS endpoint /api/jwks.json is also public
 * since it serves only public keys.
 */
const isConsoleRoute = createRouteMatcher([
  '/console(.*)',
  '/api/cp(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isConsoleRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
