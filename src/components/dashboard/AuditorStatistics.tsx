
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Audit } from "@/types/types";
import { UserCircle, BarChart3 } from "lucide-react";

interface AuditorStatisticsProps {
  audits: Audit[];
}

export const AuditorStatistics = ({ audits }: AuditorStatisticsProps) => {
  // Group audits by auditor (ownerId)
  const auditorGroups = audits.reduce((groups, audit) => {
    const ownerId = audit.ownerId || 'Unknown';
    const ownerName = audit.ownerName || 'Unknown';
    
    if (!groups[ownerId]) {
      groups[ownerId] = {
        name: ownerName,
        email: ownerId,
        audits: []
      };
    }
    
    groups[ownerId].audits.push(audit);
    return groups;
  }, {} as Record<string, { name: string; email: string; audits: Audit[] }>);

  // Calculate statistics for each auditor
  const auditorStats = Object.values(auditorGroups).map(group => {
    const statusCounts = group.audits.reduce((counts, audit) => {
      const status = audit.currentStatus;
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      name: group.name,
      email: group.email,
      totalAudits: group.audits.length,
      statusCounts,
      completedAudits: statusCounts['הסתיים'] || 0,
      activeAudits: group.audits.length - (statusCounts['הסתיים'] || 0)
    };
  });

  // Sort by total audits (descending)
  auditorStats.sort((a, b) => b.totalAudits - a.totalAudits);

  const statusColors = {
    "התקבל": "bg-blue-100 text-blue-800",
    "נשלח מייל תיאום למנהל מערכת": "bg-yellow-100 text-yellow-800",
    "נקבע": "bg-green-100 text-green-800",
    "בכתיבה": "bg-orange-100 text-orange-800",
    "שאלות השלמה מול מנהל מערכת": "bg-red-100 text-red-800",
    "בבקרה": "bg-purple-100 text-purple-800",
    "הסתיים": "bg-gray-100 text-gray-800"
  };

  const allStatuses = ["התקבל", "נשלח מייל תיאום למנהל מערכת", "נקבע", "בכתיבה", "שאלות השלמה מול מנהל מערכת", "בבקרה", "הסתיים"];

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            סיכום לפי בודק
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">בודק</TableHead>
                  <TableHead className="text-center">סה"כ סקרים</TableHead>
                  <TableHead className="text-center">סקרים פעילים</TableHead>
                  <TableHead className="text-center">סקרים שהסתיימו</TableHead>
                  <TableHead className="text-center">פירוט לפי סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditorStats.map((auditor) => (
                  <TableRow key={auditor.email}>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <UserCircle className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{auditor.name}</div>
                          <div className="text-sm text-gray-500">{auditor.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {auditor.totalAudits}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {auditor.activeAudits}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-green-600">
                        {auditor.completedAudits}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center max-w-md">
                        {allStatuses.map(status => {
                          const count = auditor.statusCounts[status] || 0;
                          if (count === 0) return null;
                          
                          return (
                            <Badge
                              key={status}
                              variant="outline"
                              className={`text-xs ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {status}: {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {auditorStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      אין נתונים להצגה
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
