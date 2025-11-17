import { Plugin } from 'vite';

interface FrappeVitePluginOptions {
  port?: number;
}

export default function frappeVitePlugin(options?: FrappeVitePluginOptions): Plugin;
