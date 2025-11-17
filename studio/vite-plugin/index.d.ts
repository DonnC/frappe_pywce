import { Plugin } from 'vite';

interface FrappeVitePluginOptions {
  port?: number;
  appName?: string;
  prefixEndpoint?: string;
}

export default function frappeVitePlugin(options?: FrappeVitePluginOptions): Plugin;
