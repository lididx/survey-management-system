
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerUser } from "@/utils/localAuth";

const registerSchema = z.object({
  email: z.string().email("נדרשת כתובת אימייל תקינה"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  role: z.enum(["בודק", "מנהלת"]).default("בודק"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "בודק",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // רישום משתמש חדש במערכת המקומית
      const { success, error } = registerUser(
        data.email,
        data.password,
        data.name,
        data.role
      );

      if (!success) {
        console.error("Registration error:", error);
        toast.error("שגיאה בהרשמה", {
          description: error || "אנא נסה שוב מאוחר יותר",
        });
      } else {
        // לאחר הרשמה מוצלחת
        toast.success("נרשמת בהצלחה", {
          description: "כעת תוכל להתחבר למערכת",
        });
        form.reset();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("שגיאה בהרשמה", {
        description: "אנא נסה שוב מאוחר יותר",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מלא</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input placeholder="ישראל ישראלי" {...field} />
                </FormControl>
                <User className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תפקיד</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="בודק">בודק</SelectItem>
                  <SelectItem value="מנהלת">מנהל/ת</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "מתבצעת הרשמה..." : "הירשם"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
