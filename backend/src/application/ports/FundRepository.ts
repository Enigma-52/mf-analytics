export interface Fund {
  code: string;
  name: string;
  amc: string;
  category: string;
}

export interface FundRepository {
  getAllFunds(): Promise<Fund[]>;
}
