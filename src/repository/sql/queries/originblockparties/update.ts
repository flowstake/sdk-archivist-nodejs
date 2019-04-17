/*
 * File: update.ts
 * Project: sdk-archivist-nodejs
 * File Created: Tuesday, 16th April 2019 9:19:00 am
 * Author: XYO Development Team (support@xyo.network)
 * -----
 * Last Modified: Tuesday, 16th April 2019 6:09:07 pm
 * Modified By: XYO Development Team (support@xyo.network>)
 * -----
 * Copyright 2017 - 2019 XY - The Persistent Company
 */

import { SqlQuery } from "../query"
import { SqlService } from "../../sql-service"
import { IXyoSerializationService } from "@xyo-network/serialization"
import _ from 'lodash'
import { IXyoSignature, IXyoPublicKey } from "@xyo-network/signing"

// tslint:disable:prefer-array-literal

export class UpdateOriginBlockPartiesQuery extends SqlQuery {

  constructor(sql: SqlService, serialization: IXyoSerializationService) {
    super(sql, `
      UPDATE OriginBlockParties
      SET previousOriginBlockPartyId = ?
      WHERE id IN (
        SELECT
          id
        FROM (
          SELECT
            obp2.id as id
          FROM OriginBlockParties obp2
            JOIN (
              SELECT
                obp.id as originBlockId,
                ob.signedHash as signedHash,
                k.publicKeyId as publicKeyId,
                obp.nextPublicKeyId as nextPublicKeyId
              FROM OriginBlockParties obp
                JOIN OriginBlocks ob on ob.id = obp.originBlockId
                JOIN KeySignatures k on k.originBlockPartyId = obp.id
              WHERE obp.id = ?
            ) as other on other.signedHash = obp2.previousOriginBlockHash
            LEFT JOIN KeySignatures k2 on k2.originBlockPartyId = obp2.id
          WHERE other.nextPublicKeyId = k2.publicKeyId OR other.publicKeyId = k2.publicKeyId
          GROUP BY obp2.id
        ) as OriginBlockPartyIdsToUpdate
      );
    `,
    serialization)
  }

  public async send(
    { originBlockPartyId }: {originBlockPartyId: number}
  ) {
    return this.sql.query(
      this.query,
      [originBlockPartyId, originBlockPartyId]
    )
  }
}