import { getDocs, onSnapshot } from 'firebase/firestore';

export function logIndexHint(error, context = 'Firestore Query') {
  if (error.code === 'failed-precondition' || error.message.includes('index')) {
    const urlRegex = /(https?:\/\/[^\s)]+)/;
    const match = error.message.match(urlRegex);
    
    if (match && match[1]) {
      const indexUrl = match[1];
      console.groupCollapsed(`🔍 Missing Firestore Index for: ${context}`);
      console.info(`Create the index here: ${indexUrl}`);
      console.error('Original error:', error);
      console.groupEnd();
    } else {
      console.error(`${context} error:`, error);
    }
  } else if (error.code === 'permission-denied') {
    console.groupCollapsed(`🔒 Firestore Permission Denied: ${context}`);
    console.error('Access denied:', error.message);
    console.info('Check your Firestore security rules');
    console.error('Original error:', error);
    console.groupEnd();
  } else {
    console.error(`${context} error:`, error);
  }
}

export async function getDocsWithIndexHint(q, context = 'Firestore Query') {
  try {
    return await getDocs(q);
  } catch (error) {
    logIndexHint(error, context);
    throw error;
  }
}

export function onSnapshotWithIndexHint(q, onNext, onError, context = 'Firestore Listener') {
  return onSnapshot(
    q,
    onNext,
    (error) => {
      logIndexHint(error, context);
      if (onError) {
        onError(error);
      }
    }
  );
}
