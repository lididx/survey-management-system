
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

import { Audit, StatusType } from "@/types/types";
import { AuditForm } from "@/components/AuditForm";
import { EmailTemplatePopup } from "@/components/EmailTemplatePopup";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { useAuditManager } from "@/hooks/useAuditManager";
import { useStaleAudits } from "@/hooks/useStaleAudits";
import { sampleAudits } from "@/utils/auditStorage";

const Dashboard = () => {
  const { user, handleLogout } = useAuthManager();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    audits,
    filteredAudits,
    currentAudit,
    newlyCreatedAudit,
    formMode,
    setFormMode,
    setCurrentAudit,
    setNewlyCreatedAudit,
    handleCreateAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleStatusChange,
    handleAuditSubmit
  } = useAuditManager(sampleAudits, user);
  
  const { canDelete, canEdit } = useAuditPermissions(user);
  
  // Monitor stale audits
  useStaleAudits(audits);
  
  // Filter audits based on search query
  const displayedAudits = searchQuery
    ? filteredAudits.filter(audit => 
        audit.name.includes(searchQuery) || 
        audit.currentStatus.includes(searchQuery) ||
        (audit.clientName && audit.clientName.includes(searchQuery))
      )
    : filteredAudits;

  const handleAuditFormSubmit = (auditData: Partial<Audit>) => {
    const result = handleAuditSubmit(auditData, canEdit);
    
    if (formMode === "create") {
      setIsFormOpen(false);
      if (result) {
        setNewlyCreatedAudit(result);
        setShowEmailTemplate(true);
      }
    } else if (formMode === "edit") {
      setIsEditSheetOpen(false);
    }
  };

  const handleEmailClick = (audit: Audit) => {
    setNewlyCreatedAudit(audit);
    setShowEmailTemplate(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h2 className="text-xl font-semibold">סקרי אבטחת מידע</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="חיפוש לפי שם, לקוח או סטטוס..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-[250px]"
              />
            </div>
            
            {user.role === "בודק" && (
              <Button 
                onClick={() => {
                  handleCreateAudit();
                  setIsFormOpen(true);
                }} 
                className="bg-blue-800 text-white px-4 py-2 rounded-2xl hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                הוסף סקר חדש
              </Button>
            )}
          </div>
        </div>
        
        <StatusCards 
          audits={audits}
          userRole={user.role} 
          userEmail={user.email}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>רשימת סקרים</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditsTable 
              audits={displayedAudits}
              userRole={user.role}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={(audit) => {
                handleEditAudit(audit);
                setIsEditSheetOpen(true);
              }}
              onDeleteAudit={(id) => handleDeleteAudit(id, canDelete)}
              onEmailClick={handleEmailClick}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      </main>

      {/* חלון יצירת סקר חדש */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת סקר חדש</DialogTitle>
          </DialogHeader>
          <AuditForm 
            mode="create"
            onSubmit={handleAuditFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            currentUser={user}
          />
        </DialogContent>
      </Dialog>

      {/* חלון עריכת סקר */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="left" className="w-full max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>עריכת סקר</SheetTitle>
          </SheetHeader>
          {currentAudit && (
            <AuditForm 
              mode="edit"
              audit={currentAudit}
              onSubmit={handleAuditFormSubmit}
              onCancel={() => setIsEditSheetOpen(false)}
              currentUser={user}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* חלון תבנית מייל */}
      {newlyCreatedAudit && (
        <EmailTemplatePopup
          audit={newlyCreatedAudit}
          open={showEmailTemplate}
          onClose={() => {
            setShowEmailTemplate(false);
            setNewlyCreatedAudit(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
