'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CoupleLinkProps {
  userId: string;
  onSuccess?: () => void;
}

export default function CoupleLink({ userId, onSuccess }: CoupleLinkProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [couplingCode, setCouplingCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateCouple = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'create',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const couple = await response.json();
      setGeneratedCode(couple.coupling_code);
      setSuccess(`Code created: ${couple.coupling_code}`);

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create couple code');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!couplingCode.trim()) {
      setError('Please enter a coupling code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'join',
          coupling_code: couplingCode.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setSuccess('Successfully linked with partner!');
      setCouplingCode('');

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join couple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Mode Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setMode('create');
            setError('');
            setSuccess('');
            setGeneratedCode('');
          }}
          className={`flex-1 px-4 py-3 font-semibold rounded-lg transition ${
            mode === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Create Code
        </button>
        <button
          onClick={() => {
            setMode('join');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 px-4 py-3 font-semibold rounded-lg transition ${
            mode === 'join'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Join Partner
        </button>
      </div>

      {/* Create Mode */}
      {mode === 'create' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate a Coupling Code</h3>
          <p className="text-gray-600 mb-6">
            Share this code with your partner so they can link their account with yours.
          </p>

          {generatedCode && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Your Coupling Code:</p>
              <div className="flex items-center gap-4">
                <code className="text-3xl font-bold text-blue-600 tracking-widest">
                  {generatedCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    setSuccess('Code copied to clipboard!');
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateCouple}
            disabled={loading || !!generatedCode}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Generate Code'}
          </button>
        </div>
      )}

      {/* Join Mode */}
      {mode === 'join' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Your Partner</h3>
          <p className="text-gray-600 mb-6">
            Enter the coupling code your partner shared with you.
          </p>

          <input
            type="text"
            value={couplingCode}
            onChange={(e) => setCouplingCode(e.target.value.toUpperCase())}
            placeholder="Enter 12-character code"
            maxLength={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 text-center text-lg font-semibold tracking-widest"
          />

          <button
            onClick={handleJoinCouple}
            disabled={loading || !couplingCode.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Linking...' : 'Link with Partner'}
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
