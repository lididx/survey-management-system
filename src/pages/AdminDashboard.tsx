
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, UserPlus, Key, UserCheck, Shield } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getUsers, registerUser, updateUser, deleteUser, resetUserPassword } from "@/utils/localAuth";
import { User, UserRole } from "@/types/types";

interface LocalUser extends User {
  password?: string;
}

const AdminDashboard = () => {
  const { user, handleLogout } = useAuthManager();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "בודק" as UserRole,
    isAdmin: false
  });
  
  const [newPassword, setNewPassword] = useState("");
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = () => {
    const allUsers = getUsers();
    // Remove passwords before setting to state
    const sanitizedUsers = allUsers.map(({ password, ...rest }) => rest);
    setUsers(sanitizedUsers);
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
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    
    const result = registerUser(
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.role,
      newUser.isAdmin
    );
    
    if (result.success) {
      toast.success("המשתמש נוצר בהצלחה");
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "בודק",
        isAdmin: false
      });
      loadUsers();
    } else {
      toast.error(result.error || "שגיאה ביצירת המשתמש");
    }
  };
  
  const handleUpdateUserRole = (email: string, role: UserRole) => {
    const result = updateUser(email, { role });
    if (result.success) {
      toast.success("התפקיד עודכן בהצלחה");
      loadUsers();
    } else {
      toast.error(result.error || "שגיאה בעדכון התפקיד");
    }
  };
  
  const handleUpdateAdminStatus = (email: string, isAdmin: boolean) => {
    const result = updateUser(email, { isAdmin });
    if (result.success) {
      toast.success(`הרשאות מנהל ${isAdmin ? 'הוענקו' : 'הוסרו'} בהצלחה`);
      loadUsers();
    } else {
      toast.error(result.error || "שגיאה בעדכון הרשאות מנהל");
    }
  };
  
  const handleDeleteUser = (email: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${email}?`)) {
      const result = deleteUser(email);
      if (result.success) {
        toast.success("המשתמש נמחק בהצלחה");
        loadUsers();
      } else {
        toast.error(result.error || "שגיאה במחיקת המשתמש");
      }
    }
  };
  
  const handleResetPassword = () => {
    if (!selectedUser || !newPassword) {
      toast.error("נא למלא סיסמה חדשה");
      return;
    }
    
    const result = resetUserPassword(selectedUser.email, newPassword);
    if (result.success) {
      toast.success("הסיסמה אופסה בהצלחה");
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } else {
      toast.error(result.error || "שגיאה באיפוס הסיסמה");
    }
  };
  
  const openResetPasswordDialog = (user: LocalUser) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">ניהול משתמשים</h2>
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            הוסף משתמש חדש
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>משתמשי המערכת</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>מנהל מערכת</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(value: UserRole) => handleUpdateUserRole(user.email, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder={user.role} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="בודק">בודק</SelectItem>
                          <SelectItem value="מנהלת">מנהל/ת</SelectItem>
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
                        />
                        {user.isAdmin ? 'כן' : 'לא'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.email)}
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
      </main>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl">
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
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
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
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>איפוס סיסמה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>איפוס סיסמה עבור: {selectedUser?.name} ({selectedUser?.email})</p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
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
