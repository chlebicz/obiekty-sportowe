import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
