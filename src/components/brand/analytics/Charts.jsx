# Create the Charts.jsx file content
charts_content = '''import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const SimpleLine = ({ data, color, label }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke={color} name={label} />
    </LineChart>
  </ResponsiveContainer>
);

export const SimpleBar = ({ data, color, label }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill={color} name={label} />
    </BarChart>
  </ResponsiveContainer>
);'''

# Write to file
with open('Charts.jsx', 'w') as f:
    f.write(charts_content)

print("Charts.jsx file created successfully!")
print("\nFile structure should now be:")
print("src/")
print("  components/")
print("    brand/")
print("      analytics/")
print("        Charts.jsx")