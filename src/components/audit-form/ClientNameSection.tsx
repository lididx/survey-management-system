
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
  const [useCustomInput, setUseCustomInput] = useState(!clientNames.includes(clientName || ""));
  
  const handleSelectChange = (value: string) => {
    if (value === "custom") {
      setUseCustomInput(true);
      onClientNameChange("");
    } else {
      setUseCustomInput(false);
      onClientNameChange(value);
    }
  };

  const handleCustomInputChange = (value: string) => {
    onClientNameChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="clientName">שם לקוח *</Label>
      <div className="grid grid-cols-1 gap-2">
        {!useCustomInput ? (
          <Select 
            value={clientNames.includes(clientName || "") ? clientName : "custom"}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר שם לקוח" />
            </SelectTrigger>
            <SelectContent>
              {clientNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
              <SelectItem value="custom">לקוח חדש...</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="הזן שם לקוח חדש"
              value={clientName}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              className="flex-1"
            />
            <Select value="custom" onValueChange={handleSelectChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
                <SelectItem value="custom">לקוח חדש...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
