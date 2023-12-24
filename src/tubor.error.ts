export const ExceptionCode = {
  EMPTY_URL: 'TURBO.BASIC.0001',
  REQUEST_ERROR: 'TURBO.BASIC.0002',
  MATCH_ERROR: 'TURBO.BASIC.0003',
  EXTRACT_ERROR: 'TURBO.BASIC.0004',
  CAN_NOT_FIND_TRANSCRIPT: 'TURBO.BASIC.0005',
  DEFAULT_ERROR: 'TURBO.BASIC.9999',
} as const;

export class TuborBasicError extends Error {
  protected map: Map<string, string>;
  protected code: string = '';
  protected msg: string | undefined = '';
  protected detail: string = '';
  constructor(code: string = 'BASIC9999', detail: string = '') {
    super();
    this.map = new Map([
      ['TURBO.BASIC.0001', 'Empty url'],
      ['TURBO.BASIC.0002', 'Request error'],
      ['TURBO.BASIC.0003', 'Video not found'],
      ['TURBO.BASIC.0004', 'Extract html error'],
      ['TURBO.BASIC.0005', 'This youtube video does not have transcript'],
      ['TURBO.BASIC.9999', 'Default tuborBasicError'],
    ]);
    this.detail = detail;
    this.check(code, detail);
  }

  protected check(code: string = 'BASIC9999', detail: string = '') {
    this.detail = detail;
    if (this.map.has(code)) {
      this.code = code;
      this.msg = this.map.get(code);
    } else {
      this.code = 'BASIC9999';
      this.msg = this.map.get(code);
    }
  }
}

export class InvalidInputError extends TuborBasicError {}

export class VideoNotFoundError extends TuborBasicError {}

export class ExtractHtmlError extends TuborBasicError {}

export class AxiosRequestError extends TuborBasicError {}
