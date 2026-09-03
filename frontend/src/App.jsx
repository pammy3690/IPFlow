import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import { usePatentsOverview } from './hooks/usePatentsOverview'
import { useSavedPatents } from './hooks/useSavedPatents'
import { useSavedPatentDetails } from './hooks/useSavedPatentDetails'
import WaveBackground from './design-system/WaveBackground.jsx'
import Sidebar from './design-system/Sidebar.jsx'
import TopBar from './design-system/TopBar.jsx'
import SignInScreen from './screens/SignInScreen.jsx'
import DashboardScreen from './screens/DashboardScreen.jsx'
import SearchScreen from './screens/SearchScreen.jsx'
import AnalyticsScreen from './screens/AnalyticsScreen.jsx'
import CalendarScreen from './screens/CalendarScreen.jsx'
import './design-system/tokens.css'

const TITLES = { overview: 'Dashboard', external: 'External patents', internal: 'Internal patents', comparison: 'Comparison', calendar: 'Calendar' }

export default function App() {
  const [session, setSession] = useState(null)
  const [guest, setGuest] = useState(false)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [section, setSection] = useState('overview')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.subscription.unsubscribe()
  }, [])

  const signedIn = guest || Boolean(session)
  const account = session?.user?.user_metadata?.organisation || session?.user?.email || 'there'

  const { patents, statuses, loading } = usePatentsOverview(signedIn)
  const { savedIds, savePatent } = useSavedPatents(session?.user?.id ?? null)
  const savedPatents = useSavedPatentDetails(savedIds)

  function openPatent(patent) {
    setSelected(patent)
    setSection('external')
  }

  function signOut() {
    if (session) supabase.auth.signOut()
    setGuest(false)
    setSection('overview')
    setSelected(null)
  }

  return (
    <div data-ipf-theme="light" style={{ minHeight: '100%' }}>
      <WaveBackground />
      {!authReady ? null : !signedIn ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SignInScreen onGuest={() => setGuest(true)} />
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100%' }}>
          <Sidebar active={section} onSelect={setSection} />
          <main style={{ flex: '1 1 auto', minWidth: 0, padding: '28px 40px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <TopBar title={TITLES[section]} account={account} onProfile={signOut} />
            {section === 'overview' && (
              <DashboardScreen
                account={account}
                patents={patents}
                savedPatents={savedPatents}
                loading={loading}
                savedIds={savedIds}
                onSave={savePatent}
                onOpen={openPatent}
                onAdd={() => setSection('external')}
                onOpenCalendar={() => setSection('calendar')}
              />
            )}
            {(section === 'external' || section === 'comparison') && (
              <SearchScreen statuses={statuses} selected={selected} onSelect={setSelected} savedIds={savedIds} onSave={savePatent} />
            )}
            {section === 'internal' && <AnalyticsScreen patents={patents} />}
            {section === 'calendar' && <CalendarScreen account={account} patents={patents} onOpen={openPatent} />}
          </main>
        </div>
      )}
    </div>
  )
}
