
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Audit } from '@/types/types';
import { AuditorStatistics } from './AuditorStatistics';

interface StatisticsChartProps {
  audits: Audit[];
}

export const StatisticsChart = ({ audits }: StatisticsChartProps) => {
  // Count audits by status
  const statusCounts = audits.reduce((acc, audit) => {
    const status = audit.currentStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for charts
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.length > 15 ? status.substring(0, 15) + '...' : status,
    fullStatus: status,
    count
  }));

  // Count audits sent to review
  const reviewCount = statusCounts['בבקרה'] || 0;
  const completedCount = statusCounts['הסתיים'] || 0;
  const totalAudits = audits.length;
  const activeAudits = totalAudits - completedCount;

  // Summary data
  const summaryData = [
    { name: 'סך כל הסקרים', value: totalAudits },
    { name: 'סקרים פעילים', value: activeAudits },
    { name: 'הועברו לבקרה', value: reviewCount },
    { name: 'הסתיימו', value: completedCount }
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryData.map((item, index) => (
          <Card key={item.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-center" style={{ color: COLORS[index] }}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">פירוט לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="status" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [value, props.payload.fullStatus]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullStatus || label}
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">סיכום כללי</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {summaryData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-xs">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auditor Statistics */}
      <AuditorStatistics audits={audits} />
    </div>
  );
};
