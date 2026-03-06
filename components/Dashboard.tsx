'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/sessions-data';
import CoupleLink from './CoupleLink';

export default function Dashboard({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'couple' | 'progress'>('categories');

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const startSession = (categoryKey: string, sessionId: string, mode: 'deep' | 'flashcard' = 'deep') => {
    router.push(`/session?category=${categoryKey}&sessionId=${sessionId}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">OneAccord</h1>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.email}!</h2>
          <p className="text-gray-600">Build deeper connection through guided conversations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('couple')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'couple'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Link with Partner
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'progress'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Progress
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 gap-6">
            {CATEGORIES.map((category) => (
              <div key={category.key} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {category.emoji} {category.name}
                    </h3>
                    <p className="text-gray-600 mt-1">{category.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                      <h4 className="font-semibold text-gray-900 mb-1">{session.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{session.sub}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startSession(category.key, session.id, 'deep')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded transition text-sm"
                        >
                          Deep Dive
                        </button>
                        <button
                          onClick={() => startSession(category.key, session.id, 'flashcard')}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded transition text-sm"
                        >
                          Flash Cards
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Couple Tab */}
        {activeTab === 'couple' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Link with Your Partner</h3>
            <p className="text-gray-600 mb-6">
              Connect with your partner to start couple sessions and share your responses.
            </p>
            <CoupleLink userId={user.id} onSuccess={() => setActiveTab('categories')} />
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h3>
            <p className="text-gray-600">Track your journey through all conversation categories.</p>
            <div className="mt-8 space-y-4">
              {CATEGORIES.map((category) => (
                <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{category.emoji} {category.name}</h4>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">0 / {category.sessions.length} completed</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
