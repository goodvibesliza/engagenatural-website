import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import ChallengeEditor from "../components/brand/ChallengeEditor";

export default function BrandChallenges() {
  const { brandId } = useParams();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [editorMode, setEditorMode] = useState("create"); // "create" | "edit" | "duplicate"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      setLoading(true);
      const q = query(
        collection(db, "brands", brandId, "challenges")
      );
      const snap = await getDocs(q);
      setChallenges(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    }
    fetchChallenges();
  }, [brandId]);

  const handleEdit = (challenge) => {
    setSelectedChallenge(challenge);
    setEditorMode("edit");
  };

  const handleDuplicate = (challenge) => {
    setSelectedChallenge({ ...challenge, title: challenge.title + " (Copy)", status: "draft" });
    setEditorMode("duplicate");
  };

  const handleCreate = () => {
    setSelectedChallenge(null);
    setEditorMode("create");
  };

  const handleSaved = () => {
    setSelectedChallenge(null);
    setEditorMode("create");
    // Refresh list
    setLoading(true);
    setTimeout(() => setLoading(false), 500); // quick refresh
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Brand Challenges</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleCreate}
      >
        + Create New Challenge
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {challenges.map((ch) => (
            <div
              key={ch.id}
              className="border rounded p-4 flex justify-between items-center bg-gray-50"
            >
              <div>
                <div className="font-semibold">{ch.title}</div>
                <div className="text-sm text-gray-500">
                  {ch.status} | {ch.startDate?.toDate?.().toLocaleDateString?.() || "No date"}
                </div>
              </div>
              <div className="space-x-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() => handleEdit(ch)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                  onClick={() => handleDuplicate(ch)}
                >
                  Duplicate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editorMode === "create" || editorMode === "edit" || editorMode === "duplicate") && (
        <ChallengeEditor
          brandId={brandId}
          challenge={selectedChallenge}
          mode={editorMode}
          onSaved={handleSaved}
          onCancel={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
}