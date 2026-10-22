/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // database drivers load their own files (WASM, native bits), so keep them out of the bundle
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
      ]
    }];
  }
};
export default nextConfig;
