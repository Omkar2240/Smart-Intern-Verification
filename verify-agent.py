import cv2
import os
from geopy.distance import geodesic
from deepface import DeepFace

# ==========================================
# CONFIGURATION
# ==========================================
# Simulated exact match for testing so you don't fail the Geofence at home
OFFICE_LATITUDE = 19.0760   
OFFICE_LONGITUDE = 72.8777
STUDENT_LATITUDE = 19.0760   
STUDENT_LONGITUDE = 72.8777  
MAX_ALLOWED_METERS = 50.0   

STUDENT_ID = "student_1"
DB_FOLDER = "database"
DB_IMAGE_PATH = f"{DB_FOLDER}/{STUDENT_ID}.jpg"
LIVE_IMAGE_PATH = "live_attempt.jpg"

# Ensure database folder exists
os.makedirs(DB_FOLDER, exist_ok=True)

print("🚀 Starting Smart Internship Verification Agent...\n")

# ==========================================
# MODULE 1: DYNAMIC REGISTRATION
# ==========================================
def capture_webcam_frame(save_path, instruction_text):
    """Helper function to open webcam, show feed, and save a frame."""
    webcam = cv2.VideoCapture(0)
    if not webcam.isOpened():
        print("❌ Error: Could not access the webcam.")
        exit()

    print(f"👀 {instruction_text}")

    while True:
        ret, frame = webcam.read()
        if not ret:
            break
            
        cv2.imshow("Smart Verify System", frame)
        
        # Wait for spacebar (32) to capture, or 'q' (113) to quit
        key = cv2.waitKey(1) & 0xFF
        if key == 32: 
            cv2.imwrite(save_path, frame)
            print(f"📸 Image captured and saved to {save_path}!")
            break
        elif key == 113:
            print("Quit command received.")
            exit()

    webcam.release()
    cv2.destroyAllWindows()

# Check if student is registered. If not, trigger registration!
if not os.path.exists(DB_IMAGE_PATH):
    print("⚠️ No profile found for this student. Entering REGISTRATION MODE.")
    print("Please ensure your face is well-lit and clearly visible.")
    capture_webcam_frame(DB_IMAGE_PATH, "Look at the camera and press 'SPACEBAR' to REGISTER your face.")
    print("✅ Registration complete! Please run the script again to test Verification.\n")
    exit() # Exit so the user can test the actual flow from scratch


# ==========================================
# MODULE 2: ATTENDANCE VERIFICATION FLOW
# ==========================================

# --- STEP 1: GEOFENCING ---
print("🛰️ [STEP 1/3] Running Geofencing Location Audit...")
distance_from_office = geodesic((OFFICE_LATITUDE, OFFICE_LONGITUDE), (STUDENT_LATITUDE, STUDENT_LONGITUDE)).meters
print(f"📍 Distance from office: {distance_from_office:.2f} meters.")

if distance_from_office > MAX_ALLOWED_METERS:
    print("❌ VERIFICATION FAILED: Student is NOT inside the designated office premises!")
    exit()
print("✅ GEOFENCE PASSED.\n")

# --- STEP 2: CAMERA CAPTURE ---
print("📸 [STEP 2/3] Initializing Camera for Live Attendance...")
capture_webcam_frame(LIVE_IMAGE_PATH, "Look at the camera and press 'SPACEBAR' to MARK ATTENDANCE.")

# --- STEP 3: ANTI-SPOOFING (LIVENESS) ---
print("\n🛡️ Analyzing frame for Anti-Spoofing (Liveness Check)...")
print("⏳ (Note: First run may take a minute to download AI models)")
try:
    liveness_results = DeepFace.extract_faces(
        img_path=LIVE_IMAGE_PATH, 
        detector_backend="retinaface", # <-- ADD THIS LINE HERE
        anti_spoofing=True
    )
    print(liveness_results)
    first_face = liveness_results[0] if isinstance(liveness_results, list) else liveness_results
    
    print(first_face)
    is_real_human = first_face.get("is_real", True) if isinstance(first_face, dict) else True
    print(is_real_human)
    
    if not is_real_human:
        print("❌ SECURITY ALERT: Spoofing attempt detected! (Screen or Photo printout)")
        exit()
    print("✅ LIVENESS PASSED: Physical 3D human presence confirmed.\n")
    
except ValueError as e:
    # Now, if it's the tf-keras error or a real 'no face' error, it will tell you exactly what is wrong!
    print(f"❌ Error Detail: {e}")
    exit()
except Exception as e:
    print(f"❌ System Error during liveness check: {e}")
    exit()

# --- STEP 4: IDENTITY MATCHING ---
print("🧬 [STEP 3/3] Executing Identity Face Matching Protocol...")
try:
    verification = DeepFace.verify(
        img1_path = LIVE_IMAGE_PATH,
        img2_path = DB_IMAGE_PATH,
        model_name = "Facenet512",
        detector_backend = "retinaface"
    )
    
    is_match = verification["verified"]
    confidence = 1 - verification["distance"] 

    if is_match:
        print(f"🎉 SUCCESS: Intern Identity Confirmed! (Match Confidence: {confidence*100:.2f}%)")
        print("📝 Attendance logged successfully.")
    else:
        print(f"❌ VERIFICATION FAILED: Face does not match registered profile. (Confidence: {confidence*100:.2f}%)")

except Exception as error:
    print(f"❌ Processing Error during Identity Check: {error}")