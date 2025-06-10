
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Activity, Copy, CheckCircle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { createUser, getUsers, getAuditLog } from "@/utils/supabaseAuth";
import { User, AuditLogEntry, UserRole } from "@/types/types";

const AdminDashboard = () => {
  const { user: currentUser } = useAuthManager();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "בודק" as UserRole
  });

  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadUsers();
      loadAuditLog();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const userData = await getUsers();
      setUsers(userData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("שגיאה בטעינת רשימת המשתמשים");
    }
  };

  const loadAuditLog = async () => {
    try {
      const logData = await getAuditLog(50); // Last 50 entries
      setAuditLog(logData);
    } catch (error) {
      console.error("Error loading audit log:", error);
      toast.error("שגיאה בטעינת יומן הפעילות");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (!newUser.email || !newUser.name || !newUser.role) {
      toast.error("אנא מלא את כל השדות");
      return;
    }

    setIsLoading(true);
    try {
      const { success, user: createdUser, temporaryPassword, error } = await createUser(
        newUser.email,
        newUser.name,
        newUser.role,
        currentUser.id
      );

      if (!success || error) {
        toast.error("שגיאה ביצירת משתמש", {
          description: error || "אנא נסה שוב מאוחר יותר",
        });
      } else {
        toast.success("משתמש נוצר בהצלחה", {
          description: `נוצרה סיסמה זמנית עבור ${newUser.name}`,
        });

        // Show temporary password
        if (temporaryPassword) {
          toast.info("סיסמה זמנית נוצרה", {
            description: `סיסמה זמנית: ${temporaryPassword}`,
            duration: 10000,
          });
        }

        // Reset form
        setNewUser({ email: "", name: "", role: "בודק" });
        
        // Reload users list
        await loadUsers();
        await loadAuditLog();
      }
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("שגיאה ביצירת משתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(text);
      toast.success("הסיסמה הועתקה ללוח");
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (error) {
      toast.error("שגיאה בהעתקה ללוח");
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">אין לך הרשאה לגשת לדף זה</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={() => {}}
        onNavigateToAdmin={() => {}}
        onNotificationClick={() => {}}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">ניהול מערכת</h2>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              ניהול משתמשים
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              יומן פעילות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Create New User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  הוספת משתמש חדש
                </CardTitle>
                <CardDescription>
                  יצירת משתמש חדש במערכת עם סיסמה זמנית
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="email">כתובת אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">שם מלא</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="שם המשתמש"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">תפקיד</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="בודק">בודק</SelectItem>
                          <SelectItem value="מנהלת">מנהל/ת</SelectItem>
                          <SelectItem value="מנהל מערכת">מנהל מערכת</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "יוצר משתמש..." : "צור משתמש"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>רשימת משתמשים</CardTitle>
                <CardDescription>
                  כל המשתמשים הרשומים במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>תפקיד</TableHead>
                      <TableHead>כניסה אחרונה</TableHead>
                      <TableHead>סטטוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString('he-IL')
                            : "לא התחבר עדיין"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600">
                            פעיל
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>יומן פעילות המערכת</CardTitle>
                <CardDescription>
                  רישום של כל הפעולות שבוצעו במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך ושעה</TableHead>
                      <TableHead>משתמש</TableHead>
                      <TableHead>פעולה</TableHead>
                      <TableHead>פרטים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.timestamp).toLocaleString('he-IL')}
                        </TableCell>
                        <TableCell>{entry.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
