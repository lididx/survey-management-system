
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Audit } from '@/types/types';
import { TrendingUp, Users, ClipboardList } from 'lucide-react';

interface StatisticsChartProps {
  audits: Audit[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const StatisticsChart: React.FC<StatisticsChartProps> = ({ audits }) => {
  // Data by auditor
  const auditorStats = audits.reduce((acc, audit) => {
    const owner = audit.ownerName || audit.ownerId || 'לא ידוע';
    if (!acc[owner]) {
      acc[owner] = {
        name: owner,
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
      };
    }
    
    acc[owner].total++;
    
    if (audit.currentStatus === 'הסתיים') {
      acc[owner].completed++;
    } else if (['בכתיבה', 'בבקרה'].includes(audit.currentStatus)) {
      acc[owner].inProgress++;
    } else {
      acc[owner].pending++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const auditorData = Object.values(auditorStats);

  // Status distribution
  const statusStats = audits.reduce((acc, audit) => {
    const status = audit.currentStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusStats).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // Client distribution
  const clientStats = audits.reduce((acc, audit) => {
    const client = audit.clientName || 'לא צוין';
    acc[client] = (acc[client] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const clientData = Object.entries(clientStats)
    .map(([client, count]) => ({ name: client, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 clients

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg" dir="rtl">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'total' && 'סה"כ סקרים: '}
              {entry.dataKey === 'completed' && 'הסתיימו: '}
              {entry.dataKey === 'inProgress' && 'בתהליך: '}
              {entry.dataKey === 'pending' && 'ממתינים: '}
              {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
      {/* Auditor Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            סטטיסטיקות לפי בודק
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={auditorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="#00C49F" name="הסתיימו" />
              <Bar dataKey="inProgress" fill="#FFBB28" name="בתהליך" />
              <Bar dataKey="pending" fill="#FF8042" name="ממתינים" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            התפלגות לפי סטטוס
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            התפלגות לפי לקוח (8 הלקוחות המובילים)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0088FE" name="מספר סקרים" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
