
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientNameSectionProps {
  clientName: string;
  onClientNameChange: (name: string) => void;
}

// Updated client names list (removed "אחר")
const clientNames = [
  "הראל",
  "מנורה",
  "בנק הפועלים",
  "בנק לאומי",
  "מכבי",
  "מרכנתיל",
  "מגדל",
  "הפניקס",
  "מת\"ף",
  "בנק ירושלים",
  "בנק ישראל",
  "הכשרה"
];

export const ClientNameSection = ({
  clientName,
  onClientNameChange
}: ClientNameSectionProps) => {
  const [isCustomClient, setIsCustomClient] = useState(false);
  
  const handleSelectChange = (value: string) => {
    if (value === "לקוח חדש") {
      setIsCustomClient(true);
      onClientNameChange("");
    } else {
      setIsCustomClient(false);
      onClientNameChange(value);
    }
  };

  const handleCustomInputChange = (value: string) => {
    onClientNameChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="clientName">שם לקוח *</Label>
      <div className="space-y-2">
        <Select 
          value={isCustomClient ? "לקוח חדש" : (clientNames.includes(clientName || "") ? clientName : "")}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר שם לקוח" />
          </SelectTrigger>
          <SelectContent>
            {clientNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
            <SelectItem value="לקוח חדש">לקוח חדש</SelectItem>
          </SelectContent>
        </Select>
        
        {isCustomClient && (
          <Input
            placeholder="הזן שם לקוח חדש"
            value={clientName}
            onChange={(e) => handleCustomInputChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
};
