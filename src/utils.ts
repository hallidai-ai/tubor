import { unescape } from 'he';

import { Transcript, TranscriptList } from './models';
import {
  ExceptionCode,
  ExtractHtmlError,
  InvalidInputError,
  VideoNotFoundError,
} from './tubor.error';

export function isUTubeVideoLive(data: string): boolean {
  const splitStartDate = data.split('startDate');
  const splitEndDate = data.split('endDate');
  /**
   * case1: When there is startDate but no endDate, it is judged as Live. Return true.
   * case2: When there is no startDate , it is not a live. Return false.
   * case3: When there are both startDate and endDate, this is a live that has ended. Return false.
   * case4: When there is no startDate and endDate at the same time, this is a normal video. Return false.
   */
  if (splitStartDate.length > 1 && splitEndDate.length === 1) {
    return true;
  }
  return false;
}

export function extractHtml(html: string): any {
  if (isUTubeVideoLive(html)) {
    throw new ExtractHtmlError(
      ExceptionCode.NO_TRANSCRIPT_FOR_LIVE_VIDEO,
      `Invalid HTML content:  This Youtube video is a live broadcast, it does not have transcript`,
    );
  }
  const unescapedHtml = unescape(html);
  const splittedHtml = unescapedHtml.split('"captions":');
  if (splittedHtml.length <= 1) {
    throw new ExtractHtmlError(
      ExceptionCode.CAN_NOT_FIND_TRANSCRIPT,
      `Invalid HTML format: 'captions' section not found.This youtube video does not have corresponding transcript. ${unescapedHtml}`,
    );
  }
  const captionJson = JSON.parse(
    splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''),
  ).playerCaptionsTracklistRenderer;

  if (captionJson == null) {
    throw new ExtractHtmlError(
      ExceptionCode.EXTRACT_ERROR,
      "Invalid JSON: 'playerCaptionsTracklistRenderer' is null.",
    );
  }
  if (!('captionTracks' in captionJson)) {
    throw new ExtractHtmlError(
      ExceptionCode.EXTRACT_ERROR,
      "Missing 'captionTracks' property in 'playerCaptionsTracklistRenderer'.",
    );
  }
  return captionJson;
}

export function buildTranscript(captionsJson: any, videoId: string): TranscriptList {
  const translationLanguages = captionsJson.translationLanguages.map(
    (translationLanguage: any) => ({
      language: translationLanguage.languageName.simpleText,
      language_code: translationLanguage.languageCode,
    }),
  );

  const manuallyCreatedTranscripts: { [languageCode: string]: Transcript } = {};
  const generatedTranscripts: { [languageCode: string]: Transcript } = {};
  const transcriptObject: { [languageCode: string]: Transcript } = {};
  for (const caption of captionsJson.captionTracks) {
    const transcriptDict = new Transcript(
      videoId,
      caption.baseUrl,
      caption.name.simpleText,
      caption.languageCode,
      caption.kind === 'asr' ? 'asr' : caption.kind,
      caption.isTranslatable ? translationLanguages : [],
    );
    if (caption.kind === 'asr') {
      generatedTranscripts[caption.languageCode] = transcriptDict;
    } else {
      manuallyCreatedTranscripts[caption.languageCode] = transcriptDict;
    }
  }

  return new TranscriptList(videoId, manuallyCreatedTranscripts, generatedTranscripts);
}

export function extractVideoId(input: string): string {
  if (input == null || input.trim().length === 0) {
    throw new InvalidInputError(
      ExceptionCode.EMPTY_URL,
      'The input is blank, please enter a Youtube video url or a videoId.',
    );
  }
  if (input.length == 11) {
    return input;
  }
  const match = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|watch\?.+?&amp;v=|live\/))([^"&?\/\s]{11})/,
  );
  if (match && match[1]) {
    const videoId: string = match[1];
    console.log('YouTube video ID:', videoId);
    return videoId;
  } else {
    throw new VideoNotFoundError(
      ExceptionCode.MATCH_ERROR,
      `Failed to retrieve YouTube video ID. Video Url: ${input}`,
    );
  }
}
