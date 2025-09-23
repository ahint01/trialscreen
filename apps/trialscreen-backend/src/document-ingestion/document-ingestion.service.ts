import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import pdfParse from 'pdf-parse';

interface ParsedPDFData {
  text: string;
}

@Injectable()
export class DocumentIngestionService {
  /**
   * Reads and parses a PDF file, extracting its text content.
   *
   * @param file The file object provided by Nest.js's file upload interceptor.
   * @returns A promise that resolves to the parsed text content of the document.
   */
  async parseDocument(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new HttpException(
        'Invalid file buffer provided.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const data = (await pdfParse(file.buffer)) as ParsedPDFData;
      return data.text;
    } catch (error) {
      let errorMessage = 'An unknown error occurred during PDF parsing.';
      if (error instanceof Error) {
        errorMessage = `Failed to parse PDF file: ${error.message}`;
      }
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
