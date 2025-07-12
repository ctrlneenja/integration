import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
// Use `require` to import `formidable` correctly in Next.js (CommonJS)
const formidable = require('formidable'); // <-- Correct import using `require`
import { NextApiRequest, NextApiResponse } from 'next';

// Disable Next.js's built-in body parser for file uploads
export const config = {
  api: {
    bodyParser: false, // Use formidable to parse the request body instead
  },
};

// Function to extract text from PDF
const extractTextFromPDF = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    const pdf = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    pdf(buffer)
      .then((data: any) => resolve(data.text))
      .catch(reject);
  });
};

// Function to extract text from DOCX
const extractTextFromDOCX = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    const mammoth = require('mammoth');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      mammoth.extractRawText({ buffer: data })
        .then((result: any) => resolve(result.value))
        .catch(reject);
    });
  });
};

// Function to parse CSV (if using CSV format)
const parseCSV = (csvData: string) => {
  const lines = csvData.split('\n');
  const questions: any[] = [];

  // Process each line (each question)
  lines.forEach((line: string) => {
    const columns = line.split(',');
    if (columns.length >= 6) {
      const [question, option1, option2, option3, option4, correctAnswer, explanation] = columns;
      const options = [option1, option2, option3, option4];
      const correctAnswerIndex = options.indexOf(correctAnswer.trim());
      questions.push({
        text: question.trim(),
        options,
        correctAnswerIndex,
        explanation: explanation.trim(),
      });
    }
  });

  return questions;
};

// Main API handler for handling file uploads and parsing the file
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm();

  // Parse the incoming form data (including file)
  form.parse(req as IncomingMessage, res as ServerResponse, async (err, fields, files) => {
    if (err) {
      console.error('Error during form parsing:', err);
      res.status(500).json({ error: 'Failed to upload file' });
      return;
    }

    const file = files.file[0];
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = file.filepath;
    const fileExt = path.extname(file.originalFilename).toLowerCase();

    try {
      let textContent = '';
      
      // Extract text based on file type (PDF, DOCX, or TXT)
      if (fileExt === '.pdf') {
        textContent = await extractTextFromPDF(filePath);
      } else if (fileExt === '.docx') {
        textContent = await extractTextFromDOCX(filePath);
      } else if (fileExt === '.txt') {
        textContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        throw new Error('Unsupported file type');
      }

      // Process the text content (you can modify this based on your needs)
      const questions = parseCSV(textContent); // Adjust this based on your desired output
      res.status(200).json({ questions });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });
}
