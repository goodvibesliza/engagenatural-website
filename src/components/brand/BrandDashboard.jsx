import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import useBrandAnalytics from "../hooks/useBrandAnalytics";
import { SimpleLine, SimpleBar } from "../components/brand/analytics/Charts";

export default function BrandDashboard({ brandId }) {
  const { brandId: paramBrandId } = useParams();
  const actualBrandId = brandId || paramBrandId;

  // Fetch brand info (name, logo)
  const [brandInfo, setBrandInfo] = useState(null);

  useEffect(() => {
    async function fetchBrand() {
      const ref = doc(db, "brands", actualBrandId);
      const snap = await getDoc(ref);
      if (snap.exists()) setBrandInfo(snap.data());
    }
    fetchBrand();
  }, [actualBrandId]);

  // Analytics data
  const {
    roiSeries,
    completionSeries,
    dauSeries,
    newUsersSeries,
    totals,
    loading,
  } = useBrandAnalytics(actualBrandId);

  if (loading) return <p className="p-8">Loading analytics…</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Brand logo and name */}
      <div className="flex items-center space-x-4 mb-8">
        {brandInfo?.logoUrl && (
          <img
            src={brandInfo.logoUrl}
            alt="Brand Logo"
            className="h-14 w-14 rounded-full object-cover border border-brand-primary shadow"
          />
        )}
        <h1 className="text-4xl font-playfair font-bold text-brand-primary drop-shadow">
          {brandInfo?.name || "Brand Analytics"}
        </h1>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-wrap gap-4 mb-10">
        <Link
          to={`/brand/${actualBrandId}/challenges`}
          className="px-5 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-secondary transition-colors font-semibold"
        >
          Manage Challenges
        </Link>
        <Link
          to={`/brand/${actualBrandId}/upload`}
          className="px-5 py-2 bg-brand-secondary text-white rounded-lg shadow hover:bg-brand-accent transition-colors font-semibold"
        >
          Upload Content
        </Link>
        <Link
          to={`/brand/${actualBrandId}/menu`}
          className="px-5 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors font-semibold"
        >
          Brand Menu
        </Link>
      </div>

      {/* Analytics Charts: 2 across, smaller, with explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* ROI */}
        <section className="bg-white border rounded-xl shadow p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <h2 className="font-inter font-semibold text-xl text-brand-primary flex-1">
              ROI Growth (items sold ↑)
            </h2>
            <span className="text-xs bg-brand-accent text-white px-2 py-1 rounded">ROI</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            <strong>ROI = Return on Investment.</strong> This chart shows the increase in items sold as a result of your brand’s challenges and engagement campaigns. Track how your efforts are driving real sales!
          </p>
          <div className="flex-1 min-h-[200px]">
            <SimpleLine data={roiSeries} color="var(--color-brand-accent)" label="Extra items" />
          </div>
        </section>
        {/* Completions */}
        <section className="bg-white border rounded-xl shadow p-6 flex flex-col">
          <h2 className="font-inter font-semibold text-xl text-brand-secondary mb-2">
            Challenge & Lesson Completions
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            See how many users are completing your challenges and lessons over time.
          </p>
          <div className="flex-1 min-h-[200px]">
            <SimpleBar data={completionSeries} color="var(--color-brand-secondary)" label="Completions" />
          </div>
        </section>
        {/* Daily Active Users */}
        <section className="bg-white border rounded-xl shadow p-6 flex flex-col">
          <h2 className="font-inter font-semibold text-xl text-brand-primary mb-2">
            Daily Active Users
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Track how many unique users are engaging with your brand each day.
          </p>
          <div className="flex-1 min-h-[200px]">
            <SimpleLine data={dauSeries} color="var(--color-brand-primary)" label="DAU" />
          </div>
        </section>
        {/* New Users (Weekly) */}
        <section className="bg-white border rounded-xl shadow p-6 flex flex-col">
          <h2 className="font-inter font-semibold text-xl text-brand-accent mb-2">
            New Users (per week)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Monitor how many new users are joining your brand community each week.
          </p>
          <div className="flex-1 min-h-[200px]">
            <SimpleBar data={newUsersSeries} color="var(--color-brand-accent)" label="New users" />
          </div>
        </section>
      </div>

      {/* Totals */}
      <div className="bg-white border rounded-xl shadow p-6">
        <h2 className="font-inter font-semibold text-xl mb-2">Totals</h2>
        <p className="text-lg">
          Active Users: <span className="font-bold">{totals.activeUsers}</span>
        </p>
      </div>
    </div>
  );
}