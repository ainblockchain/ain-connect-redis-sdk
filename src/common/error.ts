export const enum STATUS_CODE {
  success = '0',
  invalidParams = '1',
  unhandledRequest = '2',
  unexpected = '500',
}

export class ConnectError extends Error {
  static MESSAGE = {
    0: 'success',
    1: 'It is invalid Parameter',
    500: 'It is Unexpected Error',
  };

  private errorMessage?: string

  constructor(private statusCode: string) {
    super();
    this.name = 'CustomError';
    if (!ConnectError.MESSAGE[statusCode]) {
      this.statusCode = STATUS_CODE.unexpected;
    }
    this.errorMessage = ConnectError.MESSAGE[this.statusCode];
  }

  showAlert() {
    return `CustomError [statusCode: ${this.statusCode}, message: ${this.errorMessage}]`;
  }

  getData() {
    return { statusCode: this.statusCode, errorMessage: this.errorMessage };
  }
}
