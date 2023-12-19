// models.ts

export class TranscriptResponse {
    public videoId: string;
    public status: string;
    public manuallyCreatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] }[];
    public generatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] };

    constructor(
        videoId: string,
        status: string,
        manuallyCreatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] }[],
        generatedTranscriptsContents: { [languageCode: string]: TranscriptObject[] }
    ) {
        this.videoId = videoId;
        this.status = status;
        this.manuallyCreatedTranscriptsContents = manuallyCreatedTranscriptsContents;
        this.generatedTranscriptsContents = generatedTranscriptsContents;
    }
}

export class Transcript {
    public videoId: string;
    public baseUrl: string;
    public name: string;
    public languageCode: string;
    public isAsr: boolean;
    public translationLanguages: { language: string; language_code: string }[];

    constructor(
        videoId: string,
        baseUrl: string,
        name: string,
        languageCode: string,
        isAsr: boolean,
        translationLanguages: { language: string; language_code: string }[]
    ) {
        this.videoId = videoId;
        this.baseUrl = baseUrl;
        this.name = name;
        this.languageCode = languageCode;
        this.isAsr = isAsr;
        this.translationLanguages = translationLanguages;
    }
}

export class TranscriptList {
    public videoId: string;
    public manuallyCreatedTranscripts: { [languageCode: string]: Transcript }[];
    public generatedTranscripts: { [languageCode: string]: Transcript };

    constructor(
        videoId: string,
        manuallyCreatedTranscripts: { [languageCode: string]: Transcript }[],
        generatedTranscripts: { [languageCode: string]: Transcript }
    ) {
        this.videoId = videoId;
        this.manuallyCreatedTranscripts = manuallyCreatedTranscripts;
        this.generatedTranscripts = generatedTranscripts;
    }
}

export class TranscriptDetail {
    public text: string;
    public start: number;
    public duration: number;

    constructor(text: string, start: number, duration: number) {
        this.text = text;
        this.start = start;
        this.duration = duration;
    }
}

export interface TranscriptObject {
    text: string;
    start: number;
    dur: number;
}