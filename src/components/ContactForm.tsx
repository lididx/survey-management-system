
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { Contact } from "@/types/types";

interface ContactFormProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

export const ContactForm = ({ contacts, setContacts }: ContactFormProps) => {
  const [newContact, setNewContact] = useState<Contact>({
    id: crypto.randomUUID(),
    fullName: "",
    role: "",
    email: "",
    phone: ""
  });

  const handleAddContact = () => {
    if (!newContact.fullName || !newContact.email) {
      return;
    }
    
    setContacts([...contacts, newContact]);
    setNewContact({
      id: crypto.randomUUID(),
      fullName: "",
      role: "",
      email: "",
      phone: ""
    });
  };

  const handleRemoveContact = (id: string | undefined) => {
    if (!id) return;
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <h3 className="text-lg font-semibold mb-3">אנשי קשר</h3>
        
        {contacts.length > 0 && (
          <div className="space-y-3 mb-4">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
              >
                <div>
                  <p className="font-semibold">{contact.fullName}</p>
                  <p className="text-sm text-gray-600">{contact.role}</p>
                  <p className="text-sm">{contact.email} | {contact.phone}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveContact(contact.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fullName">שם מלא</Label>
              <Input
                id="fullName"
                value={newContact.fullName}
                onChange={(e) => setNewContact({...newContact, fullName: e.target.value})}
                placeholder="שם מלא"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Input
                id="role"
                value={newContact.role}
                onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                placeholder="תפקיד"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="טלפון"
              />
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
