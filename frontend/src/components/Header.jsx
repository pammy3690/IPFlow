import { BookMarked } from 'lucide-react'

export default function Header() {
  return (
    <div className="header">
      <BookMarked className="header__icon" strokeWidth={1.5} />
      <h1 className="header__title">IPFLOW</h1>
    </div>
  )
}
