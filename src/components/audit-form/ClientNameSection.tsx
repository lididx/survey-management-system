
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientNameSectionProps {
  clientName: string;
  onClientNameChange: (name: string) => void;
}

// Updated client names list
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
  "הכשרה",
  "אחר"
];

export const ClientNameSection = ({
  clientName,
  onClientNameChange
}: ClientNameSectionProps) => {
  const [customClientName, setCustomClientName] = useState("");
  
  const handleClientNameChange = (value: string) => {
    if (value === "אחר") {
      setCustomClientName("");
      return;
    }
    
    onClientNameChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="clientName">שם לקוח *</Label>
      <div className="grid grid-cols-1 gap-2">
        <Select 
          value={clientNames.includes(clientName || "") ? clientName : "אחר"}
          onValueChange={handleClientNameChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר שם לקוח" />
          </SelectTrigger>
          <SelectContent>
            {clientNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(clientName === "אחר" || (!clientNames.includes(clientName || "") && clientName)) && (
          <Input
            placeholder="הזן שם לקוח מותאם אישית"
            value={customClientName}
            onChange={(e) => {
              setCustomClientName(e.target.value);
              onClientNameChange(e.target.value);
            }}
          />
        )}
      </div>
    </div>
  );
};
