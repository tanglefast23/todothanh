import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thanh To Do",
    short_name: "Thanh To Do",
    description: "Manage tasks and track expenses together",
    start_url: "/calendar",
    scope: "/",
    display: "standalone",
    background_color: "#fef5ee",
    theme_color: "#fb923c",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
