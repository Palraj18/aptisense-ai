import cv2
import mediapipe as mp

# MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True
)

# Webcam
cap = cv2.VideoCapture(0)

# Counters
distraction_count = 0
focused_frames = 0
total_frames = 0

previous_status = "Focused"

print("AptiSense AI Eye Gaze Tracking Started...")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame = cv2.flip(frame, 1)

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb_frame)

    h, w, _ = frame.shape

    attention_status = "No Candidate"

    total_frames += 1

    if results.multi_face_landmarks:

        for face_landmarks in results.multi_face_landmarks:

            # LEFT IRIS
            left_iris = face_landmarks.landmark[468]

            # LEFT EYE CORNERS
            left_eye_left = face_landmarks.landmark[33]
            left_eye_right = face_landmarks.landmark[133]

            # Convert to coordinates
            iris_x = int(left_iris.x * w)

            left_x = int(left_eye_left.x * w)
            right_x = int(left_eye_right.x * w)

            # Draw iris
            cv2.circle(
                frame,
                (iris_x, int(left_iris.y * h)),
                4,
                (0, 255, 0),
                -1
            )

            # Eye width
            eye_width = right_x - left_x

            # Iris relative position
            relative_iris = (iris_x - left_x) / eye_width

            # Gaze logic
            if relative_iris < 0.35:
                attention_status = "Looking Left"

            elif relative_iris > 0.65:
                attention_status = "Looking Right"

            else:
                attention_status = "Focused"
                focused_frames += 1

    # Count distractions only once
    if (
        attention_status != "Focused"
        and previous_status == "Focused"
    ):
        distraction_count += 1

    previous_status = attention_status

    # Attention score
    attention_score = int(
        (focused_frames / total_frames) * 100
    )

    # Display status
    cv2.putText(
        frame,
        f"Attention: {attention_status}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 255),
        2
    )

    # Display distractions
    cv2.putText(
        frame,
        f"Distractions: {distraction_count}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 100, 255),
        2
    )

    # Display score
    cv2.putText(
        frame,
        f"Attention Score: {attention_score}%",
        (20, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    # Title
    cv2.putText(
        frame,
        "AptiSense AI - Eye Gaze Tracking",
        (20, 160),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )

    cv2.imshow("AptiSense AI", frame)

    # Exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()