
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trash2, 
  UserPlus, 
  Key, 
  UserCheck, 
  Shield, 
  FileClock, 
  RefreshCw,
  Check,
  X,
  Eye
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { 
  getUsers, 
  registerUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  generateRandomPassword,
  getAuditLog,
  deactivateUser,
  activateUser
} from "@/utils/localAuth";
import { User, UserRole, AuditLogEntry } from "@/types/types";

interface LocalUser extends User {
  password?: string;
  active?: boolean;
}

const AdminDashboard = () => {
  const { user, handleLogout } = useAuthManager();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [maxLogs, setMaxLogs] = useState(50);
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "בודק" as UserRole,
    isAdmin: false
  });
  
  const [newPassword, setNewPassword] = useState("");
  const [shouldGeneratePassword, setShouldGeneratePassword] = useState(false);
  
  useEffect(() => {
    loadUsers();
    loadAuditLogs();
  }, []);
  
  const loadUsers = () => {
    const allUsers = getUsers();
    // Remove passwords before setting to state
    const sanitizedUsers = allUsers.map(({ password, ...rest }) => rest);
    setUsers(sanitizedUsers);
  };
  
  const loadAuditLogs = () => {
    const logs = getAuditLog(maxLogs);
    setAuditLogs(logs);
  };
  
  // Only admins can access this page
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">גישה נדחתה</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">אין לך הרשאות לצפות בדף זה</p>
            <Button className="w-full" asChild>
              <a href="/dashboard">חזרה לדף הבית</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("נא למלא שם ואימייל");
      return;
    }
    
    let password = newUser.password;
    
    if (shouldGeneratePassword) {
      password = generateRandomPassword();
    } else if (!password) {
      toast.error("נא להזין סיסמה או לסמן 'יצירת סיסמה אוטומטית'");
      return;
    }
    
    const result = registerUser(
      newUser.email,
      password,
      newUser.name,
      newUser.role,
      newUser.isAdmin
    );
    
    if (result.success) {
      if (shouldGeneratePassword) {
        toast.success(`המשתמש נוצר בהצלחה. סיסמה: ${password}`);
      } else {
        toast.success("המשתמש נוצר בהצלחה");
      }
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "בודק",
        isAdmin: false
      });
      setShouldGeneratePassword(false);
      loadUsers();
      loadAuditLogs();
    } else {
      toast.error(result.error || "שגיאה ביצירת המשתמש");
    }
  };
  
  const handleUpdateUserRole = (email: string, role: UserRole) => {
    const result = updateUser(email, { role });
    if (result.success) {
      toast.success("התפקיד עודכן בהצלחה");
      loadUsers();
      loadAuditLogs();
    } else {
      toast.error(result.error || "שגיאה בעדכון התפקיד");
    }
  };
  
  const handleUpdateAdminStatus = (email: string, isAdmin: boolean) => {
    const result = updateUser(email, { isAdmin });
    if (result.success) {
      toast.success(`הרשאות מנהל ${isAdmin ? 'הוענקו' : 'הוסרו'} בהצלחה`);
      loadUsers();
      loadAuditLogs();
    } else {
      toast.error(result.error || "שגיאה בעדכון הרשאות מנהל");
    }
  };
  
  const handleUserStatusToggle = (email: string, isActive: boolean) => {
    const result = isActive ? deactivateUser(email) : activateUser(email);
    
    if (result.success) {
      toast.success(`המשתמש ${isActive ? 'הושבת' : 'הופעל'} בהצלחה`);
      loadUsers();
      loadAuditLogs();
    } else {
      toast.error(result.error || `שגיאה ב${isActive ? 'השבתת' : 'הפעלת'} המשתמש`);
    }
  };
  
  const handleDeleteUser = (email: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${email}?`)) {
      const result = deleteUser(email);
      if (result.success) {
        toast.success("המשתמש נמחק בהצלחה");
        loadUsers();
        loadAuditLogs();
      } else {
        toast.error(result.error || "שגיאה במחיקת המשתמש");
      }
    }
  };
  
  const handleResetPassword = () => {
    if (!selectedUser) {
      toast.error("לא נבחר משתמש");
      return;
    }
    
    let password = newPassword;
    
    if (shouldGeneratePassword) {
      password = generateRandomPassword();
    } else if (!password) {
      toast.error("נא להזין סיסמה או לסמן 'יצירת סיסמה אוטומטית'");
      return;
    }
    
    const result = resetUserPassword(selectedUser.email, password);
    if (result.success) {
      if (shouldGeneratePassword) {
        toast.success(`הסיסמה אופסה בהצלחה. סיסמה חדשה: ${password}`);
      } else {
        toast.success("הסיסמה אופסה בהצלחה");
      }
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setShouldGeneratePassword(false);
      loadAuditLogs();
    } else {
      toast.error(result.error || "שגיאה באיפוס הסיסמה");
    }
  };
  
  const openResetPasswordDialog = (user: LocalUser) => {
    setSelectedUser(user);
    setNewPassword("");
    setShouldGeneratePassword(false);
    setIsResetPasswordOpen(true);
  };
  
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "לא ידוע";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  const getActionDescription = (action: string) => {
    switch(action) {
      case "login_success": return "כניסה למערכת";
      case "login_failed": return "ניסיון כניסה נכשל";
      case "logout": return "יציאה מהמערכת";
      case "user_created": return "יצירת משתמש";
      case "user_updated": return "עדכון משתמש";
      case "user_deleted": return "מחיקת משתמש";
      case "password_reset": return "איפוס סיסמה";
      default: return action;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">ניהול מערכת</h2>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              ניהול משתמשים
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileClock className="h-4 w-4" />
              יומן אירועים
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">משתמשי המערכת</h3>
              <Button 
                onClick={() => setIsAddUserOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                הוסף משתמש חדש
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>תפקיד</TableHead>
                      <TableHead>מנהל מערכת</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>כניסה אחרונה</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.email} className={!user.active ? "bg-gray-100 opacity-60" : ""}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(value: UserRole) => handleUpdateUserRole(user.email, value)}
                            disabled={!user.active}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder={user.role} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="בודק">בודק</SelectItem>
                              <SelectItem value="מנהלת">מנהל/ת</SelectItem>
                              <SelectItem value="מנהל מערכת">מנהל מערכת</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={user.isAdmin} 
                              onChange={(e) => handleUpdateAdminStatus(user.email, e.target.checked)}
                              className="mr-2 h-4 w-4"
                              disabled={!user.active}
                            />
                            {user.isAdmin ? 'כן' : 'לא'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.active ? "success" : "destructive"}>
                            {user.active ? 'פעיל' : 'לא פעיל'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(user.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openResetPasswordDialog(user)}
                              disabled={!user.active}
                              title="איפוס סיסמה"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUserStatusToggle(user.email, user.active !== false)}
                              className={user.active ? "text-amber-500" : "text-green-500"}
                              title={user.active ? "השבת משתמש" : "הפעל משתמש"}
                            >
                              {user.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteUser(user.email)}
                              title="מחק משתמש"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">יומן אירועים</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="maxLogs">מקסימום רשומות:</Label>
                  <Select
                    value={maxLogs.toString()}
                    onValueChange={(value) => setMaxLogs(parseInt(value))}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder={maxLogs} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAuditLogs}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  רענן
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0 overflow-auto">
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
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>{log.userName} ({log.userId})</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getActionDescription(log.action)}</Badge>
                          </TableCell>
                          <TableCell>{log.details || "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">אין רשומות להצגה</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>הוסף משתמש חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            {!shouldGeneratePassword && (
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="generatePassword"
                checked={shouldGeneratePassword} 
                onChange={(e) => setShouldGeneratePassword(e.target.checked)}
                className="mr-2"
              />
              <Label htmlFor="generatePassword">יצירת סיסמה אוטומטית</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="בודק">בודק</SelectItem>
                  <SelectItem value="מנהלת">מנהל/ת</SelectItem>
                  <SelectItem value="מנהל מערכת">מנהל מערכת</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isAdmin"
                checked={newUser.isAdmin} 
                onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                className="mr-2"
              />
              <Label htmlFor="isAdmin">מנהל מערכת</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
              ביטול
            </Button>
            <Button type="button" onClick={handleAddUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              הוסף משתמש
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>איפוס סיסמה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>איפוס סיסמה עבור: {selectedUser?.name} ({selectedUser?.email})</p>
            {!shouldGeneratePassword && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">סיסמה חדשה</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="generateResetPassword"
                checked={shouldGeneratePassword} 
                onChange={(e) => setShouldGeneratePassword(e.target.checked)}
                className="mr-2"
              />
              <Label htmlFor="generateResetPassword">יצירת סיסמה אוטומטית</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              ביטול
            </Button>
            <Button type="button" onClick={handleResetPassword}>
              <Key className="h-4 w-4 mr-2" />
              איפוס סיסמה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
