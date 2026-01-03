// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/main.css"],
  modules: ["nuxt-lucide-icons"],
  ssr: true,
  nitro: {
    preset: "static",
  },
  app: {
    baseURL: "./",
    buildAssetsDir: "/_nuxt/",
  },
});
