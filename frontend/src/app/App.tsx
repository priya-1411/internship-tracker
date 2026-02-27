import React from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { GraduationCap, Loader2 } from 'lucide-react';
import { StoreProvider, useStore } from './store';
import { router } from './routes';
import { AuthPage } from './components/AuthPage';

function AppInner() {
  const { user, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <p className="text-white font-semibold text-lg mb-1">InternTrack</p>
          <p className="text-indigo-400 text-sm mb-6">Loading your workspace…</p>
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
      <Toaster position="bottom-right" richColors closeButton expand />
    </StoreProvider>
  );
}
