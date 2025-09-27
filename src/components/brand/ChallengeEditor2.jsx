import React, { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import WarningModal from "./WarningModal";

const activityTypes = [
  { value: "photo", label: "Photo Upload" },
  { value: "quiz", label: "Quiz" },
  { value: "social", label: "Social Media Ask" },
  { value: "video_quiz", label: "Watch Video + Quiz" },
  { value: "read_quiz", label: "Read Lesson + Quiz" },
  { value: "document", label: "Document Upload" },
  { value: "audio", label: "Audio Recording" },
];

function TabNav({ tabs, current, setCurrent }) {
  return (
    <div className="flex space-x-2 mb-4">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`px-4 py-2 rounded-t ${current === i ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setCurrent(i)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default function ChallengeEditor({
  brandId,
  challenge,
  mode,
  onSaved,
  onCancel,
}) {
  const [tab, setTab] = useState(0);
  const [basic, setBasic] = useState({
    title: "",
    description: "",
    communityId: "",
    startDate: "",
    endDate: "",
    points: 0,
    status: "draft",
    reusedContent: false,
  });
  const [activities, setActivities] = useState([]);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (challenge) {
      setBasic({
        title: challenge.title || "",
        description: challenge.description || "",
        communityId: challenge.communityId || "",
        startDate: challenge.startDate ? challenge.startDate.toDate?.().toISOString().slice(0, 10) : "",
        endDate: challenge.endDate ? challenge.endDate.toDate?.().toISOString().slice(0, 10) : "",
        points: challenge.points || 0,
        status: challenge.status || "draft",
        reusedContent: challenge.reusedContent || false,
      });
      setActivities(challenge.activities || []);
    }
  }, [challenge]);

  // --- Handlers ---
  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBasic((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      { type: "", instructions: "", specs: "" },
    ]);
  };

  const handleActivityChange = (i, field, value) => {
    setActivities((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a))
    );
  };

  const handleRemoveActivity = (i) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    // If editing a published challenge, show warning
    if (mode === "edit" && basic.status === "published") {
      setShowWarning(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    const data = {
      ...basic,
      activities,
      createdAt: challenge?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (mode === "edit" && challenge?.id) {
      await updateDoc(doc(db, "brands", brandId, "challenges", challenge.id), data);
    } else {
      await addDoc(collection(db, "brands", brandId, "challenges"), data);
    }
    onSaved();
  };

  // --- UI ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onCancel}
        >
          ×
        </button>
        <TabNav
          tabs={["Basic Info", "Activities", "Review & Publish"]}
          current={tab}
          setCurrent={setTab}
        />
        {tab === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold">Title</label>
              <input
                className="w-full border rounded p-2"
                name="title"
                value={basic.title}
                onChange={handleBasicChange}
              />
            </div>
            <div>
              <label className="block font-semibold">Description</label>
              <textarea
                className="w-full border rounded p-2"
                name="description"
                value={basic.description}
                onChange={handleBasicChange}
              />
            </div>
            <div>
              <label className="block font-semibold">Community</label>
              <select
                className="w-full border rounded p-2"
                name="communityId"
                value={basic.communityId}
                onChange={handleBasicChange}
              >
                <option value="">Select community</option>
                <option value="public">Public</option>
                <option value="retail1">Retail Community 1</option>
                <option value="retail2">Retail Community 2</option>
                <option value="retail3">Retail Community 3</option>
              </select>
            </div>
            <div className="flex space-x-4">
              <div>
                <label className="block font-semibold">Start Date</label>
                <input
                  type="date"
                  className="border rounded p-2"
                  name="startDate"
                  value={basic.startDate}
                  onChange={handleBasicChange}
                />
              </div>
              <div>
                <label className="block font-semibold">End Date</label>
                <input
                  type="date"
                  className="border rounded p-2"
                  name="endDate"
                  value={basic.endDate}
                  onChange={handleBasicChange}
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold">Points</label>
              <input
                type="number"
                className="border rounded p-2"
                name="points"
                value={basic.points}
                onChange={handleBasicChange}
                min={0}
              />
            </div>
            <div>
              <label className="block font-semibold">Status</label>
              <select
                className="w-full border rounded p-2"
                name="status"
                value={basic.status}
                onChange={handleBasicChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  name="reusedContent"
                  checked={basic.reusedContent}
                  onChange={handleBasicChange}
                />{" "}
                Re-use content (yearly subscription required)
              </label>
            </div>
          </div>
        )}
        {tab === 1 && (
          <div>
            <div className="mb-4">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={handleAddActivity}
              >
                + Add Activity
              </button>
            </div>
            {activities.map((a, i) => (
              <div
                key={i}
                className="border rounded p-3 mb-3 bg-gray-50 relative"
              >
                <button
                  className="absolute top-2 right-2 text-red-500"
                  onClick={() => handleRemoveActivity(i)}
                >
                  ×
                </button>
                <div>
                  <label className="block font-semibold">Type</label>
                  <select
                    className="w-full border rounded p-2"
                    value={a.type}
                    onChange={(e) =>
                      handleActivityChange(i, "type", e.target.value)
                    }
                  >
                    <option value="">Select type</option>
                    {activityTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold">Instructions</label>
                  <input
                    className="w-full border rounded p-2"
                    value={a.instructions}
                    onChange={(e) =>
                      handleActivityChange(i, "instructions", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block font-semibold">Specs (file type, size, etc.)</label>
                  <input
                    className="w-full border rounded p-2"
                    value={a.specs}
                    onChange={(e) =>
                      handleActivityChange(i, "specs", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 2 && (
          <div>
            <h2 className="font-bold mb-2">Review Challenge</h2>
            <div>
              <strong>Title:</strong> {basic.title}
            </div>
            <div>
              <strong>Description:</strong> {basic.description}
            </div>
            <div>
              <strong>Community:</strong> {basic.communityId}
            </div>
            <div>
              <strong>Start:</strong> {basic.startDate}
            </div>
            <div>
              <strong>End:</strong> {basic.endDate}
            </div>
            <div>
              <strong>Points:</strong> {basic.points}
            </div>
            <div>
              <strong>Status:</strong> {basic.status}
            </div>
            <div>
              <strong>Re-used Content:</strong> {basic.reusedContent ? "Yes" : "No"}
            </div>
            <div className="mt-4">
              <strong>Activities:</strong>
              <ul>
                {activities.map((a, i) => (
                  <li key={i}>
                    <b>{activityTypes.find((t) => t.value === a.type)?.label || a.type}</b>: {a.instructions} ({a.specs})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
          <div>
            {tab > 0 && (
              <button
                className="px-4 py-2 bg-gray-200 rounded mr-2"
                onClick={() => setTab(tab - 1)}
              >
                Back
              </button>
            )}
            {tab < 2 && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => setTab(tab + 1)}
              >
                Next
              </button>
            )}
            {tab === 2 && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleSave}
              >
                Save Challenge
              </button>
            )}
          </div>
        </div>
        {showWarning && (
          <WarningModal
            onConfirm={async () => {
              setShowWarning(false);
              await doSave();
            }}
            onCancel={() => setShowWarning(false)}
          />
        )}
      </div>
    </div>
  );
}