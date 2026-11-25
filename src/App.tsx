import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './components/Home'
import { SettingsProvider, Sidebar, ToolPage } from './components/layout'
import { UnitPage } from './components/UnitPage'

export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/unit/:unit" element={<UnitPage />} />
              <Route path="/unit/:unit/:slug" element={<ToolPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
        </div>
      </SettingsProvider>
    </HashRouter>
  )
}
