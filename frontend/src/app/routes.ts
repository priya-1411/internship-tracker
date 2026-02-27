import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { KanbanBoard } from './components/KanbanBoard';
import { NetworkingDashboard } from './components/NetworkingDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ResumeVault } from './components/ResumeVault';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true,         Component: Home },
      { path: 'kanban',      Component: KanbanBoard },
      { path: 'networking',  Component: NetworkingDashboard },
      { path: 'analytics',   Component: AnalyticsDashboard },
      { path: 'vault',       Component: ResumeVault },
    ],
  },
]);
