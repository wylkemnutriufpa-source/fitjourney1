const AVATAR_BUCKET = "avatars";
const AVATAR_URL_MARKERS = [
  "/storage/v1/object/public/avatars/",
  "/storage/v1/object/sign/avatars/",
  "/object/public/avatars/",
  "/object/sign/avatars/",
];

type StorageSigner = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function isSafeAvatarPath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 512 &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    /^[A-Za-z0-9._\-/]+$/.test(path)
  );
}

export function getAvatarStoragePath(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  if (raw.startsWith(`${AVATAR_BUCKET}/`)) {
    const withoutBucket = raw.slice(AVATAR_BUCKET.length + 1);
    return isSafeAvatarPath(withoutBucket) ? withoutBucket : null;
  }

  if (!/^https?:\/\//i.test(raw)) {
    return isSafeAvatarPath(raw) ? raw : null;
  }

  try {
    const url = new URL(raw);
    const pathname = decodeURIComponent(url.pathname);
    for (const marker of AVATAR_URL_MARKERS) {
      const idx = pathname.indexOf(marker);
      if (idx >= 0) {
        const path = pathname.slice(idx + marker.length);
        return isSafeAvatarPath(path) ? path : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isAvatarStorageReference(value: string) {
  return getAvatarStoragePath(value) !== null;
}

export async function createAvatarSignedUrl(
  client: StorageSigner,
  value: string | null | undefined,
  expiresIn = 60 * 60,
) {
  const path = getAvatarStoragePath(value);
  if (!path) return null;

  const { data, error } = await client.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data?.signedUrl ?? null;
}