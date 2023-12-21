import { unescape } from 'he';
import { xml2json } from 'xml-js';

interface TranscriptObject {
  text: string;
  start: number;
  dur: number;
}

export function transcriptParser(input: string): TranscriptObject[] {
  const jsonData = JSON.parse(xml2json(input, { compact: true, spaces: 2 }));
  const transcript = jsonData.transcript;
  const textArray = Array.isArray(transcript.text) ? transcript.text : [transcript.text];

  return textArray.map((textData: any) => ({
    // Use the regular expression /\n/g and /\t/g to replace \n and \t with the empty string ''
    text: unescape(textData._text.replace(/\n/g, '').replace(/\t/g, '')),
    // If the start or dur is null or undefined use 0.0 as the default value
    start: parseFloat(textData._attributes.start) || 0.0,
    dur: parseFloat(textData._attributes.dur) || 0.0,
  }));
}
