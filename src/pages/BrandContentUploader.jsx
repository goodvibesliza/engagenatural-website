import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const maxSizes = {
  image: 5 * 1024 * 1024, // 5MB
  video: 50 * 1024 * 1024, // 50MB
  other: 10 * 1024 * 1024, // 10MB
};

const rules = [
  {
    label: "Retention Policy",
    content: (
      <div>
        <strong>Content Retention Policy:</strong>
        <p style={{ fontSize: 14 }}>
          All uploaded content is tied to your active subscription. Upon contract expiration, content will be permanently removed from our servers within 30 days. To maintain access and preserve your content library, please ensure your annual subscription remains current.
        </p>
      </div>
    ),
  },
  {
    label: "File Specs",
    content: (
      <div>
        <strong>File Upload Limits:</strong>
        <ul style={{ fontSize: 14, margin: 0, paddingLeft: 18 }}>
          <li>Images: Max 5MB per file (JPG, PNG, GIF)</li>
          <li>Videos: Max 50MB per file, 5 minutes max duration (MP4, MOV, AVI)</li>
          <li>Documents: Max 10MB per file (PDF, DOC, etc.)</li>
          <li>Total brand storage: 100GB limit</li>
        </ul>
        <em style={{ fontSize: 13 }}>Note: Video views will be visible in your brand dashboard.</em>
      </div>
    ),
  },
  {
    label: "Video Tips",
    content: (
      <div>
        <strong>Video Optimization Tips:</strong>
        <ul style={{ fontSize: 14, margin: 0, paddingLeft: 18 }}>
          <li>Use <b>720p resolution</b> (1280×720) for mobile screens</li>
          <li>Keep videos under <b>5 minutes</b></li>
          <li>Use <b>MP4 format</b> with H.264 codec</li>
          <li>Target <b>1.5-2.5 Mbps bitrate</b> for optimal quality/size</li>
        </ul>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Free compression tools:{" "}
          <a href="https://handbrake.fr/" target="_blank" rel="noopener noreferrer">HandBrake</a> |{" "}
          <a href="https://clipchamp.com/" target="_blank" rel="noopener noreferrer">Clipchamp</a> |{" "}
          <a href="https://cloudconvert.com/" target="_blank" rel="noopener noreferrer">CloudConvert</a>
        </div>
      </div>
    ),
  },
];

function BrandContentUploader() {
  const { brandId } = useParams();
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "",
    isPublished: false,
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeRule, setActiveRule] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateFile = (file) => {
    let fileType = "other";
    if (file.type.startsWith("image/")) fileType = "image";
    if (file.type.startsWith("video/")) fileType = "video";
    if (file.size > maxSizes[fileType]) {
      setFileError(
        `File too large! ${fileType} files must be under ${
          maxSizes[fileType] / (1024 * 1024)
        }MB`
      );
      setFileSuccess("");
      setVideoInfo("");
      return false;
    }
    setFileError("");
    setFileSuccess(
      `✓ File size OK (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
    );
    if (fileType === "video") {
      analyzeVideo(file);
    } else {
      setVideoInfo("");
    }
    return true;
  };

  const analyzeVideo = (file) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = function () {
      const duration = Math.round(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      if (duration > 300) {
        setVideoInfo(
          `⚠️ Video is ${minutes}:${seconds
            .toString()
            .padStart(2, "0")} - consider keeping under 5:00 for optimal performance`
        );
      } else {
        setVideoInfo(
          `✓ Video: ${minutes}:${seconds
            .toString()
            .padStart(2, "0")} duration - good length for mobile viewing`
        );
      }
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    if (file) {
      validateFile(file);
    } else {
      setFileError("");
      setFileSuccess("");
      setVideoInfo("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setUploading(true);

    try {
      let mediaUrl = "";
      if (file) {
        if (!validateFile(file)) {
          setUploading(false);
          return;
        }
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(
          storage,
          `brands/${brandId}/content/${fileName}`
        );
        setStatus("Uploading file to storage...");
        const snapshot = await uploadBytes(storageRef, file);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      setStatus("Saving content data...");
      const contentData = {
        title: form.title,
        body: form.body,
        type: form.type,
        mediaUrl: mediaUrl,
        isPublished: form.isPublished,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "brands", brandId, "content"), contentData);

      setStatus("✓ Content uploaded successfully!");
      setForm({
        title: "",
        body: "",
        type: "",
        isPublished: false,
      });
      setFile(null);
      setFileSuccess("");
      setVideoInfo("");
      document.getElementById("mediaFile").value = "";
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // --- Layout ---
  return (
    <div style={{ display: "flex", maxWidth: 900, margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      {/* Main Form */}
      <div style={{ flex: 1, padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Upload Brand Content</h1>
        <div style={{ color: "#475569", marginBottom: 16 }}>
          Brand ID: <strong>{brandId}</strong>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="title">Content Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={100}
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="body">Description</label>
            <textarea
              id="body"
              name="body"
              placeholder="Enter content description..."
              maxLength={1000}
              value={form.body}
              onChange={handleChange}
              style={{ height: 100, resize: "vertical" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="type">Content Type *</label>
            <select
              id="type"
              name="type"
              required
              value={form.type}
              onChange={handleChange}
            >
              <option value="">Select content type</option>
              <option value="article">Article</option>
              <option value="image">Image</option>
              <option value="video">Video (720p recommended)</option>
              <option value="document">Document</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="mediaFile">Upload File</label>
            <input
              type="file"
              id="mediaFile"
              name="mediaFile"
              accept="image/*,video/mp4,video/mov,video/avi,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            {fileError && <div style={{ color: "#dc3545", fontSize: 14 }}>{fileError}</div>}
            {fileSuccess && <div style={{ color: "#28a745", fontSize: 14 }}>{fileSuccess}</div>}
            {videoInfo && <div style={{ color: videoInfo.startsWith("✓") ? "#28a745" : "#dc3545", fontSize: 14 }}>{videoInfo}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
              />{" "}
              Publish immediately
            </label>
          </div>

          <button
            type="submit"
            className="submit-btn"
            style={{
              background: uploading ? "#6c757d" : "#007bff",
              color: "white",
              padding: "12px 30px",
              border: "none",
              borderRadius: 4,
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Content"}
          </button>
          <div style={{ marginTop: 10, minHeight: 24 }}>
            {status && (
              <span style={{ color: status.startsWith("✓") ? "#28a745" : status.startsWith("Error") ? "#dc3545" : "#007bff" }}>
                {status}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Right Sidebar Tabs */}
      <div style={{
        width: 180,
        marginLeft: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        position: "relative"
      }}>
        <div style={{
          position: "sticky",
          top: 40,
          width: "100%",
          zIndex: 2
        }}>
          {rules.map((rule, idx) => (
            <button
              key={rule.label}
              onClick={() => setActiveRule(activeRule === idx ? null : idx)}
              style={{
                width: "100%",
                marginBottom: 8,
                padding: "10px 12px",
                background: activeRule === idx ? "#0ea5e9" : "#f1f5f9",
                color: activeRule === idx ? "#fff" : "#0ea5e9",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "right",
                transition: "background 0.2s"
              }}
            >
              {rule.label}
            </button>
          ))}
        </div>
        {/* Rule Panel */}
        {activeRule !== null && (
          <div style={{
            position: "absolute",
            top: 8 + activeRule * 48,
            right: 200,
            width: 320,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: 18,
            zIndex: 10
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#0ea5e9" }}>{rules[activeRule].label}</span>
              <button onClick={() => setActiveRule(null)} style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "#64748b"
              }}>×</button>
            </div>
            <div>{rules[activeRule].content}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrandContentUploader;