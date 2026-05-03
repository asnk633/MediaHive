import os
import re

replacements = {
    'institutionId': 'institution_id',
    'createdBy': 'created_by',
    'assignedTo': 'assigned_to',
    'dueAt': 'due_date',
    'dueDate': 'due_date',
    'updatedAt': 'updated_at',
    'createdAt': 'created_at',
    'completedAt': 'completed_at',
    'completedBy': 'completed_by',
    'isSystemEvent': 'is_system_event',
    'mediaCoverage': 'media_coverage',
    'onBehalfOf': 'on_behalf_of',
    'mediaUploaded': 'media_uploaded',
    'mediaApproved': 'media_approved',
    'mediaApprovedDate': 'media_approved_date',
    'media_approvedDate': 'media_approved_date',
    'isDemoData': 'is_demo_data',
    'showInDownloads': 'show_in_downloads',
    'uploadedBy': 'uploaded_by',
    'uploadedAt': 'uploaded_at',
    'firstDeliverableAt': 'first_deliverable_at',
    'approvalStatus': 'approval_status',
    'assignedBy': 'assigned_by',
    'updatedBy': 'updated_by',
    'officialName': 'official_name',
    'avatarUrl': 'avatar_url',
    'avatarUpdatedAt': 'avatar_updated_at',
    'departmentId': 'department_id',
    'defaultInstitution': 'institution_id',
    'defaultDepartment': 'department_id',
    'avatarDriveId': 'avatar_drive_id',
    'isMediaOffDay': 'is_media_off_day',
    'eventId': 'event_id',
    'campaignId': 'campaign_id',
    'performedBy': 'performed_by',
    'fileName': 'file_name',
    'fileId': 'file_id',
    'isSuperAdmin': 'is_super_admin',
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for k, v in replacements.items():
            # Use word boundary to avoid partial matches
            content = re.sub(r'(?<![a-zA-Z0-9_])' + k + r'(?![a-zA-Z0-9_])', v, content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                replace_in_file(os.path.join(root, file))
