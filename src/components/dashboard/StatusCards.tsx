
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusType } from "@/types/types";
import { Audit } from "@/types/types";

interface StatusCountsProps {
  audits: Audit[];
  userRole: string;
  userEmail?: string;
}

// Define the color scheme to match our status colors
const statusColors = {
  new: "#cce5ff", // התקבל - Light Blue
  active: "#ffeeba", // בכתיבה - Orange
  completed: "#c3e6cb", // הסתיים - Dark Green
};

export const StatusCards = ({ audits, userRole, userEmail }: StatusCountsProps) => {
  const getStatusCounts = () => {
    // מקבלים סקרים בהתאם לתפקיד
    const filteredAuditsList = userRole === "מנהלת" 
      ? audits 
      : audits.filter(audit => audit.ownerId === userEmail);
    
    const counts: Record<StatusType, number> = {
      "התקבל": 0,
      "נשלח מייל תיאום למנהל מערכת": 0,
      "נקבע": 0,
      "בכתיבה": 0,
      "שאלות השלמה מול מנהל מערכת": 0,
      "בבקרה": 0,
      "הסתיים": 0
    };
    
    filteredAuditsList.forEach(audit => {
      counts[audit.currentStatus] = (counts[audit.currentStatus] || 0) + 1;
    });
    
    return {
      active: counts["נשלח מייל תיאום למנהל מערכת"] + counts["נקבע"] + counts["בכתיבה"] + counts["שאלות השלמה מול מנהל מערכת"] + counts["בבקרה"],
      completed: counts["הסתיים"],
      new: counts["התקבל"]
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card style={{ borderTop: `4px solid ${statusColors.active}` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">סקרים פעילים</CardTitle>
          <CardDescription>סקרים בתהליך עבודה</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-center">{statusCounts.active}</p>
        </CardContent>
      </Card>
      
      <Card style={{ borderTop: `4px solid ${statusColors.completed}` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">סקרים שהושלמו</CardTitle>
          <CardDescription>סקרים בארכיון</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-center">{statusCounts.completed}</p>
        </CardContent>
      </Card>
      
      <Card style={{ borderTop: `4px solid ${statusColors.new}` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">סקרים חדשים</CardTitle>
          <CardDescription>סקרים שהתקבלו</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-center">{statusCounts.new}</p>
        </CardContent>
      </Card>
    </div>
  );
};
