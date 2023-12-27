import axios, { AxiosRequestConfig } from 'axios';

import { TranscriptObject, TranscriptResponse } from './models';
import { transcriptParser } from './parsers';
import { AxiosRequestError, ExceptionCode } from './tubor.error';
import { buildTranscript, extractHtml, extractVideoId } from './utils';

const WATCH_URL = 'https://www.youtube.com/watch?v=';

export async function getTranscripts(input: string): Promise<TranscriptResponse> {
  const videoId = extractVideoId(input);
  try {
    const htmlContent = await htmlFetcher(videoId);
    const captionJson = extractHtml(htmlContent);
    const transcriptList = buildTranscript(captionJson, videoId);

    const manuallyCreatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] } = {};
    const generatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] } = {};
    if (Object.keys(transcriptList.manuallyCreatedTranscripts).length > 0) {
      for (const lang of Object.keys(transcriptList.manuallyCreatedTranscripts)) {
        const manuallyTranscript = transcriptList.manuallyCreatedTranscripts[lang];
        const baseUrl = manuallyTranscript.baseUrl;
        const responseData = await transcriptContestFetcher(baseUrl);
        const result: TranscriptObject[] = transcriptParser(responseData);
        manuallyCreatedTranscriptsContents[lang] = result
      }
    }
    if (Object.keys(transcriptList.generatedTranscripts).length > 0) {
      // there are only one generatedTranscripts
      const lang: string = Object.keys(transcriptList.generatedTranscripts)[0];
      const transcript = transcriptList.generatedTranscripts[lang];
      const baseUrl = transcript.baseUrl;
      const responseData = await transcriptContestFetcher(baseUrl);
      const result: TranscriptObject[] = transcriptParser(responseData);
      generatedTranscriptsContents[lang] = result;
    }
    return new TranscriptResponse(
      videoId,
      'Succeed',
      manuallyCreatedTranscriptsContents,
      generatedTranscriptsContents,
    );
  } catch (error) {
    throw error;
  }
}

// Get the content of utube page html
export async function htmlFetcher(videoId: string): Promise<string> {
  let responseData;
  try {
    const response = await axios.get(WATCH_URL + videoId);
    responseData = response.data;
  } catch (error) {
    throw new AxiosRequestError(
      ExceptionCode.REQUEST_ERROR,
      `Error fetching HTML from ${WATCH_URL + videoId}: ${error}`,
    );
  }
  return responseData;
}

// Get the transcript xml content
export async function transcriptContestFetcher(url: string): Promise<string> {
  try {
    const headers = { 'Accept-Language': 'en-US' };
    const config: AxiosRequestConfig = { headers, method: 'get', url };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new AxiosRequestError(
      ExceptionCode.REQUEST_ERROR,
      `Error fetching transcript content from ${url}: ${error}`,
    );
  }
}
