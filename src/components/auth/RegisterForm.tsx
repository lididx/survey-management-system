
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/types";
import { createUser } from "@/utils/supabaseAuth";

const registerSchema = z.object({
  email: z.string().email("נדרשת כתובת אימייל תקינה"),
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  role: z.enum(["בודק", "מנהל", "מנהל מערכת"] as const, {
    required_error: "נדרש לבחור תפקיד",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  currentUserId: string;
}

const RegisterForm = ({ onSuccess, currentUserId }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "בודק",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { success, user, temporaryPassword, error } = await createUser(
        data.email,
        data.name,
        data.role,
        currentUserId
      );
      
      if (!success || error) {
        toast.error("שגיאה ביצירת המשתמש", {
          description: error || "אנא נסה שוב מאוחר יותר",
        });
      } else {
        toast.success("המשתמש נוצר בהצלחה", {
          description: `סיסמה זמנית: ${temporaryPassword}`,
          duration: 10000,
        });
        
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("שגיאה ביצירת המשתמש", {
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>אימייל</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מלא</FormLabel>
              <FormControl>
                <Input placeholder="שם מלא" {...field} />
              </FormControl>
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
                  <SelectItem value="מנהל">מנהל</SelectItem>
                  <SelectItem value="מנהל מערכת">מנהל מערכת</SelectItem>
                </SelectContent>
              </Select>
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
              <UserPlus className="h-5 w-5" />
              צור משתמש חדש
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
