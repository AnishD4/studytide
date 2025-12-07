import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'courses', label: 'Courses' },
  { id: 'tutors', label: 'Tutors' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'resources', label: 'Resources' },
  { id: 'community', label: 'Community' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export default function Home() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const fromHash = typeof window !== 'undefined' && window.location.hash.replace('#', '')
    if (fromHash && TABS.find(t => t.id === fromHash)) setActive(fromHash)

    const onHash = () => {
      const h = window.location.hash.replace('#', '')
      if (TABS.find(t => t.id === h)) setActive(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function openTab(id) {
    setActive(id)
    if (typeof window !== 'undefined') window.location.hash = id
  }

  return (
    <>
      <Head>
        <title>StudyTide — Ocean Learning</title>
        <meta name="description" content="StudyTide — ride the learning wave" />
      </Head>

      <div className="page-wrap">
        {/* decorative sun */}
        <div className="sun" aria-hidden="true" />

        <header className="site-header">
          <div className="brand">
            <Image src="/crab.svg" alt="crab" className="crab" width={36} height={36} />
            <span>StudyTide</span>
          </div>
          <nav className="main-nav">
            <ul>
              {TABS.map(t => (
                <li key={t.id}>
                  <button
                    className={t.id === active ? 'active' : ''}
                    onClick={() => openTab(t.id)}
                    aria-current={t.id === active ? 'page' : undefined}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="container">
          <section className="hero card">
            <h1>Ride the StudyTide</h1>
            <p className="lead">Ocean-themed learning: explore courses, connect with tutors, and join the community.</p>
          </section>

          <section className="tabs mt-1">
            {TABS.map(t => (
              <article key={t.id} className={"tab-panel card " + (active === t.id ? 'open' : 'closed')} id={t.id}>
                <h2>{t.label}</h2>
                <p>Placeholder content for the {t.label} tab.</p>
              </article>
            ))}
          </section>
        </main>

        <footer className="site-footer">
          <div className="container">
            <small>© StudyTide — ocean & crab themed</small>
          </div>
        </footer>

        {/* decorative wave at the bottom */}
        <img src="/wave.svg" alt="wave" className="wave-graphic" />
      </div>
    </>
  )
}
