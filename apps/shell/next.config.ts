import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Raíz en /apps para poder resolver recursos compartidos (apps/lagu-sans)
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
