from pathlib import Path

import cv2
import numpy as np


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"

DETECTION_MODEL = MODEL_DIR / "face_detection_yunet_2023mar.onnx"
RECOGNITION_MODEL = MODEL_DIR / "face_recognition_sface_2021dec.onnx"


detector = cv2.FaceDetectorYN.create(
    str(DETECTION_MODEL),
    "",
    (320, 320),
    0.9,
    0.3,
    5000
)

recognizer = cv2.FaceRecognizerSF.create(
    str(RECOGNITION_MODEL),
    ""
)


def detect_face(image):
    if image is None:
        return None

    height, width = image.shape[:2]

    detector.setInputSize((width, height))

    _, faces = detector.detect(image)

    if faces is None or len(faces) == 0:
        return None

    # Select the largest detected face
    largest_face = max(
        faces,
        key=lambda face: face[2] * face[3]
    )

    return largest_face


def create_embedding(image):
    """
    Detect face and create an SFace embedding.
    """

    face = detect_face(image)

    if face is None:
        return None

    # Align the detected face
    aligned_face = recognizer.alignCrop(
        image,
        face
    )

    # Extract SFace feature
    feature = recognizer.feature(
        aligned_face
    )

    # Convert to float32 and normalize manually
    feature = np.asarray(
        feature,
        dtype=np.float32
    )

    norm = np.linalg.norm(feature)

    if norm == 0:
        return None

    normalized_feature = feature / norm

    return normalized_feature

def embedding_to_bytes(embedding):
    """
    Convert numpy embedding into bytes
    for PostgreSQL BYTEA storage.
    """

    return embedding.astype(
        np.float32
    ).tobytes()


def bytes_to_embedding(data):
    """
    Convert PostgreSQL BYTEA back into
    numpy embedding.
    """

    return np.frombuffer(
        data,
        dtype=np.float32
    ).reshape(1, -1)


def compare_embeddings(
    enrolled_embedding,
    live_embedding
):
    similarity = recognizer.match(
        enrolled_embedding,
        live_embedding,
        cv2.FaceRecognizerSF_FR_COSINE
    )

    return float(similarity)