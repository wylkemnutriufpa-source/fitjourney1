// AvatarCropDialog — modal de crop com arrastar + zoom usando react-easy-crop.
// Recebe um File, devolve um Blob JPEG quadrado.

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, X } from "lucide-react";

type Props = {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
};

async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const size = Math.min(area.width, area.height);
  const canvas = document.createElement("canvas");
  const out = 512;
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(image, area.x, area.y, size, size, 0, 0, out, out);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
      "image/jpeg",
      0.9,
    );
  });
}

export function AvatarCropDialog({ file, open, onClose, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area);
      await onConfirm(blob);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Ajustar foto</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" disabled={busy}>
            <X className="size-4" />
          </button>
        </div>
        <div className="relative w-full bg-black" style={{ height: 320 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3 space-y-3">
          <label className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="text-xs font-semibold py-2 px-3 rounded-md border border-border hover:border-primary/40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy || !area}
              className="text-xs font-semibold py-2 px-3 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
