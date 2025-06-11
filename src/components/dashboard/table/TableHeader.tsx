
import React from "react";
import { TableHeader, TableHead, TableRow } from "@/components/ui/table";

export const AuditsTableHeader = () => {
  return (
    <TableHeader>
      <TableRow className="bg-gray-50 text-gray-700">
        <TableHead className="p-4 font-medium text-center">שם הסקר</TableHead>
        <TableHead className="p-4 font-medium text-center">סטטוס</TableHead>
        <TableHead className="p-4 font-medium text-center">שם לקוח</TableHead>
        <TableHead className="p-4 font-medium text-center">תאריך פגישה</TableHead>
        <TableHead className="p-4 font-medium text-center">יוצר הסקר</TableHead>
        <TableHead className="p-4 font-medium text-center">אנשי קשר</TableHead>
        <TableHead className="p-4 font-medium text-center">פעולות</TableHead>
      </TableRow>
    </TableHeader>
  );
};
