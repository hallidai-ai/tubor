import axios, { AxiosRequestConfig } from 'axios';
import he from 'he';
import { extractHtml, buildTranscript, extractVideoId } from './utils';
import { transcriptParser } from './parsers';
import { TranscriptObject, TranscriptResponse } from './models';
import { AxiosRequestError, ExceptionCode } from './tuborerror';

const WATCH_URL = "https://www.youtube.com/watch?v=";

export async function getTranscripts(input: string): Promise<TranscriptResponse> {
    const videoId = extractVideoId(input)
    try {
        const htmlContent = await htmlFetcher(videoId);
        const captionJson = extractHtml(htmlContent);
        const transcriptList = buildTranscript(captionJson, videoId);

        var manuallyCreatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] }[] = [];
        var generatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] } = {};
        for (const transcriptObject of transcriptList.manuallyCreatedTranscripts) {
            for (const languageCode in transcriptObject) {
                const transcript = transcriptObject[languageCode];
                const baseUrl = transcript.baseUrl;
                const responseData = await transcriptContestFetcher(baseUrl);
                const result: TranscriptObject[] = transcriptParser(responseData);
                manuallyCreatedTranscriptsContents.push({ [languageCode]: result });
            };
        };
        if (Object.keys(transcriptList.generatedTranscripts).length > 0) {
            // there are only one generatedTranscripts
            const lang: string = Object.keys(transcriptList.generatedTranscripts)[0]
            const transcript = transcriptList.generatedTranscripts[lang]
            const baseUrl = transcript.baseUrl;
            const responseData = await transcriptContestFetcher(baseUrl);
            const result: TranscriptObject[] = transcriptParser(responseData);
            generatedTranscriptsContents[lang] = result;
        }
        return new TranscriptResponse(videoId, 'Succeed', manuallyCreatedTranscriptsContents, generatedTranscriptsContents);
    } catch (error) {
        throw error;
    }
}

// Get the content of utube page html
export async function htmlFetcher(videoId: string): Promise<string> {
    try {
        const response = await axios.get(WATCH_URL + videoId);
        return he.unescape(response.data);
    } catch (error) {
        throw new AxiosRequestError(ExceptionCode.REQUEST_ERROR, `Error fetching HTML from ${WATCH_URL + videoId}: ${error}`)
    }
}

// Get the transcript xml content
export async function transcriptContestFetcher(url: string): Promise<string> {
    try {
        const headers = { 'Accept-Language': 'en-US' };
        const config: AxiosRequestConfig = { headers, method: 'get', url };
        const response = await axios(config);
        return response.data;
    } catch (error) {
        throw new AxiosRequestError(ExceptionCode.REQUEST_ERROR, `Error fetching transcript content from ${url}: ${error}`)
    }
}