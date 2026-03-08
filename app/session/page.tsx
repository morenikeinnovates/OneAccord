"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/sessions-data";
import type { SessionItem, SessionCategory } from "@/lib/sessions-data";

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryKey = searchParams.get("category");
  const sessionId = searchParams.get("sessionId");
  // const mode = searchParams.get('mode') || 'deep';

  const [category, setCategory] = useState<SessionCategory | null>(null);
  const [sessionItem, setSessionItem] = useState<SessionItem | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "mystory" | "yourstory" | "middle"
  >("mystory");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }
        setUser(session.user);

        // Find category and session
        const cat = CATEGORIES.find((c) => c.key === categoryKey);
        if (!cat) {
          router.push("/dashboard");
          return;
        }
        setCategory(cat);

        const sess = cat.sessions.find((s) => s.id === sessionId);
        if (!sess) {
          router.push("/dashboard");
          return;
        }
        setSessionItem(sess);

        // Load existing responses if sessionId exists
        if (sessionId && user) {
          const { data } = await supabase
            .from("responses")
            .select("*")
            .eq("session_id", sessionId)
            .eq("user_id", session.user.id);

          if (data && data.length > 0) {
            const allResponses: Record<string, string> = {};
            data.forEach((r) => {
              Object.assign(allResponses, r.responses_json || {});
            });
            setResponses(allResponses);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing session:", err);
        setLoading(false);
      }
    };

    init();
  }, [categoryKey, sessionId, router, user]);

  const handleResponseChange = (questionIndex: number, value: string) => {
    const key = `${currentStep}_${questionIndex}`;
    setResponses((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAndNext = async () => {
    if (!user || !sessionId) return;

    setSaving(true);
    try {
      const stepResponses = Object.entries(responses)
        .filter(([key]) => key.startsWith(currentStep))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        );

      await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
          step: currentStep,
          responses_json: stepResponses,
        }),
      });

      // Move to next step
      if (currentStep === "mystory") {
        setCurrentStep("yourstory");
      } else if (currentStep === "yourstory") {
        setCurrentStep("middle");
      } else {
        // Session complete - redirect to declarations
        router.push(`/declarations?sessionId=${sessionId}`);
      }
    } catch (err) {
      console.error("Error saving responses:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!sessionItem || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Session not found</p>
      </div>
    );
  }

  const questions = sessionItem[currentStep as keyof SessionItem] as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {category.name}
          </h1>
          <span className="text-gray-400">
            {currentStep === "mystory"
              ? "1/3"
              : currentStep === "yourstory"
                ? "2/3"
                : "3/3"}
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {sessionItem.title}
          </h2>

          <div className="mb-6">
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">
              {sessionItem.why}
            </p>
            {sessionItem.scripture && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 italic text-gray-700">
                "{sessionItem.scripture.text}"
                <p className="text-sm font-semibold mt-2">
                  — {sessionItem.scripture.ref}
                </p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentStep === "mystory" && "My Story"}
              {currentStep === "yourstory" && "Your Story"}
              {currentStep === "middle" && "Find Our Middle"}
            </h3>

            <div className="space-y-6">
              {questions.map((question, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {idx + 1}. {question}
                  </label>
                  <textarea
                    value={responses[`${currentStep}_${idx}`] || ""}
                    onChange={(e) => handleResponseChange(idx, e.target.value)}
                    placeholder="Your response..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={4}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {saving
              ? "Saving..."
              : currentStep === "middle"
                ? "Complete Session"
                : "Next Step"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading session...</p>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
