import {
  Search, Mic, Loader2, BookMarked, LayoutDashboard, Globe, Building2, Columns2,
  Calendar, Menu, SquareUserRound, ArrowUpRight, BookmarkPlus, Check, CalendarClock,
  Plus, ShieldCheck, FileSearch, CircleX,
} from 'lucide-react'

// Every icon name used across the IPFlow design system, statically imported
// so the bundler tree-shakes the rest of lucide-react's icon set.
const ICONS = {
  search: Search,
  mic: Mic,
  'loader-2': Loader2,
  'book-marked': BookMarked,
  'layout-dashboard': LayoutDashboard,
  globe: Globe,
  'building-2': Building2,
  'columns-2': Columns2,
  calendar: Calendar,
  menu: Menu,
  'square-user-round': SquareUserRound,
  'arrow-up-right': ArrowUpRight,
  'bookmark-plus': BookmarkPlus,
  check: Check,
  'calendar-clock': CalendarClock,
  plus: Plus,
  'shield-check': ShieldCheck,
  'file-search': FileSearch,
  'circle-x': CircleX,
}

export default function Icon({ name = 'search', size = 20, color = 'currentColor', title, strokeWidth, style, ...rest }) {
  const Glyph = ICONS[name] || Search
  return (
    <Glyph
      size={size}
      color={color}
      strokeWidth={strokeWidth ?? 2}
      aria-label={title}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
      style={{ display: 'inline-block', flex: '0 0 auto', ...style }}
      {...rest}
    />
  )
}
