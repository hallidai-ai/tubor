export const ExceptionCode = {
    PARAM_ERROR: 'TURBO.BASIC.0001',
    REQUEST_ERROR: 'TURBO.BASIC.0002',
    EXTRACT_ERROR: 'TURBO.BASIC.0003',
    DEFAULT_ERROR: 'TURBO.BASIC.9999'
} as const;

export class TuborBasicError extends Error {
    protected map: Map<string, string>;
    protected code: string = '';
    protected msg: string | undefined = '';
    protected detail: string = '';
    constructor(code: string = 'BASIC9999', detail: string = '') {
        super()
        this.map = new Map([
            ['TURBO.BASIC.0001', 'Parameter error'],
            ['TURBO.BASIC.0002', 'Request error'],
            ['TURBO.BASIC.0003', 'Extract error'],
            ['TURBO.BASIC.9999', 'Default TuborBasicError'],
        ])
        this.detail = detail;
        this.check(code, detail);
    }

    protected check(
        code: string = 'BASIC9999',
        detail: string = '',
    ) {
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
