
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, X, Edit, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import { Audit, StatusType, Contact, User, UserRole } from "@/types/types";
import { AuditForm } from "@/components/AuditForm";
import { StatusLogView } from "@/components/StatusLogView";
import { EmailTemplatePopup } from "@/components/EmailTemplatePopup";
import { RecipientCountInput } from "@/components/RecipientCountInput";

// נתונים לדוגמה
const sampleAudits: Audit[] = [
  {
    id: "1",
    name: "סקר אבטחה מערכת CRM",
    description: "סקר אבטחת מידע למערכת CRM של החברה",
    contacts: [
      { id: "c1", fullName: "יוסי כהן", role: "מנהל מערכת", email: "yossi@example.com", phone: "050-1234567" }
    ],
    receivedDate: new Date("2023-05-15"),
    plannedMeetingDate: new Date("2023-06-01"),
    currentStatus: "בכתיבה",
    statusLog: [
      {
        id: "s1",
        timestamp: new Date("2023-05-15"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s2",
        timestamp: new Date("2023-05-16"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום"
      },
      {
        id: "s3",
        timestamp: new Date("2023-05-18"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-01"),
        reason: "התקבל אישור לפגישה"
      },
      {
        id: "s4",
        timestamp: new Date("2023-06-02"),
        oldStatus: "נקבע",
        newStatus: "בכתיבה",
        oldDate: null,
        newDate: null,
        reason: "הפגישה הסתיימה, התחלת כתיבת הסקר"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "2",
    name: "סקר אבטחה שרתי מידע",
    description: "סקר אבטחת מידע לשרתי המידע של החברה",
    contacts: [
      { id: "c2", fullName: "שרה לוי", role: "מנהלת תשתיות", email: "sarah@example.com", phone: "050-7654321" },
      { id: "c3", fullName: "דוד ישראלי", role: "מנהל אבטחת מידע", email: "david@example.com", phone: "052-1234567" }
    ],
    receivedDate: new Date("2023-04-10"),
    plannedMeetingDate: null,
    currentStatus: "הסתיים",
    statusLog: [
      {
        id: "s5",
        timestamp: new Date("2023-04-10"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s6",
        timestamp: new Date("2023-04-20"),
        oldStatus: "התקבל",
        newStatus: "הסתיים",
        oldDate: null,
        newDate: null,
        reason: "הסקר הסתיים מכיוון שהוחלט לדחות את הפרויקט"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "3",
    name: "סקר תשתיות רשת",
    description: "סקר אבטחת מידע לתשתיות הרשת",
    contacts: [
      { id: "c4", fullName: "רחל גולן", role: "מנהלת רשת", email: "rachel@example.com", phone: "054-9876543" }
    ],
    receivedDate: new Date("2023-06-01"),
    plannedMeetingDate: new Date("2023-06-15"),
    currentStatus: "נקבע",
    statusLog: [
      {
        id: "s7",
        timestamp: new Date("2023-06-01"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s8",
        timestamp: new Date("2023-06-02"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום"
      },
      {
        id: "s9",
        timestamp: new Date("2023-06-05"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-15"),
        reason: "התקבל אישור לפגישה"
      }
    ],
    ownerId: "moran@example.com"
  }
];

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [audits, setAudits] = useState<Audit[]>(sampleAudits);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [recipientCount, setRecipientCount] = useState<number>(1);
  
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.email || !parsedUser.role) {
        throw new Error("נתוני משתמש חסרים");
      }
      
      setUser(parsedUser);
      
      // בדיקה של סקרים שלא התעדכנו מעל 7 ימים
      const checkStaleAudits = () => {
        const staleDays = 7; // סף של 7 ימים
        const now = new Date();
        const staleThreshold = new Date(now.setDate(now.getDate() - staleDays));
        
        audits.forEach(audit => {
          const statusLog = audit.statusLog;
          if (!statusLog || statusLog.length === 0) return;
          
          // שליפת השינוי האחרון בסטטוס
          const latestChange = [...statusLog].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          const lastChangeDate = new Date(latestChange.timestamp);
          
          // בדיקה אם הסטטוס הוא אחד מאלה שצריך לנטר ונשאר קפוא
          if (
            (audit.currentStatus === "נשלח מייל תיאום למנהל מערכת" || 
             audit.currentStatus === "שאלות השלמה מול מנהל מערכת") && 
            lastChangeDate < staleThreshold
          ) {
            // באפליקציה אמיתית, היינו שולחים כאן מייל
            // בינתיים, נציג הודעת toast
            toast.info(
              `תזכורת: סטטוס סקר '${audit.name}' לא השתנה`,
              { 
                description: `הסטטוס של הסקר '${audit.name}' עדיין ב-${audit.currentStatus} מעל 7 ימים. אנא עדכן/י בהקדם.`,
                duration: 10000
              }
            );
          }
        });
      };
      
      // בדיקה פעם אחת בטעינה ואז הגדרת בדיקה יומית
      // באפליקציה אמיתית, זה יהיה תהליך מתוזמן בצד השרת
      checkStaleAudits();
      const interval = setInterval(checkStaleAudits, 24 * 60 * 60 * 1000); // פעם ביום
      
      return () => clearInterval(interval);
    } catch (error) {
      toast.error("שגיאה בטעינת נתוני משתמש");
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate, audits]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("התנתקת בהצלחה");
    navigate("/");
  };

  // בדיקת הרשאות למחיקה והוספה
  const canDelete = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלות לא יכולות למחוק רשומות
    if (user.role === "מנהלת") return false;
    
    // בודקים יכולים למחוק רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  const canEdit = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלות יכולות לערוך כל רשומה
    if (user.role === "מנהלת") return true;
    
    // בודקים יכולים לערוך רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  const handleCreateAudit = () => {
    setFormMode("create");
    setCurrentAudit(null);
    setIsFormOpen(true);
  };

  const handleEditAudit = (audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
    setIsEditSheetOpen(true);
  };

  const handleExpandLog = (auditId: string) => {
    if (expandedAuditId === auditId) {
      setExpandedAuditId(null);
    } else {
      setExpandedAuditId(auditId);
    }
  };

  const handleDeleteAudit = (id: string) => {
    const auditToDelete = audits.find(a => a.id === id);
    if (!auditToDelete) {
      toast.error("לא נמצא סקר למחיקה");
      return;
    }
    
    if (!canDelete(auditToDelete.ownerId)) {
      toast.error("אין לך הרשאה למחוק סקר זה");
      return;
    }
    
    const updatedAudits = audits.filter(audit => audit.id !== id);
    setAudits(updatedAudits);
    toast.success(`סקר נמחק בהצלחה`);
  };

  const handleAuditSubmit = (auditData: Partial<Audit>) => {
    if (formMode === "create" && user) {
      const newId = Date.now().toString();
      const newAudit = {
        ...auditData,
        id: newId,
        receivedDate: new Date(),
        currentStatus: "התקבל" as StatusType,
        statusLog: [{
          id: `log-${newId}`,
          timestamp: new Date(),
          oldStatus: null,
          newStatus: "התקבל" as StatusType,
          oldDate: null,
          newDate: null,
          reason: "יצירת סקר"
        }],
        ownerId: user.email
      } as Audit;

      setAudits([...audits, newAudit]);
      setIsFormOpen(false);
      toast.success("סקר חדש נוצר בהצלחה");
      
      // הצגת שדה מספר נמענים לאחר היצירה
      setNewlyCreatedAudit(newAudit);
      setShowRecipientInput(true);
    } else if (formMode === "edit" && currentAudit) {
      
      // בדיקת הרשאות עריכה
      if (!canEdit(currentAudit.ownerId)) {
        toast.error("אין לך הרשאה לערוך את הסקר הזה");
        return;
      }
      
      const updatedAudits = audits.map(audit => 
        audit.id === currentAudit.id ? { ...audit, ...auditData } : audit
      );
      setAudits(updatedAudits);
      setIsEditSheetOpen(false);
      toast.success("סקר עודכן בהצלחה");
      
      // אם הסטטוס שונה ל"בבקרה", שלח הודעה למנהל
      if (auditData.currentStatus === "בבקרה" && currentAudit.currentStatus !== "בבקרה") {
        // באפליקציה אמיתית, היינו שולחים מייל אמיתי
        toast.info("נשלחה התראה למנהלת על סקר לבקרה", {
          description: `סקר "${auditData.name}" עבר לסטטוס בקרה`
        });
      }
    }
  };

  const handleRecipientCountSubmitted = (count: number) => {
    setRecipientCount(count);
    setShowRecipientInput(false);
    setShowEmailTemplate(true);
  };

  const getStatusCounts = () => {
    // מקבלים סקרים בהתאם לתפקיד
    const filteredAuditsList = user?.role === "מנהלת" 
    ? audits 
    : audits.filter(audit => audit.ownerId === user?.email);
    
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
  
  const formatDate = (date: Date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("he-IL");
  };
  
  const getStatusBadge = (status: StatusType) => {
    let variant = "outline";
    
    switch (status) {
      case "התקבל":
        variant = "secondary";
        break;
      case "בכתיבה":
      case "נקבע":
        variant = "default";
        break;
      case "בבקרה":
        variant = "destructive";
        break;
      case "הסתיים":
        variant = "secondary";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  if (!user) return null;

  // סינון הסקרים בהתאם לתפקיד והרשאות המשתמש
  const filteredAudits = user.role === "מנהלת" 
    ? audits 
    : audits.filter(audit => audit.ownerId === user.email);

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">מערכת ניהול סקרי אבטחת מידע</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold">{user.name}</span>
              <span className="mx-1">|</span>
              <Badge variant={user.role === "מנהלת" ? "destructive" : "default"}>
                {user.role}
              </Badge>
            </div>
            <Button variant="outline" onClick={handleLogout}>התנתק</Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">סקרי אבטחת מידע</h2>
          {user.role === "בודק" && (
            <Button onClick={handleCreateAudit} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              הוסף סקר חדש
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים פעילים</CardTitle>
              <CardDescription>סקרים בתהליך עבודה</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statusCounts.active}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים שהושלמו</CardTitle>
              <CardDescription>סקרים שהסתיימו</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statusCounts.completed}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים חדשים</CardTitle>
              <CardDescription>סקרים שהתקבלו</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statusCounts.new}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>רשימת סקרים</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הסקר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך פגישה</TableHead>
                  <TableHead>אנשי קשר</TableHead>
                  <TableHead>תאריך קבלה</TableHead>
                  {user.role === "מנהלת" && <TableHead>בעלים</TableHead>}
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.length > 0 ? (
                  filteredAudits.map((audit) => (
                    <>
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium">{audit.name}</TableCell>
                        <TableCell>
                          {getStatusBadge(audit.currentStatus)}
                        </TableCell>
                        <TableCell>
                          {audit.plannedMeetingDate ? formatDate(audit.plannedMeetingDate) : "לא נקבע"}
                        </TableCell>
                        <TableCell>{audit.contacts.length}</TableCell>
                        <TableCell>{formatDate(audit.receivedDate)}</TableCell>
                        {user.role === "מנהלת" && <TableCell>{audit.ownerId.split('@')[0]}</TableCell>}
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit(audit.ownerId) && (
                              <Button variant="outline" size="sm" onClick={() => handleEditAudit(audit)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setNewlyCreatedAudit(audit);
                                setShowRecipientInput(true);
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExpandLog(audit.id)}>
                              {expandedAuditId === audit.id ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                            {canDelete(audit.ownerId) && (
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteAudit(audit.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedAuditId === audit.id && (
                        <TableRow>
                          <TableCell colSpan={user.role === "מנהלת" ? 7 : 6} className="p-4 bg-gray-50">
                            <StatusLogView statusLog={audit.statusLog} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={user.role === "מנהלת" ? 7 : 6} className="text-center py-4">
                      לא נמצאו סקרים
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* חלון יצירת סקר חדש */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת סקר חדש</DialogTitle>
          </DialogHeader>
          <AuditForm 
            mode="create"
            onSubmit={handleAuditSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* חלון עריכת סקר */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="left" className="w-full max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>עריכת סקר</SheetTitle>
          </SheetHeader>
          {currentAudit && (
            <AuditForm 
              mode="edit"
              audit={currentAudit}
              onSubmit={handleAuditSubmit}
              onCancel={() => setIsEditSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* חלון הזנת מספר נמענים */}
      {newlyCreatedAudit && (
        <RecipientCountInput
          audit={newlyCreatedAudit}
          open={showRecipientInput}
          onCancel={() => setShowRecipientInput(false)}
          onConfirm={handleRecipientCountSubmitted}
        />
      )}

      {/* חלון תבנית מייל */}
      {newlyCreatedAudit && (
        <EmailTemplatePopup
          audit={newlyCreatedAudit}
          recipientCount={recipientCount}
          open={showEmailTemplate}
          onClose={() => {
            setShowEmailTemplate(false);
            setNewlyCreatedAudit(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
