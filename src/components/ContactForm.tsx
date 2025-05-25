
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { Contact, ContactGender } from "@/types/types";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ContactFormProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

export const ContactForm = ({ contacts, setContacts }: ContactFormProps) => {
  const [newContact, setNewContact] = useState<Contact>({
    id: crypto.randomUUID(),
    fullName: "",
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    gender: "male"
  });

  const handleAddContact = () => {
    // Basic validation - at least name or email should be provided
    if (!newContact.firstName?.trim() && !newContact.email?.trim()) {
      toast.error("יש להזין לפחות שם פרטי או אימייל");
      return;
    }
    
    // Set the fullName based on firstName and lastName
    const fullContact = {
      ...newContact,
      fullName: `${newContact.firstName || ''} ${newContact.lastName || ''}`.trim() || newContact.email
    };
    
    setContacts([...contacts, fullContact]);
    setNewContact({
      id: crypto.randomUUID(),
      fullName: "",
      firstName: "",
      lastName: "",
      role: "",
      email: "",
      phone: "",
      gender: "male"
    });
    toast.success("איש קשר נוסף בהצלחה");
  };

  const handleRemoveContact = (id: string | undefined) => {
    if (!id) return;
    setContacts(contacts.filter(contact => contact.id !== id));
    toast.success("איש קשר הוסר בהצלחה");
  };

  // Handle firstName change and update fullName
  const handleFirstNameChange = (value: string) => {
    setNewContact(prev => ({
      ...prev,
      firstName: value,
      fullName: `${value} ${prev.lastName || ''}`.trim()
    }));
  };

  // Handle lastName change and update fullName
  const handleLastNameChange = (value: string) => {
    setNewContact(prev => ({
      ...prev,
      lastName: value,
      fullName: `${prev.firstName || ''} ${value}`.trim()
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <h3 className="text-lg font-semibold mb-3">אנשי קשר</h3>
        
        {contacts.length > 0 && (
          <div className="space-y-3 mb-4">
            {contacts.map((contact) => {
              const firstName = contact.firstName || contact.fullName.split(' ')[0];
              const lastName = contact.lastName || contact.fullName.split(' ').slice(1).join(' ');
              
              return (
                <div 
                  key={contact.id} 
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                >
                  <div>
                    <p className="font-semibold">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-600">{contact.role}</p>
                    <p className="text-sm">{contact.email} | {contact.phone}</p>
                    <p className="text-xs text-gray-500">מגדר: {contact.gender === "male" ? "זכר" : "נקבה"}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveContact(contact.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                value={newContact.firstName || ''}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                placeholder="שם פרטי"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                value={newContact.lastName || ''}
                onChange={(e) => handleLastNameChange(e.target.value)}
                placeholder="שם משפחה"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Input
                id="role"
                value={newContact.role}
                onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                placeholder="תפקיד"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                placeholder="אימייל"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="טלפון"
              />
            </div>
            <div className="space-y-2">
              <Label>מגדר</Label>
              <RadioGroup
                value={newContact.gender}
                onValueChange={(value) => setNewContact({...newContact, gender: value as ContactGender})}
                className="flex justify-end space-x-4 space-x-reverse"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">זכר</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">נקבה</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <Button 
            type="button" 
            onClick={handleAddContact}
            className="w-full"
            variant="outline"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            הוסף איש קשר
          </Button>
        </div>
      </div>
    </div>
  );
};
