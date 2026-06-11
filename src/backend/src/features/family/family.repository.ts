import type { RowDataPacket } from "mysql2";
import type { DbPool } from "../../server/db.js";
import type { FamilyContext } from "../../domain/types.js";

type FamilyContextRow = RowDataPacket & {
  family_id: string;
  family_name: string;
  child_id: string;
  child_nickname: string;
};

export class FamilyRepository {
  constructor(private readonly db: DbPool) {}

  async getSingleChildContext(familyId: string): Promise<FamilyContext | undefined> {
    const [rows] = await this.db.execute<FamilyContextRow[]>(
      `select
         f.id as family_id,
         f.name as family_name,
         u.id as child_id,
         u.nickname as child_nickname
       from family f
       join \`user\` u
         on u.family_id = f.id
        and u.role = 'child'
        and u.deleted_at is null
       where f.id = :familyId
       order by u.created_at
       limit 2`,
      { familyId }
    );

    if (rows.length !== 1) {
      return undefined;
    }

    const row = rows[0];
    return {
      family: {
        id: row.family_id,
        name: row.family_name
      },
      child: {
        id: row.child_id,
        nickname: row.child_nickname
      }
    };
  }
}
