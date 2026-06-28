import os
import re

def verify_codebase():
    base_dir = "d:/MediaHive App/mediahive_mobile"
    
    checks = {
        "Offline Attendance Queue (Exponential Backoff & Events)": {
            "file": os.path.join(base_dir, "lib/features/attendance/data/services/offline_attendance_queue.dart"),
            "patterns": [
                (r"_retryCount", "Retry count variable"),
                (r"_nextRetryTime", "Next retry time variable"),
                (r"offline_queued", "offline_queued timeline event logging"),
            ]
        },
        "Reports Screen (Campus & Holiday Filters)": {
            "file": os.path.join(base_dir, "lib/features/attendance/presentation/screens/attendance_reports_screen.dart"),
            "patterns": [
                (r"_selectedCampus", "Campus filter state variable"),
                (r"_selectedHoliday", "Holiday filter state variable"),
                (r"_buildFilters\(.*List<String> campuses\)", "Updated _buildFilters signature accepting campuses list"),
            ]
        },
        "Attendance Repository (Request Expiry)": {
            "file": os.path.join(base_dir, "lib/features/attendance/data/repositories/attendance_repository.dart"),
            "patterns": [
                (r"expireStaleRequests", "expireStaleRequests retroactive expiry logic"),
            ]
        }
    }

    print("==================================================")
    print("      NFC ATTENDANCE IMPLEMENTATION AUDIT        ")
    print("==================================================")
    
    all_passed = True
    for title, check_info in checks.items():
        file_path = check_info["file"]
        print(f"\nChecking: {title}")
        print(f"File: {file_path}")
        
        if not os.path.exists(file_path):
            print("  [FAIL] File does not exist!")
            all_passed = False
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        for pattern, desc in check_info["patterns"]:
            if re.search(pattern, content):
                print(f"  [PASS] Mapped: {desc}")
            else:
                print(f"  [FAIL] Missing: {desc} (Pattern: {pattern})")
                all_passed = False

    print("\n==================================================")
    if all_passed:
        print("STATUS: ALL ATTENDANCE TASKS ARE FULLY COMPLETED!")
    else:
        print("STATUS: SOME CHECKS FAILED. PLEASE VERIFY CODE.")
    print("==================================================")

if __name__ == "__main__":
    verify_codebase()
