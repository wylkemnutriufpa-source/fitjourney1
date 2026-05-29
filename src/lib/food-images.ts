// Auto-mapped food image bank (Vite glob import — bundled, hashed URLs)
const modules = import.meta.glob("@/assets/foods/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const foodImages: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const key = path.split("/").pop()!.replace(/\.jpg$/, "");
    return [key, url];
  }),
);

export const allFoodKeys = Object.keys(foodImages).sort();

/** Resolve image by exact key, fallback to first match by prefix, else placeholder */
export function imgFor(key: string): string | undefined {
  if (foodImages[key]) return foodImages[key];
  const prefix = key.toLowerCase();
  const match = allFoodKeys.find((k) => k.startsWith(prefix));
  return match ? foodImages[match] : undefined;
}
