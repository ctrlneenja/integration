import type { NextApiRequest, NextApiResponse } from 'next';
import { Question } from '../../../common/src/types';

const GEMINI_API_KEY = 'AIzaSyBdiu3L2kueSD2AiDRZ0KUC1K0P6Jz-9N0';  // Add your actual API key here

export default async function handler(
  req: NextApiRequest & { method?: string },
  res: NextApiResponse<Question | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const topic = typeof req.query.topic === 'string' ? req.query.topic : 'General';
  const isNextQuestion = req.query.next === 'true'; // Check if it's a "next" question request

  try {
    // Prompt that you want to send to the Gemini API to generate a quiz question
    const prompt = `Create a multiple-choice quiz question about "${topic}". Return only a JSON object with this exact format:

    {
      "text": "What is the capital of France?",
      "options": ["Paris", "Berlin", "Rome", "Madrid"],
      "correctAnswerIndex": 0,
      "explanation": "Paris is the capital city of France."
    }

    - Only one correct answer.
    - Ensure the JSON is valid.
    - Do not include extra commentary.
    - Use common knowledge level unless otherwise stated.`;

    // Payload to send to Gemini API
    const data = {
      contents: [
        {
          parts: [
            {
              text: prompt, // Your prompt here
            },
          ],
        },
      ],
    };

    // Gemini API endpoint
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // Native fetch request to the Gemini API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,  // Ensure you're using your Gemini API key
      },
      body: JSON.stringify(data),
    });

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    // Parse the response from Gemini API
    const responseData = await response.json();

    // Log the response data to inspect its structure
    console.log('Response Data:', JSON.stringify(responseData, null, 2));  // Inspect the response structure

    // Safeguard before accessing response properties
    if (
      responseData && 
      responseData.candidates && 
      responseData.candidates.length > 0 && 
      responseData.candidates[0].content
    ) {
      try {
        // Access the content directly
        const content = responseData.candidates[0].content;

        // Log the content to see its structure
        console.log('Content:', JSON.stringify(content, null, 2));  // Log the content as a readable string

        // Extract the JSON string from the text and remove the markdown syntax (```json and ```
        const rawJson = content.parts[0].text.replace(/```json\n|\n```/g, '').trim();

        // Parse the extracted JSON string
        const parsed = JSON.parse(rawJson);

        // Assuming content contains the quiz question in the expected format
        const question: Question = {
          id: Date.now(),  // Unique ID based on timestamp
          type: 'Solo',
          topic,
          text: parsed.text,  // Quiz question text
          options: parsed.options,  // Multiple-choice options
          correctAnswerIndex: parsed.correctAnswerIndex,  // Index of the correct answer
          explanation: parsed.explanation,  // Explanation of the correct answer
        };

        // Return the question object as the response
        return res.status(200).json(question);
      } catch (parseError) {
        console.error('Error processing content:', parseError);
        return res.status(500).json({ error: 'Error processing quiz content' });
      }
    } else {
      console.error('Invalid response data structure:', responseData);
      return res.status(500).json({ error: 'Invalid response data structure' });
    }

  } catch (error) {
    console.error('Error generating quiz content:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
