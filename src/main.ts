import { getTranscripts } from './fetchers';
import { TranscriptResponse } from './models';

export async function getYoutubeTranscript(input: string) : Promise<TranscriptResponse> {
    try {
        if (input == null || input.trim().length === 0) {
            throw new Error('Please enter the Youtube video url or videoId.');
        }
        // Users can enter the Youtube videoId with a length of 11 or the url or the sharing url related to the Youtube video.
        const result = await getTranscripts(input);
        return result;
    } catch (error) {
        console.error('Main function error:', error);
        throw error;
    }
}