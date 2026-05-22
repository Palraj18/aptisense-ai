import json
import urllib.request
import urllib.error
import time

BASE = "http://127.0.0.1:8000/api/v1"


def post(path, payload):
    url = BASE + path
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def get(path):
    url = BASE + path
    with urllib.request.urlopen(url, timeout=60) as resp:
        return json.load(resp)


if __name__ == '__main__':
    try:
        print('Starting interview session...')
        start_payload = {
            'interview_type': 'technical',
            'position': 'E2E Test Position',
            'experience_level': 'mid',
            'enable_proctoring': True
        }
        start = post('/interview/start', start_payload)
        print('\nStart response:')
        print(json.dumps(start, indent=2))

        session_id = start.get('session_id')
        qid = start.get('first_question_id')
        qtext = start.get('first_question')

        print(f"\nSession ID: {session_id}\nQuestion ID: {qid}\nQuestion: {qtext}\n")

        print('Submitting sample answer...')
        answer_payload = {
            'session_id': session_id,
            'question_id': qid,
            'answer_text': 'I would approach this problem by first clarifying requirements, then designing the data model and API, and iterating with tests.',
            'typing_metrics': {
                'typingSpeed': 48,
                'backspaces': 2,
                'hesitationTime': 0.5,
                'totalTime': 30
            }
        }

        answer_resp = post('/interview/answer', answer_payload)
        print('\nAnswer response:')
        print(json.dumps(answer_resp, indent=2))

        print('\nRequesting next question...')
        next_q = get(f'/interview/next-question/{session_id}')
        print('\nNext question response:')
        print(json.dumps(next_q, indent=2))

        print('\nEnding interview...')
        # send an empty JSON body to the end endpoint
        end = post(f'/interview/end/{session_id}', {})
        print('\nEnd response:')
        print(json.dumps(end, indent=2))

        print('\nFetching final report...')
        report = get(f'/interview/report/{session_id}')
        print('\nReport:')
        print(json.dumps(report, indent=2))

    except urllib.error.HTTPError as http_err:
        print('HTTP error:', http_err.code, http_err.read().decode())
    except Exception as e:
        print('Error during E2E test:', str(e))
