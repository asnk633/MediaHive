src/app/(shell)/tasks/new/page.tsx(145,50): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/app/(shell)/tasks/new/page.tsx(149,51): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/app/(shell)/tasks/new/page.tsx(406,66): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/app/(shell)/tasks/new/page.tsx(410,67): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/app/api/tasks/[id]/attachments/route.ts(113,17): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/library/organisms/CreateEventForm.tsx(173,60): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/components/library/organisms/CreateEventForm.tsx(179,61): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
src/services/events.ts(166,43): error TS2345: Argument of type '{ title: string; description: string; status: "todo"; priority: string; department: string; dueDate: any; assignedTo: never[]; assignedBy: { uid: string; name: string; role: string; }; createdBy: { uid: string; name: string; role: string; }; eventId: any; files: never[]; }' is not assignable to parameter of type 'Omit<Task, "id" | "createdAt">'.
  Property 'ratedAt' is missing in type '{ title: string; description: string; status: "todo"; priority: string; department: string; dueDate: any; assignedTo: never[]; assignedBy: { uid: string; name: string; role: string; }; createdBy: { uid: string; name: string; role: string; }; eventId: any; files: never[]; }' but required in type 'Omit<Task, "id" | "createdAt">'.
