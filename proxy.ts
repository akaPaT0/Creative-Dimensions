// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|webp|ico|txt|map|woff|woff2|ttf|eot)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
