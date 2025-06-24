// Pulls daily aggregates + derives graph-ready datasets
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { startOfWeek, format } from "date-fns";

export default function useBrandAnalytics(brandId) {
  const [data, setData] = useState({
    roiSeries: [],
    completionSeries: [],
    dauSeries: [],
    newUsersSeries: [],
    totals: { activeUsers: 0 },
    loading: true,
  });

  useEffect(() => {
    if (!brandId) return;

    // ===== helper aggregators =====
    const roiByDay = {};
    const completionsByDay = {};
    const dauByDay = {};
    const newUsersByWeek = {};
    const activeUserIds = new Set();

    // 1. Challenge completions  (stores userId, challengeId, ts)
    const compRef = query(
      collection(db, "brands", brandId, "completions")
    );
    // 2. User sign-ups for “new user” metric
    const userRef = query(collection(db, "brands", brandId, "users"));

    // -- listen for completions (real-time) --
    const unsubCompletions = onSnapshot(compRef, (snap) => {
      snap.docChanges().forEach((change) => {
        const d = change.doc.data();
        const dayKey = format(d.timestamp.toDate(), "yyyy-MM-dd");
        const weekKey = format(startOfWeek(d.timestamp.toDate()), "yyyy-MM-dd");

        // ROI = +3 items per completion
        roiByDay[dayKey] = (roiByDay[dayKey] || 0) + 3;

        completionsByDay[dayKey] = (completionsByDay[dayKey] || 0) + 1;

        dauByDay[dayKey] = dauByDay[dayKey] || new Set();
        dauByDay[dayKey].add(d.userId);

        activeUserIds.add(d.userId);
      });

      setData((prev) => ({
        ...prev,
        roiSeries: seriesFromObj(roiByDay),
        completionSeries: seriesFromObj(completionsByDay),
        dauSeries: seriesFromObj(
          Object.fromEntries(
            Object.entries(dauByDay).map(([k, v]) => [k, v.size])
          )
        ),
        totals: { activeUsers: activeUserIds.size },
        loading: false,
      }));
    });

    // -- fetch users once to build weekly “new users” series --
    (async () => {
      const snap = await getDocs(userRef);
      snap.forEach((doc) => {
        const d = doc.data();
        const weekKey = format(startOfWeek(d.createdAt.toDate()), "yyyy-MM-dd");
        newUsersByWeek[weekKey] = (newUsersByWeek[weekKey] || 0) + 1;
        activeUserIds.add(doc.id);
      });
      setData((prev) => ({
        ...prev,
        newUsersSeries: seriesFromObj(newUsersByWeek),
        totals: { activeUsers: activeUserIds.size },
      }));
    })();

    return () => unsubCompletions();
  }, [brandId]);

  return data;
}

// util → converts {dateStr:number} ➜ [{date,val}]
function seriesFromObj(obj) {
  return Object.entries(obj)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, value]) => ({ date, value }));
}