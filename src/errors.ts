export class HolesInSegmentsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "PathErrors.HolesInSegmentsError";
  }
}

export class ZeroSegmentsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "PathErrors.ZeroSegmentsError";
  }
}

export class NormalizeGoingOutsideRootError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "PathErrors.NormalizeGoingOutsideRootError";
  }
}

export class RelativeToSelfError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "PathErrors.RelativeToSelfError";
  }
}
