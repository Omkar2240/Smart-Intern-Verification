# Smart Internship Verification System

## Introduction

The **Smart Internship Verification System** is an intelligent multi-agent application designed to verify and validate internship attendance through facial recognition, geofencing, and AI-powered intent routing. This system combines computer vision, geolocation services, and intelligent agent-based processing to ensure secure and accurate verification of intern presence during work hours.

The system operates through a coordinated network of specialized agents that work together to:

- **Route** incoming requests to appropriate handlers
- **Verify** intern identity through facial recognition
- **Validate** location using geofencing technology
- **Manage** verification data and attempt history

---

## System Architecture

### Key Components

#### 1. **Router Agent** (`router_agent.py`)

- Analyzes user prompts and classifies them into three intent categories:
  - `analytics`: Data analysis and reporting requests
  - `general_chat`: General conversation and inquiries
  - `support`: Technical support and assistance requests
- Uses Ollama/Gemma model for intent classification with confidence scoring
- Returns structured JSON responses with reasoning

#### 2. **Verify Agent** (`verify-agent.py`)

Core verification module with three main functionalities:

**Module 1: Dynamic Registration**

- Captures webcam frames for student registration
- Saves baseline facial images for comparison

**Module 2: Facial Recognition**

- Uses DeepFace library for accurate face comparison
- Compares live attempt images against stored database images
- Provides confidence scores for verification accuracy

**Module 3: Geofencing Verification**

- Validates student location using GPS coordinates
- Enforces 50-meter radius from designated office location
- Prevents remote or unauthorized location verification

#### 3. **Memory Agent** (`memory_agent.py`)

- Manages session state and conversation history
- Stores verification attempt records
- Maintains context across multiple interactions

#### 4. **Main Router** (`main.py`)

- Entry point for the application
- Orchestrates communication between agents

### Database

- Stores student registration images in the `database/` folder
- Maintains verification attempt logs
- Supports multi-student verification scenarios

---

## Technical Stack

| Component            | Purpose                                |
| -------------------- | -------------------------------------- |
| **Python 3.13+**     | Core runtime environment               |
| **Pydantic**         | Data validation and structured outputs |
| **DeepFace**         | Facial recognition and comparison      |
| **OpenCV**           | Video capture and image processing     |
| **Geopy**            | Geolocation and distance calculation   |
| **Ollama**           | Local LLM model runner                 |
| **Gemma 3 4B**       | Intent classification model            |
| **PyTorch**          | Deep learning framework                |
| **TensorFlow/Keras** | Neural network support                 |

---

## Installation

### Prerequisites

Before installing the Smart Internship Verification System, ensure you have:

- **Python 3.13** or higher
- **pip** 26.1.2 or higher
- **Git** (for cloning the repository)
- **Webcam** (for facial registration and verification)
- **Ollama** installed and running (for intent classification)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Omkar2240/Smart-Intern-Verification.git
cd multi-agents
```

### Step 2: Set Up Python Environment

#### Option A: Using Python Virtual Environment (Recommended)

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
```

#### Option B: Using UV (Fast Python Package Manager)

```bash
# If you have UV installed
uv sync
```

### Step 3: Install Dependencies

```bash
# Install all required packages
pip install -e .

# Or manually install dependencies
pip install deepface>=0.0.100 \
    geopy>=2.5.0 \
    ollama>=0.6.2 \
    opencv-python>=5.0.0.93 \
    pydantic>=2.13.4 \
    tf-keras>=2.21.0 \
    torch>=2.13.0
```

### Step 4: Install and Start Ollama

Download Ollama from [ollama.ai](https://ollama.ai) and install it.

```bash
# Pull the Gemma 3 4B model
ollama pull gemma3:4b

# Start the Ollama server (runs on http://localhost:11434)
ollama serve
```

Keep the Ollama server running in a separate terminal while using the system.

### Step 5: Set Up Database Directory

```bash
# Create the database folder for storing student images
mkdir -p database
```

### Step 6: Configure System Settings

Edit `verify-agent.py` to customize:

- Office location coordinates (OFFICE_LATITUDE, OFFICE_LONGITUDE)
- Geofence radius (MAX_ALLOWED_METERS)
- Student ID and database paths

```python
# Configuration section in verify-agent.py
OFFICE_LATITUDE = 19.0760
OFFICE_LONGITUDE = 72.8777
STUDENT_LATITUDE = 19.0760
STUDENT_LONGITUDE = 72.8777
MAX_ALLOWED_METERS = 50.0
```

### Step 7: Verify Installation

```bash
# Test that all dependencies are properly installed
python -c "import deepface, cv2, geopy, ollama, pydantic; print('✅ All dependencies installed!')"

# Run the main application
python main.py
```

---

## Usage

### Basic Workflow

1. **Start Ollama Server** (in a separate terminal):

   ```bash
   ollama serve
   ```

2. **Run the Application**:

   ```bash
   python main.py
   ```

3. **Student Registration**:
   - Press spacebar to capture registration photo when prompted
   - System stores the baseline facial image in the database

4. **Verification Attempt**:
   - System captures live webcam frame
   - Compares against stored baseline image using facial recognition
   - Validates GPS location within geofence radius
   - Returns verification result with confidence score

### Router Agent Usage

```python
from router_agent import router_agent

# Analyze user intent
result = router_agent("I need a report on attendance trends")
print(result.intent)        # Output: 'analytics'
print(result.confidence)    # Output: 0.95
print(result.reasoning)     # Reasoning explanation
```

---

## Project Structure

```
multi-agents/
├── main.py                 # Application entry point
├── router_agent.py        # Intent routing agent
├── verify-agent.py        # Core verification logic
├── memory_agent.py        # Memory and state management
├── pyproject.toml         # Project configuration
├── README.md              # This file
├── database/              # Student registration images
├── live_attempt.jpg       # Current verification attempt
├── .venv/                 # Python virtual environment
└── .python-version        # Python version specification
```

---

## System Requirements

| Requirement         | Minimum   | Recommended                               |
| ------------------- | --------- | ----------------------------------------- |
| RAM                 | 4 GB      | 8 GB                                      |
| GPU                 | Optional  | NVIDIA CUDA 11.8+ (for faster processing) |
| Storage             | 2 GB      | 5 GB                                      |
| Disk Space (Models) | 2 GB      | 4 GB                                      |
| Internet            | For setup | Not required to run                       |

---

## Troubleshooting

### Issue: Webcam Not Detected

**Solution**: Ensure your webcam is connected and not in use by other applications.

### Issue: Ollama Connection Error

**Solution**: Ensure Ollama is running on `http://localhost:11434`. Restart with `ollama serve`.

### Issue: DeepFace Model Download Fails

**Solution**: Ensure you have internet connectivity during the first run. DeepFace downloads models automatically.

### Issue: Geofence Validation Always Fails

**Solution**: Update OFFICE_LATITUDE and OFFICE_LONGITUDE to match your actual office coordinates.

### Issue: Python Version Incompatibility

**Solution**: Ensure you're using Python 3.13 or higher:

```bash
python --version
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is part of the Smart Internship Verification system. For licensing information, please refer to the LICENSE file.

---

## Support

For issues, questions, or suggestions:

- Open an issue on [GitHub](https://github.com/Omkar2240/Smart-Intern-Verification/issues)
- Contact the development team

---

## Version

**Current Version**: 0.1.0

---

## Acknowledgments

This system leverages:

- **DeepFace** for advanced facial recognition
- **OpenCV** for computer vision processing
- **Ollama & Gemma** for AI-powered intent classification
- **Geopy** for accurate geolocation services

---

**Last Updated**: July 2026
