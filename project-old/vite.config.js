import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const getGitHubPagesBase = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }

  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    return "./";
  }

  const repositoryName = repository.split("/").at(-1);
  const isUserOrOrgPage = repositoryName?.endsWith(".github.io");

  return isUserOrOrgPage ? "/" : `/${repositoryName}/`;
};

const getManualChunk = (id) => {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("/lucide/")) {
    return "vendor-icons";
  }

  if (
    id.includes("/i18next") ||
    id.includes("/i18next-browser-languagedetector")
  ) {
    return "vendor-i18n";
  }

  if (id.includes("/minisearch/")) {
    return "vendor-search";
  }

  if (id.includes("/valibot/")) {
    return "vendor-validation";
  }

  if (id.includes("/idb/")) {
    return "vendor-storage";
  }

  return "vendor";
};

const getAssetFileName = (assetInfo) => {
  const name = assetInfo.names?.[0] ?? assetInfo.name ?? "asset";
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "asset";

  if (extension === "css") {
    return "assets/css/[name]-[hash][extname]";
  }

  if (["woff2", "woff", "ttf", "otf", "eot"].includes(extension)) {
    return "assets/fonts/[name]-[hash][extname]";
  }

  if (
    ["avif", "webp", "png", "jpg", "jpeg", "gif", "svg", "ico"].includes(
      extension,
    )
  ) {
    return "assets/images/[name]-[hash][extname]";
  }

  if (extension === "json") {
    return "assets/data/[name]-[hash][extname]";
  }

  return "assets/[name]-[hash][extname]";
};

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  return {
    base: getGitHubPagesBase(),
    plugins: [tailwindcss()],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    json: {
      stringify: true,
    },

    worker: {
      format: "es",
      rollupOptions: {
        output: {
          entryFileNames: "assets/workers/[name]-[hash].js",
        },
      },
    },

    build: {
      target: "es2022",
      cssTarget: "chrome107",
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      emptyOutDir: true,
      cssCodeSplit: true,
      modulePreload: {
        polyfill: false,
      },
      assetsInlineLimit: 2048,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        treeshake: {
          preset: "smallest",
          correctVarValueBeforeDeclaration: true,
        },
        output: {
          compact: true,
          entryFileNames: "assets/js/[name]-[hash].js",
          chunkFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: getAssetFileName,
          manualChunks: getManualChunk,
        },
      },
    },

    esbuild: {
      legalComments: "none",
      drop: isBuild ? ["console", "debugger"] : [],
      treeShaking: true,
    },
  };
});
