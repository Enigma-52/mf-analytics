import { DrizzleFundRepository } from "../../infra/repositories/DrizzleFundRepository";
import { ComputeFundAnalytics } from "./ComputeFundAnalytics";

export class ComputeAllFundsAnalytics {
  constructor(
    private fundRepo: DrizzleFundRepository,
    private computeOne: ComputeFundAnalytics
  ) {}

  async runOnce() {
    const funds = await this.fundRepo.listAll();
    for (const f of funds) {
      console.log(`Computing analytics for ${f.code}`);
      await this.computeOne.runForFund(f.code);
    }
  }
}
