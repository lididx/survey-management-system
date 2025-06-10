
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Shield, Key, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, UserRole } from "@/types/types";
import { useAuthManager } from "@/hooks/useAuthManager";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Mock users data - in real app this would come from Supabase
const mockUsers: User[] = [
  {
    id: "1",
    name: "לידור",
    email: "lidor@example.com",
    role: "בודק",
    isAdmin: false,
    active: true,
    lastLogin: new Date()
  },
  {
    id: "2", 
    name: "מורן",
    email: "moran@example.com",
    role: "בודק",
    isAdmin: false,
    active: true,
    lastLogin: new Date()
  },
  {
    id: "3",
    name: "חן", 
    email: "chen@example.com",
    role: "מנהלת",
    isAdmin: false,
    active: true,
    lastLogin: new Date()
  },
  {
    id: "4",
    name: "לידור מנהל",
    email: "admin@system.com", 
    role: "מנהל מערכת",
    isAdmin: true,
    active: true,
    lastLogin: new Date()
  }
];

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "בודק" as UserRole,
    password: ""
  });
  const navigate = useNavigate();
  const { user } = useAuthManager();

  // Generate secure password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleResetPassword = (userId: string, userName: string) => {
    const newPassword = generatePassword();
    
    // In real app, this would call Supabase API
    console.log(`Resetting password for user ${userId}: ${newPassword}`);
    
    toast.success(
      `סיסמא חדשה נוצרה עבור ${userName}`,
      {
        description: `הסיסמא החדשה: ${newPassword}`,
        duration: 10000,
        action: {
          label: "העתק",
          onClick: () => {
            navigator.clipboard.writeText(newPassword);
            toast.success("הסיסמא הועתקה ללוח");
          }
        }
      }
    );
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("יש למלא את כל השדות");
      return;
    }

    const user: User = {
      id: String(users.length + 1),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isAdmin: newUser.role === "מנהל מערכת",
      active: true,
      lastLogin: new Date()
    };

    setUsers([...users, user]);
    setNewUser({ name: "", email: "", role: "בודק", password: "" });
    setShowAddUser(false);
    
    toast.success(`משתמש ${newUser.name} נוסף בהצלחה`);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, active: !u.active } : u
    ));
    
    const user = users.find(u => u.id === userId);
    toast.success(`המשתמש ${user?.name} ${user?.active ? 'הושבת' : 'הופעל'}`);
  };

  const formatLastLogin = (date: Date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackToHome = () => {
    navigate("/dashboard");
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">אין הרשאה</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">אין לך הרשאה לגשת לעמוד זה</p>
            <Button onClick={handleBackToHome}>חזור לעמוד הבית</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={() => navigate("/archive")}
        onNavigateToAdmin={() => {}}
        onNotificationClick={() => {}}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              עמוד הבית
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h2 className="text-xl font-semibold">ניהול מערכת</h2>
            </div>
          </div>
          
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                הוסף משתמש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת משתמש חדש</DialogTitle>
                <DialogDescription>
                  מלא את פרטי המשתמש החדש
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="הכנס שם מלא"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">כתובת מייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="הכנס כתובת מייל"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">תפקיד</Label>
                  <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר תפקיד" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="בודק">בודק</SelectItem>
                      <SelectItem value="מנהלת">מנהלת</SelectItem>
                      <SelectItem value="מנהל מערכת">מנהל מערכת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">סיסמא</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="הכנס סיסמא"
                      className="text-right"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNewUser({...newUser, password: generatePassword()})}
                    >
                      צור סיסמא
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddUser}>
                    הוסף משתמש
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              רשימת משתמשים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-right">
                    <TableHead className="text-center font-medium">שם</TableHead>
                    <TableHead className="text-center font-medium">מייל</TableHead>
                    <TableHead className="text-center font-medium">תפקיד</TableHead>
                    <TableHead className="text-center font-medium">סטטוס</TableHead>
                    <TableHead className="text-center font-medium">כניסה אחרונה</TableHead>
                    <TableHead className="text-center font-medium">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-center font-medium">{u.name}</TableCell>
                      <TableCell className="text-center">{u.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.isAdmin ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.active ? "default" : "destructive"}>
                          {u.active ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {u.lastLogin ? formatLastLogin(u.lastLogin) : "לא התחבר עדיין"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(u.id!, u.name)}
                            className="flex items-center gap-1"
                          >
                            <Key className="h-3 w-3" />
                            איפוס סיסמא
                          </Button>
                          <Button
                            variant={u.active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleUserStatus(u.id!)}
                          >
                            {u.active ? "השבת" : "הפעל"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
