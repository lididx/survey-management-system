
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { toast } from "sonner";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    // Check if Supabase is properly connected
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('audits').select('count').limit(1);
        
        if (error) {
          console.error("Supabase connection error:", error);
          setIsSupabaseConnected(false);
          toast.error("שגיאה בהתחברות למסד הנתונים", {
            description: "אנא בדוק את הגדרות החיבור"
          });
        } else {
          console.log("Supabase connected successfully!");
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err);
        setIsSupabaseConnected(false);
        toast.error("שגיאה בבדיקת החיבור למסד הנתונים");
      }
    };
    
    // Run the check
    checkSupabaseConnection();
  }, [supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">מערכת ניהול סקרי אבטחת מידע</CardTitle>
          <CardDescription>התחבר או הירשם למערכת</CardDescription>
          {isSupabaseConnected === false && (
            <div className="mt-2 p-2 bg-red-100 text-red-800 rounded-md text-sm">
              אזהרה: לא ניתן להתחבר למסד הנתונים. אנא בדוק שהגדרות Supabase מוגדרות כראוי.
            </div>
          )}
          {isSupabaseConnected === true && (
            <div className="mt-2 p-2 bg-green-100 text-green-800 rounded-md text-sm">
              מסד הנתונים מחובר בהצלחה.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">כניסה למערכת</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
