'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  relationship_stage: string;
  couple_id: string | null;
  created_at: string;
}

interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_email: string;
  user2_email: string;
  coupling_code: string;
  status: string;
  session_count: number;
  completed_sessions: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'couples' | 'analytics'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }

        // For now, we'll allow access if user is authenticated
        // In production, verify admin role here
        setLoading(false);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/');
      }
    };

    init();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get profiles directly (admin view)
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCouples = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get couples with session info
      const { data, error: err } = await supabase
        .from('couples')
        .select(`
          id,
          user1_id,
          user2_id,
          coupling_code,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Enrich with profile emails and session counts
      const enriched = await Promise.all(
        (data || []).map(async (couple) => {
          const { data: user1 } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', couple.user1_id)
            .single();

          const { data: user2 } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', couple.user2_id)
            .single();

          const { data: sessions } = await supabase
            .from('sessions')
            .select('id, status')
            .eq('couple_id', couple.id);

          return {
            ...couple,
            user1_email: user1?.email || 'Unknown',
            user2_email: user2?.email || 'Unknown',
            session_count: sessions?.length || 0,
            completed_sessions: sessions?.filter(s => s.status === 'completed').length || 0,
          } as Couple;
        })
      );

      setCouples(enriched);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'couples') {
      fetchCouples();
    }
  }, [activeTab]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">OneAccord Admin</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users, couples, and track progress</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('couples')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'couples'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Couples ({couples.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stage</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Couple</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{u.relationship_stage}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.couple_id ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-600">
                No users yet
              </div>
            )}
          </div>
        )}

        {/* Couples Tab */}
        {activeTab === 'couples' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User 1</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User 2</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sessions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {couples.map((couple) => (
                  <tr key={couple.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{couple.user1_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{couple.user2_email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{couple.coupling_code}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          couple.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : couple.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {couple.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {couple.completed_sessions}/{couple.session_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(couple.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {couples.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-600">
                No couples yet
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Linked Couples</h3>
              <p className="text-4xl font-bold text-gray-900">{couples.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Sessions</h3>
              <p className="text-4xl font-bold text-gray-900">
                {couples.reduce((sum, c) => sum + c.session_count, 0)}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
