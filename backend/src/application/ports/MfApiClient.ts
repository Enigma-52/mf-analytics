export interface NavPoint {
  date: Date;
  nav: string;
}

export interface MfApiClient {
  fetchFullHistory(schemeCode: string): Promise<NavPoint[]>;
}
