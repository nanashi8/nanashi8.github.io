export type ReadingTechniquesMetaV1 = {
  version: 1;
  language: 'ja' | string;
  licenseNote: string;
};

export type ParagraphReadingPattern = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
  exampleEn: string;
};

export type ParagraphReadingPatternsFileV1 = ReadingTechniquesMetaV1 & {
  patterns: ParagraphReadingPattern[];
};

export type SentenceReadingPattern = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
  miniExampleEn: string;
};

export type SentenceReadingPatternsFileV1 = ReadingTechniquesMetaV1 & {
  patterns: SentenceReadingPattern[];
};

export type QuestionTypeStrategy = {
  id: string;
  title: string;
  gist: string;
  steps: string[];
  pitfalls: string[];
  miniExampleEn: string;
};

export type QuestionTypeStrategiesFileV1 = ReadingTechniquesMetaV1 & {
  strategies: QuestionTypeStrategy[];
};

export type Reading100Technique = {
  id: string;
  originIndex: number;
  category: string;
  title: string;
  gist: string;
  steps: string[];
  checks?: string[];
};

export type Reading100ParaphrasedFileV1 = ReadingTechniquesMetaV1 & {
  techniques: Reading100Technique[];
};
