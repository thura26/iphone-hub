import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ShoppingBag,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductGallery({ images = [], alt = 'Product', activeImage, className }) {
  const gallery = useMemo(
    () => (images.length > 0 ? images : [activeImage].filter(Boolean)),
    [images, activeImage],
  )
  const [selected, setSelected] = useState(activeImage || gallery[0])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    if (activeImage) setSelected(activeImage)
  }, [activeImage])

  useEffect(() => {
    if (!selected && gallery[0]) setSelected(gallery[0])
  }, [gallery, selected])

  useEffect(() => {
    if (!lightboxOpen) return undefined

    setZoomed(false)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') {
        setLightboxIndex((current) => (current + 1) % gallery.length)
        setZoomed(false)
      }
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) => (current - 1 + gallery.length) % gallery.length)
        setZoomed(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, gallery.length])

  const openLightbox = (image) => {
    const index = Math.max(0, gallery.indexOf(image))
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const step = (direction) => {
    if (gallery.length < 2) return
    setLightboxIndex(
      (current) => (current + direction + gallery.length) % gallery.length,
    )
    setZoomed(false)
  }

  const currentImage = gallery[lightboxIndex] || selected

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={() => selected && openLightbox(selected)}
        className="group relative aspect-square overflow-hidden rounded-card border border-line bg-soft text-left"
        aria-label="Open full-screen image viewer"
      >
        {selected ? (
          <>
            <img
              src={selected}
              alt={alt}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105 sm:p-12"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-pill border border-line/80 bg-surface/90 px-2.5 py-1.5 text-[10px] font-semibold text-muted backdrop-blur transition-colors group-hover:text-ink">
              <Maximize2 size={11} />
              Click to zoom
            </span>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ShoppingBag className="h-14 w-14" />
          </div>
        )}
      </button>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {gallery.map((image) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelected(image)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-soft transition-colors sm:h-20 sm:w-20',
                selected === image ? 'border-ink' : 'border-line hover:border-ink/30',
              )}
              aria-label="View image"
              aria-pressed={selected === image}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && currentImage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false)
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
            <p className="truncate text-xs font-medium text-white/70">
              {alt}
              <span className="ml-2 text-white/40">
                {lightboxIndex + 1} / {gallery.length}
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomed((current) => !current)}
                className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close image viewer"
              >
                <X size={21} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto overscroll-contain px-4 pb-2">
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:left-5"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <img
              src={currentImage}
              alt={`${alt} — image ${lightboxIndex + 1}`}
              onClick={() => setZoomed((current) => !current)}
              className={cn(
                'max-h-full max-w-full object-contain transition-transform duration-300',
                zoomed
                  ? 'scale-[1.75] cursor-zoom-out sm:scale-[2.1]'
                  : 'cursor-zoom-in',
              )}
              loading="eager"
              decoding="async"
            />
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={() => step(1)}
                className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:right-5"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex shrink-0 justify-center gap-2 px-4 py-4">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    setLightboxIndex(index)
                    setZoomed(false)
                  }}
                  className={cn(
                    'h-12 w-12 overflow-hidden rounded-lg border bg-white/5 transition-all sm:h-14 sm:w-14',
                    index === lightboxIndex
                      ? 'border-white opacity-100'
                      : 'border-white/20 opacity-55 hover:opacity-90',
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
