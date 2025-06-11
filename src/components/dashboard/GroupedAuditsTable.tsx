
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";
import { Audit, StatusType, CLIENT_LOGOS } from "@/types/types";
import { AuditsTable } from "./AuditsTable";

interface GroupedAuditsTableProps {
  audits: Audit[];
  userRole: string;
  canEdit: (auditOwnerId: string) => boolean;
  canDelete: (auditOwnerId: string) => boolean;
  onEditAudit: (audit: Audit) => void;
  onDeleteAudit: (id: string) => void;
  onEmailClick: (audit: Audit) => void;
  onStatusChange: (audit: Audit, newStatus: StatusType) => void;
}

const statusOptions: StatusType[] = [
  "התקבל",
  "נשלח מייל תיאום למנהל מערכת",
  "נקבע",
  "בכתיבה",
  "שאלות השלמה מול מנהל מערכת",
  "בבקרה",
  "הסתיים"
];

export const GroupedAuditsTable = ({ 
  audits, 
  userRole, 
  canEdit, 
  canDelete,
  onEditAudit, 
  onDeleteAudit,
  onEmailClick,
  onStatusChange
}: GroupedAuditsTableProps) => {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSortOrder, setDateSortOrder] = useState<"asc" | "desc" | "none">("none");

  // Filter audits by status
  const filteredAudits = useMemo(() => {
    if (statusFilter === "all") return audits;
    return audits.filter(audit => audit.currentStatus === statusFilter);
  }, [audits, statusFilter]);

  // Sort audits by date - prioritize scheduledDate, then plannedMeetingDate
  const sortedAudits = useMemo(() => {
    if (dateSortOrder === "none") return filteredAudits;
    
    return [...filteredAudits].sort((a, b) => {
      // Get the appropriate date for comparison
      const getComparisonDate = (audit: Audit) => {
        if (audit.scheduledDate) return new Date(audit.scheduledDate).getTime();
        if (audit.plannedMeetingDate) return new Date(audit.plannedMeetingDate).getTime();
        return 0;
      };
      
      const dateA = getComparisonDate(a);
      const dateB = getComparisonDate(b);
      
      if (dateSortOrder === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [filteredAudits, dateSortOrder]);

  // Group audits by client
  const groupedAudits = useMemo(() => {
    const groups: Record<string, Audit[]> = {};
    
    sortedAudits.forEach(audit => {
      const clientName = audit.clientName || "ללא לקוח";
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(audit);
    });
    
    return groups;
  }, [sortedAudits]);

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };

  const toggleDateSort = () => {
    if (dateSortOrder === "none") {
      setDateSortOrder("asc");
    } else if (dateSortOrder === "asc") {
      setDateSortOrder("desc");
    } else {
      setDateSortOrder("none");
    }
  };

  const getClientLogo = (clientName: string) => {
    return CLIENT_LOGOS[clientName] || null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">סינון לפי סטטוס:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="בחר סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">מיון לפי תאריך פגישה:</label>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDateSort}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {dateSortOrder === "none" && "ללא מיון"}
            {dateSortOrder === "asc" && "מהקרוב לרחוק"}
            {dateSortOrder === "desc" && "מהרחוק לקרוב"}
          </Button>
        </div>
      </div>

      {/* Grouped Audits */}
      <div className="space-y-4">
        {Object.entries(groupedAudits).map(([clientName, clientAudits]) => {
          const clientLogo = getClientLogo(clientName);
          
          return (
            <Card key={clientName} className="border">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleClientExpansion(clientName)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedClients.has(clientName) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    
                    {clientLogo ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={clientLogo} 
                          alt={`${clientName} לוגו`}
                          className="h-8 w-auto object-contain"
                        />
                        {clientName === "בנק ישראל" && (
                          <span className="text-lg font-medium">בנק ישראל</span>
                        )}
                        <span className="text-sm text-gray-500">({clientAudits.length} סקרים)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{clientName}</span>
                        <span className="text-sm text-gray-500">({clientAudits.length} סקרים)</span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              {expandedClients.has(clientName) && (
                <CardContent>
                  <AuditsTable
                    audits={clientAudits}
                    userRole={userRole}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEditAudit={onEditAudit}
                    onDeleteAudit={onDeleteAudit}
                    onEmailClick={onEmailClick}
                    onStatusChange={onStatusChange}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
        
        {Object.keys(groupedAudits).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            לא נמצאו סקרים התואמים לקריטריונים
          </div>
        )}
      </div>
    </div>
  );
};
