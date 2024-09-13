/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
              protocol: 'https',
              hostname: '1000logos.net',
              port: '',
            },
        ]
    }
};

export default nextConfig;
