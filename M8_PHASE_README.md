# M8 Phase - Local-first AI Media Quality + VIP Face Tagging

## Overview

This phase implements local-first AI features for media quality analysis and VIP face recognition without requiring external paid APIs by default.

## Features Implemented

1. **AI Media Quality Analyzer**
   - Analyzes images, videos, and audio files for quality metrics
   - Provides blur detection, brightness analysis, noise estimation
   - Generates quality scores and actionable suggestions
   - Stores reports in the database with encryption

2. **VIP Face Recognition**
   - Local face detection and recognition using open-source libraries
   - Admin enrollment of VIP faces with secure storage
   - Face matching with configurable similarity thresholds
   - End-to-end encryption of face embeddings

## Feature Flags

All new features are controlled by feature flags:

- `FEATURE_MEDIA_ANALYZER` - Enable/disable media analyzer (default: true)
- `FEATURE_FACE_RECOGNITION` - Enable/disable face recognition (default: true)
- `FEATURE_FINANCE` - Enable/disable finance features (default: false)

## Security & Privacy

- All sensitive data (face embeddings, VIP labels) encrypted at rest using APP_SECRET
- Admin-only access for VIP enrollment and management
- File uploads with retention policies
- No external API calls by default

## Installation Requirements

### System Dependencies

1. **FFmpeg** - Required for video/audio analysis
   - Install on Ubuntu/Debian: `sudo apt-get install ffmpeg`
   - Install on macOS: `brew install ffmpeg`
   - Install on Windows: Download from https://ffmpeg.org/download.html

2. **Python Face Recognition Service** (Optional)
   - Requires Python 3.7+
   - Install dependencies: `pip install -r scripts/requirements.txt`
   - Run service: `python scripts/face_service.py`

### Node.js Dependencies

All required Node.js dependencies are included in package.json:
- sharp - Image processing
- opencv4nodejs (optional) - Advanced computer vision

## API Endpoints

### Media Analyzer

- `POST /api/media/analyze` - Analyze media quality
- `GET /api/media/analyze/:id` - Get previous analysis report

### Face Recognition

- `POST /api/face/enroll` - Enroll a VIP (admin-only)
- `POST /api/face/match` - Match a face
- `GET /api/face/vips` - List enrolled VIPs (admin-only)
- `DELETE /api/face/vips/:id` - Delete a VIP (admin-only)

## Database Schema

New tables added:
- `media_reports` - Stores media analysis reports
- `vip_embeddings` - Stores encrypted VIP face embeddings

## Configuration

Environment variables for M8 features:

```bash
# Feature flags
FEATURE_MEDIA_ANALYZER=true
FEATURE_FACE_RECOGNITION=true
FEATURE_FINANCE=false

# External API settings
ENABLE_EXTERNAL_APIS=false

# Media analyzer settings
OPENCV_ENABLED=false
MEDIA_UPLOAD_RETENTION_DAYS=30

# Face recognition settings
FACE_PYTHON_SERVICE=true
VIP_MATCH_THRESHOLD=0.65

# Security settings
APP_SECRET=your-secret-key-here

# File upload settings
MAX_UPLOAD_SIZE=10485760
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (copy .env.example to .env and modify as needed)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. For face recognition with Python service:
   ```bash
   cd scripts
   pip install -r requirements.txt
   python face_service.py
   ```

## Testing

Playwright E2E tests are included for both features:
- `e2e/playwright/media.analyze.spec.ts`
- `e2e/playwright/face.vips.spec.ts`
- `e2e/playwright/face.privacy.spec.ts`

Run tests:
```bash
npm run test:e2e
```

## Docker Support

A Dockerfile is provided for the Python face recognition service:
```bash
cd scripts
docker build -t face-recognition-service .
docker run -p 5000:5000 face-recognition-service
```

## Key Implementation Details

### Media Quality Analysis

The media analyzer uses:
- FFmpeg for video/audio processing
- Sharp for image analysis
- Custom algorithms for blur detection, brightness analysis, and noise estimation
- Configurable scoring with weighted metrics

### Face Recognition

The face recognition system uses:
- Python microservice with face_recognition library (dlib-based)
- 128-dimensional face embeddings
- Cosine similarity for matching
- AES-256 encryption for storing embeddings
- Configurable matching threshold (default 0.65)

### Security

All sensitive data is encrypted using AES-256-CBC:
- Face embeddings stored in `vip_embeddings` table
- Media reports can optionally be encrypted
- APP_SECRET used as encryption key

### Privacy

- Only admins can enroll VIPs
- Face embeddings are encrypted at rest
- No facial recognition data sent to external services by default
- File retention policies to automatically clean up old uploads

## Migration

Database migrations are provided:
- `migrations/20251121_m8_add_vip_and_media.sql` - Apply changes
- `migrations/20251121_m8_add_vip_and_media_rollback.sql` - Rollback changes

Apply migration:
```bash
# Using your database migration tool
```

## Future Enhancements

1. Integration with more advanced computer vision libraries
2. Additional media quality metrics
3. Batch processing for multiple files
4. Improved face recognition accuracy with more training data
5. WebAssembly-based face recognition for fully client-side processing