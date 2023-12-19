import { getTranscripts } from './fetchers';
import { TranscriptResponse } from './models';
import { TuborBasicError, ExceptionCode } from './tuborerror';

export async function getYoutubeTranscript(input: string): Promise<TranscriptResponse> {
    try {
        if (input == null || input.trim().length === 0) {
            throw new TuborBasicError(ExceptionCode.PARAM_ERROR, 'Please enter a Youtube video url or a videoId.')
        }
        // Users can enter the Youtube videoId with a length of 11 or the url or the sharing url related to the Youtube video.
        const result = await getTranscripts(input);
        return result;
    } catch (error) {
        throw error;
    }
}