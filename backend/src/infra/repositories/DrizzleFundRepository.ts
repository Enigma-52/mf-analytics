import { db } from "../db";
import { funds } from "../db/schema";
import { FundRepository, Fund } from "../../application/ports/FundRepository";

export class DrizzleFundRepository implements FundRepository {
  async getAllFunds(): Promise<Fund[]> {
    return db.select().from(funds);
  }
  async listAll(): Promise<{ code: string }[]> {
    return db
      .select({
        code: funds.code,
      })
      .from(funds);
  }
}
