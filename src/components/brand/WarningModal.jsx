import React from "react";

export default function WarningModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2 text-red-600">Warning</h2>
        <p className="mb-4">
          This challenge has already been published and may have user participation. Editing it could affect users who have already started or completed it. Are you sure you want to continue?
        </p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={onConfirm}
          >
            Yes, Edit Anyway
          </button>
        </div>
      </div>
    </div>
  );
}