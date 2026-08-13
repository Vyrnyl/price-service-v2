declare module 'pdfkit' {
  import type { Writable } from 'stream';

  interface PDFDocumentOptions {
    autoFirstPage?: boolean;
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    size?: string | [number, number];
    margin?: number;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    pipe(destination: Writable): this;
    text(text: string, options?: Record<string, any>): this;
    text(text: string, x: number, options?: Record<string, any>): this;
    text(text: string, x: number, y: number, options?: Record<string, any>): this;
    font(name: string): this;
    fontSize(size: number): this;
    moveDown(step?: number): this;
    end(): this;
  }

  export default PDFDocument;
}
