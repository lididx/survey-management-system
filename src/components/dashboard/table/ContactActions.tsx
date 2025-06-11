
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Contact } from "@/types/types";

interface ContactActionsProps {
  contacts: Contact[];
}

export const ContactActions = ({ contacts }: ContactActionsProps) => {
  const handleWhatsAppClick = (phone: string, contactName: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`נפתח WhatsApp עבור ${contactName}`);
  };

  const handlePhoneClick = (phone: string, contactName: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '972' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('972')) {
      formattedPhone = '972' + cleanPhone;
    }
    
    const telUrl = `tel:+${formattedPhone}`;
    window.location.href = telUrl;
    
    toast.success(`נפתח חייגן עבור ${contactName}`);
  };

  return (
    <div className="flex flex-col gap-1">
      {contacts && contacts.length > 0 ? (
        contacts.map((contact, index) => (
          <div key={index} className="flex items-center justify-center gap-2">
            <span className="text-sm">{contact.fullName}</span>
            {contact.phone && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePhoneClick(contact.phone, contact.fullName)}
                  className="h-6 w-6 p-0"
                  title="התקשר"
                >
                  <Phone className="h-3 w-3 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWhatsAppClick(contact.phone, contact.fullName)}
                  className="h-6 w-6 p-0"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3 w-3 text-green-600" />
                </Button>
              </div>
            )}
          </div>
        ))
      ) : (
        <span className="text-gray-500 text-sm">אין אנשי קשר</span>
      )}
    </div>
  );
};
