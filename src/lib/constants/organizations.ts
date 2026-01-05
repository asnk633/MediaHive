/**
 * @deprecated This file is deprecated. Institutions and Departments are now managed via the Database and API.
 * 
 * New code should fetch from:
 * - GET /api/institutions
 * - GET /api/departments
 * 
 * This file is only kept for the "Sync Data" feature (src/app/api/admin/sync-orgs/route.ts) to seed the initial data.
 */

export const DEPARTMENTS = [
    "Media & IT Office",
    "Office of Dawah",
    "Office of General Affairs",
    "Office of Public Relations",
    "Office of Finance",
    "Office of Planning",
    "Office of Education",
    "Office of Students",
    "Office of Staff",
    "Office of Resources",
    "Office of Maintenance",
    "Office of Security",
    "Office of Transport",
    "Office of Kitchen",
    "Office of Laundry",
    "Office of Housekeeping",
    "Office of Gardening",
    "Office of Store",
    "Office of Purchase",
    "Office of Sales",
    "Office of Marketing",
    "Office of Design",
    "Office of Content",
    "Office of Development",
    "Office of Research",
    "Office of Publication",
    "Office of Library",
    "Office of Archives",
    "Office of Projects",
    "Office of Events",
    "Office of Hospitality",
    "Office of Health",
    "Office of Welfare",
    "Office of Charity",
    "Office of Zakat",
    "Office of Hajj",
    "Office of Umrah",
    "Office of Tourism"
] as const;

export const INSTITUTIONS = [
    "Spark Academy",
    "Edu Berry - UAE"
] as const;
