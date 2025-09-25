// src/components/CommunityPostRedirect.jsx
import { Navigate, useParams } from 'react-router-dom';

export default function CommunityPostRedirect() {
  const { postId } = useParams();
  return <Navigate to={`/staff/community/post/${postId}`} replace />;
}