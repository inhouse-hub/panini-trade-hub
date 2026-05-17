'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { FilterType } from '@/lib/types'
import { useUser } from '@/lib/user-context'
import { SectionCard } from './section-card'
import { cn } from '@/lib/utils'

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'missing', label: 'Con faltantes' },
  { value: 'repeated', label: 'Con repetidas' },
  { value: 'complete', label: 'Completos' },
  { value: 'unmarked', label: 'Sin revisar' },
]

export function AlbumView() {
  const { activeUserAlbum } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const filteredSections = useMemo(() => {
    if (!activeUserAlbum) return ALBUM_SECTIONS

    return ALBUM_SECTIONS.filter(section => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        section.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Status filter
      if (filter === 'all') return true

      const sectionData = activeUserAlbum[section.code] || {}
      let hasCount = 0
      let repeatedCount = 0
      let missingCount = 0
      let unmarkedCount = 0

      for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
        const sticker = sectionData[i.toString()]
        if (!sticker || sticker.state === 'unmarked') unmarkedCount++
        else if (sticker.state === 'has') {
          hasCount++
          if (sticker.count >= 2) repeatedCount++
        }
        else if (sticker.state === 'missing') missingCount++
      }

      const isComplete = hasCount === section.stickerCount && missingCount === 0

      switch (filter) {
        case 'missing':
          return missingCount > 0
        case 'repeated':
          return repeatedCount > 0
        case 'complete':
          return isComplete
        case 'unmarked':
          return unmarkedCount === section.stickerCount
        default:
          return true
      }
    })
  }, [activeUserAlbum, searchQuery, filter])

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm hover:bg-muted/50 transition-colors min-w-[140px]"
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span>{FILTER_OPTIONS.find(f => f.value === filter)?.label}</span>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground ml-auto transition-transform',
              showFilterDropdown && 'rotate-180'
            )} />
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => { setFilter(option.value); setShowFilterDropdown(false) }}
                  className={cn(
                    'w-full px-4 py-2 text-sm text-left hover:bg-muted/50 transition-colors',
                    filter === option.value && 'bg-gold/10 text-gold'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredSections.length} de {ALBUM_SECTIONS.length} secciones
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {filteredSections.map(section => (
          <SectionCard key={section.code} section={section} />
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron secciones con los filtros actuales
          </div>
        )}
      </div>
    </div>
  )
}