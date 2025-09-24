// src/pages/PostDetail.jsx
import { useParams, Link } from 'react-router-dom';

export default function PostDetail() {
  const { postId } = useParams();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link to="/community" className="text-sm text-gray-600 hover:text-gray-800">
        ← Back to community
      </Link>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Post detail</h1>
        <p className="text-sm text-warm-gray">Post ID: {postId}</p>
        <p className="mt-3 text-gray-800">Content coming soon (mock detail view).</p>
      </div>
    </div>
  );
}
