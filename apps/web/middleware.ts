import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import appConfig from "@/lib/config";

// TEMP: debug env var availability on Amplify edge runtime
console.log("[middleware] CLERK_SECRET_KEY present:", !!process.env.CLERK_SECRET_KEY);
console.log("[middleware] config.clerkSecretKey present:", !!appConfig.clerkSecretKey);
console.log("[middleware] config.clerkPublishableKey present:", !!appConfig.clerkPublishableKey);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
}, { publishableKey: appConfig.clerkPublishableKey, secretKey: appConfig.clerkSecretKey });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
