import { NOTE_CONTENT_MAX_LENGTH } from '@/features/notes/constants';

const LEAD_LINE_MAX_LENGTH = 200;

export function shouldConvertPasteToFile(text: string): boolean {
  return text.length > NOTE_CONTENT_MAX_LENGTH;
}

export function createPastedFile(text: string): File {
  return new File([text], `pasted-${Date.now()}.md`, { type: 'text/markdown' });
}

export function extractLeadLine(text: string): string {
  const line =
    text
      .split('\n')
      .map((entry) => entry.trim())
      .find((entry) => entry.length > 0) ?? '';
  return line.slice(0, LEAD_LINE_MAX_LENGTH);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Failed to read file'));
    });
    reader.readAsDataURL(file);
  });
}
