
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Audit } from "@/types/types";
import { AuditorStatistics } from "./AuditorStatistics";

interface StatisticsChartProps {
  audits: Audit[];
}

export const StatisticsChart = ({ audits }: StatisticsChartProps) => {
  // Status distribution data
  const statusCounts = audits.reduce((counts, audit) => {
    const status = audit.currentStatus;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / audits.length) * 100).toFixed(1)
  }));

  // Client distribution (top 10)
  const clientCounts = audits.reduce((counts, audit) => {
    const client = audit.clientName || 'לא צוין';
    counts[client] = (counts[client] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const topClientsData = Object.entries(clientCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([client, count]) => ({
      client: client.length > 20 ? client.substring(0, 20) + '...' : client,
      count
    }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Auditor Statistics - Top Section */}
      <AuditorStatistics audits={audits} />
      
      {/* General Statistics - Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>התפלגות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients Chart */}
        <Card>
          <CardHeader>
            <CardTitle>לקוחות מובילים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="client" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה"כ סקרים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סקרים פעילים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {audits.filter(audit => audit.currentStatus !== 'הסתיים').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סקרים שהסתיימו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {audits.filter(audit => audit.currentStatus === 'הסתיים').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">לקוחות ייחודיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(clientCounts).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
