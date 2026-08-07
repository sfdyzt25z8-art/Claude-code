import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/hooks/useTheme';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Focus from '@/pages/Focus';
import Statistics from '@/pages/Statistics';
import AICoach from '@/pages/AICoach';
import Settings from '@/pages/Settings';

export default function App() {
  useTheme();

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
