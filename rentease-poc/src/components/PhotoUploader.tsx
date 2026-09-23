import { useRef, useState, type DragEvent } from 'react';
import { Button } from './ui/Button';
import { IconClose, IconPlus, IconStar } from './icons';
import {
  ACCEPT,
  MAX_PHOTOS,
  MAX_TOTAL_BYTES,
  ingestPhotos,
  prettyBytes,
  totalBytes,
} from '../lib/photos';
import { cx } from '../lib/format';

/**
 * Multi-photo picker for a listing. Drop or browse, reorder by promoting any
 * shot to cover, remove individually. Files are scaled and re-encoded on the
 * way in — see `lib/photos.ts` for why.
 */
export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const full = photos.length >= MAX_PHOTOS;
  const used = totalBytes(photos);

  async function accept(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setBusy(true);
    setNotes([]);
    try {
      const { photos: next, skipped } = await ingestPhotos(photos, list);
      onChange(next);
      setNotes(skipped);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void accept(e.dataTransfer.files);
  }

  const remove = (i: number) => onChange(photos.filter((_, n) => n !== i));

  /** Promote to cover — the first photo is what every card and search result shows. */
  const makeCover = (i: number) =>
    onChange([photos[i], ...photos.filter((_, n) => n !== i)]);

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          'flex flex-col items-center gap-2 rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors',
          dragging ? 'border-green bg-green-soft' : 'border-green-line bg-[#F7F9F5]',
          full && 'opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ACCEPT}
          multiple
          disabled={full || busy}
          onChange={(e) => {
            void accept(e.target.files);
            // Reset so picking the same file twice still fires a change.
            e.target.value = '';
          }}
        />
        <p className="m-0 text-[13.5px] font-medium text-ink">
          {busy ? 'Processing photos…' : 'Drag photos of the home here'}
        </p>
        <p className="m-0 text-[12.5px] text-muted">
          Renters see these first — lead with the hall, then each room.
        </p>
        <p className="m-0 text-[12.5px] text-muted">
          JPG, PNG or WebP · up to {MAX_PHOTOS} photos · {prettyBytes(used)} of{' '}
          {prettyBytes(MAX_TOTAL_BYTES)} used
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="mt-1"
          disabled={full || busy}
          onClick={() => inputRef.current?.click()}
        >
          <IconPlus />
          {photos.length === 0 ? 'Choose photos' : 'Add more'}
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 rounded-[10px] border border-[#E6C3AB] bg-rented-soft px-3 py-2 p-0">
          {notes.map((n) => (
            <li key={n} className="text-[12.5px] font-medium text-rented">
              {n}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <>
          <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0 sm:grid-cols-4">
            {photos.map((src, i) => (
              <li
                key={src.slice(-40) + i}
                className="group relative aspect-[4/3] overflow-hidden rounded-[10px] border border-line bg-green-soft"
              >
                <img
                  src={src}
                  alt={i === 0 ? 'Cover photo' : `Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />

                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-honey px-1.5 py-0.5 text-[10.5px] font-bold text-[#2A1B04]">
                    <IconStar className="h-2.5 w-2.5" />
                    Cover
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1.5 right-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full border-0 bg-black/55 text-white hover:bg-rented"
                >
                  <IconClose className="h-3 w-3" />
                </button>

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="absolute inset-x-0 bottom-0 cursor-pointer border-0 bg-black/55 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    Make cover
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="m-0 text-[12px] text-muted">
            The cover photo leads every search result and listing card. The floor plan stays on the
            listing either way.
          </p>
        </>
      )}
    </div>
  );
}
