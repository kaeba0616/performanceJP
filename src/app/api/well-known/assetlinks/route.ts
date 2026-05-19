import { NextResponse } from "next/server";

// Served at /.well-known/assetlinks.json via rewrite in next.config.ts
// Google verifies this file when the user opens the TWA so that links to
// jpop.ernebi.org open inside the app instead of the browser.
//
// Env:
//   TWA_PACKAGE_NAME           — e.g. "org.ernebi.jpop"
//   TWA_SHA256_FINGERPRINTS    — comma-separated SHA-256 fingerprints from the
//                                signing keystore (release + optional upload).
//                                Bubblewrap prints these after `build`.

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME;
  const fingerprintsRaw = process.env.TWA_SHA256_FINGERPRINTS || "";
  const fingerprints = fingerprintsRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (!packageName || fingerprints.length === 0) {
    return NextResponse.json(
      {
        error:
          "assetlinks not configured. Set TWA_PACKAGE_NAME and TWA_SHA256_FINGERPRINTS.",
      },
      { status: 503 },
    );
  }

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
