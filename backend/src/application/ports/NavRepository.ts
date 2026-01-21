import { NavPoint } from "./MfApiClient";

export interface NavRepository {
  bulkUpsert(
    fundCode: string,
    rows: NavPoint[]
  ): Promise<void>;
}
