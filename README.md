## ▶️ Tubor

Tubor allows you to get transcripts for a given YouTube video. Turbo works with both video Id and simply the youtube url.

## Install
```
npm install tubor
```
or 
```
yarn add tubor
```

## Usage
Fetch transcripts from video ID
```typescript
import { getYoutubeTranscript } from 'tubor';
import { TranscriptResponse } from 'tubot/models';

const transcripts: TranscriptResponse = await getYoutubeTranscript('-a6E-r8W2Bs');
```

Fetch transcripts from youtube url
```typescript
const transcripts: TranscriptResponse = await getYoutubeTranscript('https://youtu.be/3XxiKcD-pMU?si=XmLLj5NqJAg4eIaJ');
```
