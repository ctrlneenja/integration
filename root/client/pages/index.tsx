import { useEffect, useState } from 'react';
import { Question } from '../../common/src/types';

export default function HomePage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [topic, setTopic] = useState<string>('Science');
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  // Fetch the initial question when the topic changes or file is uploaded
  useEffect(() => {
    if (!topic) return;

    fetch(`/api/quiz?topic=${encodeURIComponent(topic)}`)
      .then(res => res.json())
      .then(data => {
        setQuestion(data);
        setSelected(null); // Reset selected answer when a new question is fetched
      })
      .catch(err => console.error('Failed to fetch quiz', err));
  }, [topic]);

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTopic(e.target.value);
  };

  const handleNextQuestion = () => {
    // Fetch a new question when "Next Question" is clicked
    setSelected(null); // Reset the selected answer for the new question
    fetch(`/api/quiz?topic=${encodeURIComponent(topic)}&next=true`)
      .then(res => res.json())
      .then(data => {
        setQuestion(data);
        setSelected(null); // Reset selected answer for the new question
      })
      .catch(err => console.error('Failed to fetch next question', err));
  };

  // Handle file change (file upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files ? e.target.files[0] : null;
    if (uploadedFile) {
      setFile(uploadedFile);
      setError('');
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      setError('Please upload a file first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      setQuestions(data.questions); // Assuming your API returns the questions
    } catch (err) {
      setError('Failed to upload file or parse questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: 'auto' }}>
      <h1>Quiz App</h1>

      {/* File Upload Section */}
      <h2>Upload Your Own Questions File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload File'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Topic Selection */}
      <label htmlFor="topic">Choose a topic: </label>
      <select id="topic" value={topic} onChange={handleTopicChange}>
        <option value="Science">Science</option>
        <option value="History">History</option>
        <option value="Geography">Geography</option>
        <option value="Technology">Technology</option>
        <option value="General Knowledge">General Knowledge</option>
      </select>

      {!question && <p>Loading question...</p>}

      {/* Display Questions */}
      {question && (
        <>
          <h2>{question.text}</h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {question.options?.map((opt, index) => {
              let bgColor = '#eee';
              if (selected !== null) {
                if (index === question.correctAnswerIndex) bgColor = 'lightgreen';
                else if (index === selected && selected !== question.correctAnswerIndex) bgColor = 'salmon';
              }

              return (
                <li key={index}>
                  <button
                    style={{
                      backgroundColor: bgColor,
                      padding: '10px 20px',
                      margin: '5px 0',
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid #ccc',
                      cursor: selected === null ? 'pointer' : 'default',
                    }}
                    onClick={() => selected === null && setSelected(index)}
                    disabled={selected !== null}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>

          {selected !== null && (
            <>
              <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                {selected === question.correctAnswerIndex ? '✅ Correct!' : '❌ Incorrect.'}
              </p>
              <p><strong>Explanation:</strong> {question.explanation}</p>
            </>
          )}

          <button
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1em',
            }}
            onClick={handleNextQuestion}
          >
            Next Question
          </button>
        </>
      )}

      {/* Display Questions from Uploaded File */}
      {questions.length > 0 && (
        <div>
          <h3>Uploaded Questions</h3>
          <ul>
            {questions.map((question, index) => (
              <li key={index}>
                <h4>{question.text}</h4>
                <ul>
                  {question.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
                <p><strong>Explanation:</strong> {question.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}