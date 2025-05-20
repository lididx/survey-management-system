
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { loginUser } from "@/utils/localAuth";

const loginSchema = z.object({
  email: z.string().email("נדרשת כתובת אימייל תקינה"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// משתמשים לדוגמה במערכת
const mockUsers = [
  { email: "lidor@example.com", password: "password123", role: "בודק", name: "לידור" },
  { email: "moran@example.com", password: "password123", role: "בודק", name: "מורן" },
  { email: "chen@example.com", password: "password123", role: "מנהלת", name: "חן" }
];

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // אימות באמצעות מערכת האימות המקומית
      const { success, user, error } = loginUser(data.email, data.password);
      
      if (!success || error) {
        toast.error("פרטי התחברות שגויים", {
          description: error || "אימייל או סיסמה אינם נכונים",
        });
      } else {
        // התחברות מוצלחת
        toast.success("התחברת בהצלחה", {
          description: `ברוך הבא ${user?.name}! מועבר לדף הבית...`,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("שגיאה בהתחברות", {
        description: "אנא נסה שוב מאוחר יותר",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        <Badge variant="outline" className="p-2 cursor-pointer" onClick={() => {
          form.setValue("email", "lidor@example.com");
          form.setValue("password", "password123");
        }}>
          לידור (בודק)
        </Badge>
        <Badge variant="outline" className="p-2 cursor-pointer" onClick={() => {
          form.setValue("email", "moran@example.com");
          form.setValue("password", "password123");
        }}>
          מורן (בודק)
        </Badge>
        <Badge variant="outline" className="p-2 cursor-pointer" onClick={() => {
          form.setValue("email", "chen@example.com");
          form.setValue("password", "password123");
        }}>
          חן (מנהלת)
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>אימייל</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <Mail className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>סיסמה</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="******"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                טוען...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                כניסה למערכת
              </span>
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default LoginForm;
