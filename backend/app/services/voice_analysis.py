import speech_recognition as sr
import time

recognizer = sr.Recognizer()

print("AptiSense AI Voice Analysis Started...")

with sr.Microphone() as source:

    print("Speak now...")

    start_time = time.time()

    audio = recognizer.listen(source)

    end_time = time.time()

    speaking_time = end_time - start_time

    try:

        text = recognizer.recognize_google(audio)

        print("\nCandidate Response:")
        print(text)

        # Word count
        words = text.split()

        word_count = len(words)

        # Speaking speed
        words_per_second = word_count / speaking_time

        # Filler words
        fillers = ["um", "uh", "like", "hmm"]

        filler_count = 0

        for word in words:
            if word.lower() in fillers:
                filler_count += 1

        # Confidence logic
        if filler_count > 3:
            confidence = "Low Confidence"

        elif words_per_second < 1:
            confidence = "Hesitant"

        else:
            confidence = "Confident"

        print("\n--- AI Analysis ---")
        print(f"Speaking Time: {speaking_time:.2f} sec")
        print(f"Word Count: {word_count}")
        print(f"Filler Words: {filler_count}")
        print(f"Speaking Speed: {words_per_second:.2f} words/sec")
        print(f"Confidence Level: {confidence}")

    except Exception as e:
        print("Could not understand audio")
        print(e)