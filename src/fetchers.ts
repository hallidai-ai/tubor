import axios, { AxiosRequestConfig } from 'axios';

import { TranscriptObject, TranscriptResponse } from './models';
import { transcriptParser } from './parsers';
import { AxiosRequestError, ExceptionCode } from './tubor.error';
import { buildTranscript, extractHtml, extractVideoId } from './utils';
const WATCH_URL = 'https://www.youtube.com/watch?v=';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

export async function getTranscripts(input: string, spiderApiKey?: string): Promise<TranscriptResponse> {
  const videoId = extractVideoId(input);
  try {
    const htmlContent = await htmlFetcher(videoId, spiderApiKey);
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
        manuallyCreatedTranscriptsContents[lang] = result;
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
export async function htmlFetcher(videoId: string, spiderApiKey?: string): Promise<string> {
  let responseData;
  try {
    if (spiderApiKey) {
      console.log('Using spider to fetch html');
      const response = await scrapeWebpage(WATCH_URL + videoId, spiderApiKey);
      return response.content;
    } else {
      const headers = {
        'User-Agent': USER_AGENT,
      };
      const config: AxiosRequestConfig = { headers, method: 'get', url: WATCH_URL + videoId };
      const response = await axios(config);
      responseData = response.data;
      return responseData;
    }
  } catch (error) {
    throw new AxiosRequestError(
      ExceptionCode.REQUEST_ERROR,
      `Error fetching HTML from ${WATCH_URL + videoId}: ${error}`,
    );
  }
}

export async function scrapeWebpage(url: string, spiderApiKey: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${spiderApiKey}`,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      limit: 1,
      request: 'http',
      url: url,
      return_format: 'raw',
      Proxy: 'auto',
    });

    const maxRetries = 3;
    let retries = 0;
    let success = false;
    let data;

    // TODO: sending retry event to client
    while (retries < maxRetries && !success) {
      try {
        console.log(`Attempt ${retries + 1} to scrape ${url}`);
        const response = await fetch('https://api.spider.cloud/crawl', {
          method: 'POST',
          headers: headers,
          body: body,
        });

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          return undefined;
        }
        data = await response.json();
        if (!data || !data.length || !data[0] || !data[0].content) {
          console.log(`No content found for ${url} will retry`);
          throw new Error('No content found');
        }
        success = true;
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed - ${error}`);
        retries++;
        if (retries === maxRetries) {
          console.log(`Max retries reached scraping ${url} - ${error}`);
          return undefined;
        }
      }
    }
    // if the response is empty, return null
    if (!data || !data.length || !data[0] || !data[0].content) {
      console.log(`No content found for ${url}`);
      return undefined;
    }
    // data[0].content = await this.cleanupWebpage(data[0].content);

    console.log(`Successfully scraped ${url}`);

    return data[0];
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
