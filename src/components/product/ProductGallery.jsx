import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductGallery({ images = [], alt = 'Product', activeImage, className }) {
  const gallery = images.length > 0 ? images : [activeImage].filter(Boolean)
  const [selected, setSelected] = useState(activeImage || gallery[0])

  useEffect(() => {
    if (activeImage) setSelected(activeImage)
  }, [activeImage])

  useEffect(() => {
    if (!selected && gallery[0]) setSelected(gallery[0])
  }, [gallery, selected])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative aspect-square overflow-hidden rounded-card border border-line bg-soft">
        {selected ? (
          <img
            src={selected}
            alt={alt}
            className="h-full w-full object-contain p-8 transition-transform duration-500 hover:scale-105 sm:p-12"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ShoppingBag className="h-14 w-14" />
          </div>
        )}
      </div>

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
              aria-label={`View image`}
            >
              <img src={image} alt="" className="h-full w-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
