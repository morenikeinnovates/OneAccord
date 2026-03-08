"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Declaration } from "@/lib/types";

function DeclarationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [user, setUser] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [approved, setApproved] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }
        setUser(session.user);

        // Get user's couple
        const { data: couples } = await supabase
          .from("couples")
          .select("*")
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

        if (!couples || couples.length === 0) {
          setError("No couple found");
          setLoading(false);
          return;
        }

        const userCouple = couples[0];
        setCouple(userCouple);
        setIsPartner(userCouple.user2_id === session.user.id);

        // Get or create declaration
        let decl;
        if (sessionId) {
          const { data: existingDecl } = await supabase
            .from("declarations")
            .select("*")
            .eq("session_id", sessionId)
            .eq("couple_id", userCouple.id)
            .single();

          if (existingDecl) {
            decl = existingDecl;
          } else {
            // Create empty declaration
            const { data: newDecl } = await supabase
              .from("declarations")
              .insert([
                {
                  session_id: sessionId,
                  couple_id: userCouple.id,
                },
              ])
              .select()
              .single();
            decl = newDecl;
          }
        } else {
          const { data: lastDecl } = await supabase
            .from("declarations")
            .select("*")
            .eq("couple_id", userCouple.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          decl = lastDecl;
        }

        setDeclaration(decl);

        // Check approval status
        if (isPartner && decl?.user2_approved) {
          setApproved(true);
        } else if (!isPartner && decl?.user1_approved) {
          setApproved(true);
        }

        if (decl?.final_text) {
          setEditedText(decl.final_text);
        } else if (decl?.draft_text) {
          setEditedText(decl.draft_text);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();
  }, [sessionId, router]);

  const handleGenerateDeclaration = async () => {
    if (!declaration || !couple) return;

    setGenerating(true);
    setError("");

    try {
      // Get session info to extract category
      const { data: session } = await supabase
        .from("sessions")
        .select("category_key")
        .eq("id", declaration.session_id)
        .single();

      const response = await fetch("/api/declarations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: declaration.session_id,
          couple_id: couple.id,
          category_key: session?.category_key || "foundation",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const updatedDecl = await response.json();
      setDeclaration(updatedDecl);
      setEditedText(updatedDecl.draft_text);
    } catch (err: any) {
      setError(err.message || "Failed to generate declaration");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndApprove = async () => {
    if (!declaration || !user) return;

    setSaving(true);
    setError("");

    try {
      const updateData: Record<string, any> = {
        declaration_id: declaration.id,
      };

      if (editMode) {
        updateData.final_text = editedText;
      }

      // Set approval based on which user is approving
      if (isPartner) {
        updateData.user2_approved = true;
      } else {
        updateData.user1_approved = true;
      }

      const response = await fetch("/api/declarations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const updatedDecl = await response.json();
      setDeclaration(updatedDecl);
      setApproved(true);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to save declaration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading declaration...</p>
      </div>
    );
  }

  const displayText = editMode
    ? editedText
    : declaration?.final_text || declaration?.draft_text || "";
  const bothApproved =
    declaration?.user1_approved && declaration?.user2_approved;

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
            Our Declaration
          </h1>
          <div />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Couple's Declaration
          </h2>
          <p className="text-gray-600 mb-8">
            Review and approve your declaration. Once both partners approve, it
            will be sealed.
          </p>

          {bothApproved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">
                ✓ This declaration is sealed and complete.
              </p>
              <p className="text-green-700 text-sm mt-1">
                Both partners have approved on{" "}
                {new Date(declaration?.sealed_at || "").toLocaleDateString()}
              </p>
            </div>
          )}

          {!displayText && !generating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 mb-4">
                Generate an AI-assisted declaration based on your responses, or
                write your own.
              </p>
              <button
                onClick={handleGenerateDeclaration}
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {generating ? "Generating..." : "Generate Declaration"}
              </button>
            </div>
          )}

          {displayText && (
            <div className="mb-8">
              {editMode ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-serif text-lg leading-relaxed"
                  rows={12}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 font-serif text-lg leading-relaxed text-gray-900 border border-gray-200">
                  {displayText}
                </div>
              )}

              {!bothApproved && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {editMode ? "Done Editing" : "Edit Declaration"}
                  </button>

                  <button
                    onClick={handleSaveAndApprove}
                    disabled={saving || approved}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition ${
                      approved
                        ? "bg-green-600 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white"
                    }`}
                  >
                    {saving
                      ? "Saving..."
                      : approved
                        ? "You Approved ✓"
                        : "Approve & Seal"}
                  </button>
                </div>
              )}
            </div>
          )}

          {generating && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">
                  Generating your declaration...
                </p>
              </div>
            </div>
          )}

          {/* Approval Status */}
          {!bothApproved && declaration && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Approval Status
              </h3>
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    declaration.user1_approved ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <span
                    className={
                      declaration.user1_approved
                        ? "text-green-600 text-xl"
                        : "text-gray-400"
                    }
                  >
                    {declaration.user1_approved ? "✓" : "○"}
                  </span>
                  <span
                    className={
                      declaration.user1_approved
                        ? "text-green-800 font-medium"
                        : "text-gray-600"
                    }
                  >
                    Partner 1
                  </span>
                  {declaration.user1_approved && (
                    <span className="text-sm text-green-700 ml-auto">
                      Approved
                    </span>
                  )}
                </div>

                <div
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    declaration.user2_approved ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <span
                    className={
                      declaration.user2_approved
                        ? "text-green-600 text-xl"
                        : "text-gray-400"
                    }
                  >
                    {declaration.user2_approved ? "✓" : "○"}
                  </span>
                  <span
                    className={
                      declaration.user2_approved
                        ? "text-green-800 font-medium"
                        : "text-gray-600"
                    }
                  >
                    Partner 2
                  </span>
                  {declaration.user2_approved && (
                    <span className="text-sm text-green-700 ml-auto">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DeclarationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <DeclarationsContent />
    </Suspense>
  );
}
