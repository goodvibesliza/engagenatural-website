import React from "react";
import useBrandAnalytics from "../../hooks/useBrandAnalytics";
import { SimpleLine, SimpleBar } from "./analytics/Charts";

export default function BrandDashboard({ brandId }) {
  const {
    roiSeries,
    completionSeries,
    dauSeries,
    newUsersSeries,
    totals,
    loading,
  } = useBrandAnalytics(brandId);

  if (loading) return <p className="p-8">Loading analytics…</p>;

  return (
    <div className="space-y-10 p-6">
      <h1 className="font-playfair text-3xl">Brand Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROI */}
        <section className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-inter font-semibold mb-2">
            ROI Growth (items sold ↑)
          </h2>
          <SimpleLine data={roiSeries} color="#AD9579" label="Extra items" />
        </section>

        {/* Completions */}
        <section className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-inter font-semibold mb-2">
            Challenge & Lesson Completions
          </h2>
          <SimpleBar data={completionSeries} color="#598F7F" label="Completions" />
        </section>

        {/* Daily Active Users */}
        <section className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-inter font-semibold mb-2">Daily Active Users</h2>
          <SimpleLine data={dauSeries} color="#755851" label="DAU" />
        </section>

        {/* New Users (Weekly) */}
        <section className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-inter font-semibold mb-2">New Users (per week)</h2>
          <SimpleBar data={newUsersSeries} color="#C5D8A4" label="New users" />
        </section>
      </div>

      {/* Totals */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="font-inter font-semibold mb-2">Totals</h2>
        <p className="text-lg">
          Active Users: <span className="font-bold">{totals.activeUsers}</span>
        </p>
      </div>
    </div>
  );
}