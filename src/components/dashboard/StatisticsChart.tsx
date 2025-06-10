
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Audit } from '@/types/types';
import { TrendingUp, Users, ClipboardList } from 'lucide-react';

interface StatisticsChartProps {
  audits: Audit[];
}

const STATUS_COLORS = {
  'completed': '#22c55e',
  'inProgress': '#f59e0b', 
  'pending': '#ef4444'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const StatisticsChart: React.FC<StatisticsChartProps> = ({ audits }) => {
  // Data by auditor with better separation
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
    .slice(0, 8);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-200" dir="rtl">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">
                {entry.dataKey === 'total' && 'סה"כ סקרים: '}
                {entry.dataKey === 'completed' && 'הסתיימו: '}
                {entry.dataKey === 'inProgress' && 'בתהליך: '}
                {entry.dataKey === 'pending' && 'ממתינים: '}
              </span>
              <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg" dir="rtl">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-bold">{data.value}</span> סקרים
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" dir="rtl">
      {/* Auditor Statistics - Main Chart */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            סטטיסטיקות סקרים לפי בודק
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={auditorData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 14, fill: '#374151' }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="completed" 
                fill={STATUS_COLORS.completed}
                name="הסתיימו"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="inProgress" 
                fill={STATUS_COLORS.inProgress}
                name="בתהליך"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="pending" 
                fill={STATUS_COLORS.pending}
                name="ממתינים"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.completed }}></div>
              <span className="text-sm font-medium">הסתיימו</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.inProgress }}></div>
              <span className="text-sm font-medium">בתהליך</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.pending }}></div>
              <span className="text-sm font-medium">ממתינים</span>
            </div>
          </div>
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
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            לקוחות מובילים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<PieTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                name="מספר סקרים"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
