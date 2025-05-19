
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
import { PlusCircle, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Sample data for demonstration
const sampleAudits = [
  { id: 1, name: "סקר אבטחה מערכת CRM", status: "בתהליך", date: "2023-05-15", assignedTo: "דוד כהן" },
  { id: 2, name: "סקר אבטחה שרתי מידע", status: "הושלם", date: "2023-04-10", assignedTo: "יעל לוי" },
  { id: 3, name: "סקר תשתיות רשת", status: "ממתין", date: "2023-06-01", assignedTo: "משה ישראלי" },
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [audits, setAudits] = useState(sampleAudits);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAudit, setNewAudit] = useState({
    name: "",
    status: "ממתין",
    assignedTo: "",
    date: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("התנתקת בהצלחה");
    navigate("/");
  };

  const handleAddAudit = () => {
    setIsAddDialogOpen(true);
  };

  const submitNewAudit = () => {
    if (!newAudit.name.trim() || !newAudit.assignedTo.trim()) {
      toast.error("יש למלא את כל השדות החובה");
      return;
    }

    const newId = audits.length > 0 ? Math.max(...audits.map(a => a.id)) + 1 : 1;
    const auditToAdd = {
      id: newId,
      name: newAudit.name,
      status: newAudit.status,
      assignedTo: newAudit.assignedTo,
      date: newAudit.date,
    };

    setAudits([...audits, auditToAdd]);
    setNewAudit({
      name: "",
      status: "ממתין",
      assignedTo: "",
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddDialogOpen(false);
    toast.success("סקר נוסף בהצלחה");
  };

  const handleEditAudit = (id: number) => {
    toast.info(`עריכת סקר מספר ${id}`);
    // In a real application, this would open the edit form for the specific audit
  };

  const handleDeleteAudit = (id: number) => {
    const updatedAudits = audits.filter(audit => audit.id !== id);
    setAudits(updatedAudits);
    toast.success(`סקר מספר ${id} נמחק בהצלחה`);
  };

  const handleStatusChange = (id: number) => {
    const statuses = ["ממתין", "בתהליך", "הושלם"];
    const updatedAudits = audits.map(audit => {
      if (audit.id === id) {
        const currentIndex = statuses.indexOf(audit.status);
        const newIndex = (currentIndex + 1) % statuses.length;
        return { ...audit, status: statuses[newIndex] };
      }
      return audit;
    });
    
    setAudits(updatedAudits);
    toast.success("סטטוס עודכן בהצלחה");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">מערכת ניהול סקרי אבטחת מידע</h1>
          <div className="flex items-center gap-4">
            <span>שלום, {user.name}</span>
            <Button variant="outline" onClick={handleLogout}>התנתק</Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">סקרי אבטחת מידע</h2>
          <Button onClick={handleAddAudit} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            הוסף סקר חדש
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים פעילים</CardTitle>
              <CardDescription>סקרים בתהליך עבודה</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{audits.filter(a => a.status === "בתהליך").length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים שהושלמו</CardTitle>
              <CardDescription>סקרים שהסתיימו</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{audits.filter(a => a.status === "הושלם").length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">סקרים בהמתנה</CardTitle>
              <CardDescription>סקרים שטרם התחילו</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{audits.filter(a => a.status === "ממתין").length}</p>
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
                  <TableHead>תאריך</TableHead>
                  <TableHead>אחראי</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.name}</TableCell>
                    <TableCell>
                      <Button 
                        variant={
                          audit.status === "בתהליך" ? "default" : 
                          audit.status === "הושלם" ? "secondary" : 
                          "outline"
                        }
                        size="sm"
                        onClick={() => handleStatusChange(audit.id)}
                      >
                        {audit.status}
                      </Button>
                    </TableCell>
                    <TableCell>{audit.date}</TableCell>
                    <TableCell>{audit.assignedTo}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditAudit(audit.id)}>
                          ערוך
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAudit(audit.id)}>
                          מחק
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף סקר חדש</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם הסקר *</Label>
              <Input 
                id="name" 
                value={newAudit.name} 
                onChange={(e) => setNewAudit({...newAudit, name: e.target.value})} 
                placeholder="הזן את שם הסקר"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select 
                value={newAudit.status} 
                onValueChange={(value) => setNewAudit({...newAudit, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ממתין">ממתין</SelectItem>
                  <SelectItem value="בתהליך">בתהליך</SelectItem>
                  <SelectItem value="הושלם">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">תאריך</Label>
              <Input 
                id="date" 
                type="date" 
                value={newAudit.date} 
                onChange={(e) => setNewAudit({...newAudit, date: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">אחראי *</Label>
              <Input 
                id="assignedTo" 
                value={newAudit.assignedTo} 
                onChange={(e) => setNewAudit({...newAudit, assignedTo: e.target.value})} 
                placeholder="הזן את שם האחראי"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="submit" onClick={submitNewAudit}>
              הוסף סקר
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                ביטול
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
