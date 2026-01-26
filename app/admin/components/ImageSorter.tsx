"use client";

import React from "react";

type Props = {
  images: string[];
  onChange: (next: string[]) => void;
};

function moveItem(arr: string[], from: number, to: number) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function ImageSorter({ images, onChange }: Props) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/80">Images (drag to reorder)</p>

        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-white/60 hover:text-white"
        >
          Clear
        </button>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          No images yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === i) return;
                onChange(moveItem(images, dragIndex, i));
                setDragIndex(null);
              }}
              className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />

              <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white">
                {i + 1}
              </div>

              <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="flex-1 rounded-lg bg-black/55 px-2 py-2 text-xs text-white hover:bg-black/70"
                >
                  Remove
                </button>

                <button
                  type="button"
                  onClick={() => i > 0 && onChange(moveItem(images, i, i - 1))}
                  className="rounded-lg bg-black/55 px-2 py-2 text-xs text-white hover:bg-black/70"
                  title="Move up"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => i < images.length - 1 && onChange(moveItem(images, i, i + 1))}
                  className="rounded-lg bg-black/55 px-2 py-2 text-xs text-white hover:bg-black/70"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
