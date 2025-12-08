#!/usr/bin/env python3
"""
Face Recognition Microservice
Provides face detection and recognition capabilities using dlib and face_recognition library.
"""

import os
import io
import json
import base64
import logging
from flask import Flask, request, jsonify
import face_recognition
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
HOST = os.environ.get('FACE_SERVICE_HOST', '0.0.0.0')
PORT = int(os.environ.get('FACE_SERVICE_PORT', 5000))
DEBUG = os.environ.get('FACE_SERVICE_DEBUG', 'false').lower() == 'true'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'face-recognition'})

@app.route('/compute-embedding', methods=['POST'])
def compute_embedding():
    """
    Compute face embedding from image
    Expects JSON with 'image' field containing base64 encoded image
    Returns JSON with 'embedding' field containing 128-d vector
    """
    try:
        # Get image data from request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Missing image data'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return jsonify({'error': 'No faces detected in image'}), 400
        
        # Use the first detected face
        face_location = face_locations[0]
        
        # Compute face embedding
        face_encodings = face_recognition.face_encodings(image_array, [face_location])
        
        if len(face_encodings) == 0:
            return jsonify({'error': 'Could not compute face encoding'}), 500
        
        # Return the first encoding as a list
        embedding = face_encodings[0].tolist()
        
        return jsonify({'embedding': embedding})
    
    except Exception as e:
        logger.error(f"Error computing embedding: {str(e)}")
        return jsonify({'error': f'Failed to compute embedding: {str(e)}'}), 500

@app.route('/compute-embeddings', methods=['POST'])
def compute_embeddings():
    """
    Compute face embeddings for all faces in image
    Expects JSON with 'image' field containing base64 encoded image
    Returns JSON with 'embeddings' field containing list of 128-d vectors
    """
    try:
        # Get image data from request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Missing image data'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image_array)
        
        # Compute face embeddings for all detected faces
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        # Convert to list of lists
        embeddings = [encoding.tolist() for encoding in face_encodings]
        
        return jsonify({
            'embeddings': embeddings,
            'face_count': len(embeddings),
            'face_locations': face_locations
        })
    
    except Exception as e:
        logger.error(f"Error computing embeddings: {str(e)}")
        return jsonify({'error': f'Failed to compute embeddings: {str(e)}'}), 500

@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    """
    Compare two face embeddings
    Expects JSON with 'embedding1' and 'embedding2' fields
    Returns JSON with 'distance' and 'match' fields
    """
    try:
        # Get embeddings from request
        data = request.get_json()
        if not data or 'embedding1' not in data or 'embedding2' not in data:
            return jsonify({'error': 'Missing embedding data'}), 400
        
        # Convert to numpy arrays
        embedding1 = np.array(data['embedding1'])
        embedding2 = np.array(data['embedding2'])
        
        # Compute Euclidean distance
        distance = np.linalg.norm(embedding1 - embedding2)
        
        # For face recognition, a distance < 0.6 is typically considered a match
        match = distance < 0.6
        
        return jsonify({
            'distance': float(distance),
            'match': bool(match),
            'threshold': 0.6
        })
    
    except Exception as e:
        logger.error(f"Error comparing faces: {str(e)}")
        return jsonify({'error': f'Failed to compare faces: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info(f"Starting Face Recognition Service on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG)