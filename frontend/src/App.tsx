import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './layouts/dashboard-layout'
import { Dashboard } from './pages/dashboard'
import { ReviewQueue } from './pages/review-queue'
import { Calendar } from './pages/calendar'
import { Contacts } from './pages/contacts'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/contacts" element={<Contacts />} />
      </Route>
    </Routes>
  )
}

export default App
