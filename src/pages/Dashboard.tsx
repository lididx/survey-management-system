
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
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
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">ברוך הבא למערכת ניהול סקרי אבטחת מידע</h2>
          <p className="mb-4">תפקיד שלך במערכת: <strong>{user.role}</strong></p>
          <p>בקרוב תוכל לראות כאן את רשימת הסקרים שלך וליצור סקרים חדשים.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
