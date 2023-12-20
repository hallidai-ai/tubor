import { Transcript, TranscriptList } from "./models";
import { ExceptionCode, InvalidInputError, VideoNotFoundError, ExtractHtmlError } from "./tuborerror"
export function extractHtml(html: string): any {
    const splittedHtml = html.split('"captions":')
    if (splittedHtml.length <= 1) {
        throw new ExtractHtmlError(ExceptionCode.EXTRACT_ERROR, "Invalid HTML format: 'captions' section not found.");
    }
    const captionJson = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', '')).playerCaptionsTracklistRenderer;

    if (captionJson == null) {
        throw new ExtractHtmlError(ExceptionCode.EXTRACT_ERROR, "Invalid JSON: 'playerCaptionsTracklistRenderer' is null.");
    }
    if (!('captionTracks' in captionJson)) {
        throw new ExtractHtmlError(ExceptionCode.EXTRACT_ERROR, "Missing 'captionTracks' property in 'playerCaptionsTracklistRenderer'.");
    }
    return captionJson
}

export function buildTranscript(captionsJson: any, videoId: string): TranscriptList {

    const translationLanguages = captionsJson.translationLanguages.map(
        (translationLanguage: any) => ({
            language: translationLanguage.languageName.simpleText,
            language_code: translationLanguage.languageCode,
        })
    );

    var manuallyCreatedTranscripts: { [languageCode: string]: Transcript }[] = [];
    var generatedTranscripts: { [languageCode: string]: Transcript } = {};
    var transcriptObject: { [languageCode: string]: Transcript } = {};

    for (const caption of captionsJson.captionTracks) {
        const transcriptDict = new Transcript(
            videoId,
            caption.baseUrl,
            caption.name.simpleText,
            caption.languageCode,
            caption.kind === 'asr' ? 'asr' : caption.kind,
            caption.isTranslatable ? translationLanguages : []
        );
        if (caption.kind === 'asr') {
            generatedTranscripts[caption.languageCode] = transcriptDict
        } else {
            transcriptObject[caption.languageCode] = transcriptDict
            manuallyCreatedTranscripts.push(transcriptObject)
        }
    }

    return new TranscriptList(
        videoId,
        manuallyCreatedTranscripts,
        generatedTranscripts
    )
}

export function extractVideoId(input: string): string {
    if (input == null || input.trim().length === 0) {
        throw new InvalidInputError(ExceptionCode.EMPTY_URL, 'The input is blank, please enter a Youtube video url or a videoId.')
    }
    if (input.length == 11) {
        return input
    }
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|watch\?.+?&amp;v=))([^"&?\/\s]{11})/);
    if (match && match[1]) {
        const videoId: string = match[1];
        console.log("YouTube video ID:", videoId);
        return videoId;
    } else {
        throw new VideoNotFoundError(ExceptionCode.MATCH_ERROR, `Failed to retrieve YouTube video ID. Video Url: ${input}`);
    }
}