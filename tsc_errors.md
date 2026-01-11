.next/dev/types/validator.ts(1107,31): error TS2344: Type 'typeof import("D:/Thaiba Garden Media Manager-Orchids/src/app/api/tasks/[id]/attachments/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/tasks/[id]/attachments">'.
  Types of property 'POST' are incompatible.
    Type '(req: NextRequest, { params }: { params: { id: string; }; }) => Promise<NextResponse<{ success: boolean; file: TaskFile; }> | NextResponse<{ error: any; }>>' is not assignable to type '(request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response>'.
      Types of parameters '__1' and 'context' are incompatible.
        Type '{ params: Promise<{ id: string; }>; }' is not assignable to type '{ params: { id: string; }; }'.
          Types of property 'params' are incompatible.
            Property 'id' is missing in type 'Promise<{ id: string; }>' but required in type '{ id: string; }'.
.next/types/validator.ts(1107,31): error TS2344: Type 'typeof import("D:/Thaiba Garden Media Manager-Orchids/src/app/api/tasks/[id]/attachments/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/tasks/[id]/attachments">'.
  Types of property 'POST' are incompatible.
    Type '(req: NextRequest, { params }: { params: { id: string; }; }) => Promise<NextResponse<{ success: boolean; file: TaskFile; }> | NextResponse<{ error: any; }>>' is not assignable to type '(request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response>'.
      Types of parameters '__1' and 'context' are incompatible.
        Type '{ params: Promise<{ id: string; }>; }' is not assignable to type '{ params: { id: string; }; }'.
          Types of property 'params' are incompatible.
            Property 'id' is missing in type 'Promise<{ id: string; }>' but required in type '{ id: string; }'.
src/app/(shell)/tasks/new/page.tsx(64,28): error TS2345: Argument of type 'Department[]' is not assignable to parameter of type 'SetStateAction<{ id: number; name: string; }[]>'.
  Type 'Department[]' is not assignable to type '{ id: number; name: string; }[]'.
    Type 'Department' is not assignable to type '{ id: number; name: string; }'.
      Types of property 'id' are incompatible.
        Type 'string' is not assignable to type 'number'.
src/app/(shell)/tasks/new/page.tsx(65,29): error TS2345: Argument of type 'Institution[]' is not assignable to parameter of type 'SetStateAction<{ id: number; name: string; }[]>'.
  Type 'Institution[]' is not assignable to type '{ id: number; name: string; }[]'.
    Type 'Institution' is not assignable to type '{ id: number; name: string; }'.
      Types of property 'id' are incompatible.
        Type 'string' is not assignable to type 'number'.
src/app/api/tasks/[id]/attachments/route.ts(111,17): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/app/api/tasks/[id]/attachments/route.ts(119,28): error TS2339: Property 'FieldValue' does not exist on type 'Firestore'.
src/components/library/organisms/CreateEventForm.tsx(97,36): error TS2345: Argument of type 'Department[]' is not assignable to parameter of type 'SetStateAction<{ id: number; name: string; }[]>'.
  Type 'Department[]' is not assignable to type '{ id: number; name: string; }[]'.
    Type 'Department' is not assignable to type '{ id: number; name: string; }'.
      Types of property 'id' are incompatible.
        Type 'string' is not assignable to type 'number'.
src/components/library/organisms/CreateEventForm.tsx(98,37): error TS2345: Argument of type 'Institution[]' is not assignable to parameter of type 'SetStateAction<{ id: number; name: string; }[]>'.
  Type 'Institution[]' is not assignable to type '{ id: number; name: string; }[]'.
    Type 'Institution' is not assignable to type '{ id: number; name: string; }'.
      Types of property 'id' are incompatible.
        Type 'string' is not assignable to type 'number'.
