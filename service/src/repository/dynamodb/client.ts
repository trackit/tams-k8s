import {createInjectionToken, inject} from "../../di";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBConfig} from "../../configParser";


export const dynamodbConfigToken = createInjectionToken<DynamoDBConfig>('dynamodbConfig', {
  useValue: {
    flowDeleteRequestsTableName: 'MY_TABLE' // TODO: replace with real value
  } as DynamoDBConfig // TODO: remove
})

export const dynamodbClientToken = createInjectionToken<DynamoDBClient>('dynamodbClient', {
  useFactory: () => {
    return new DynamoDBClient(inject(dynamodbConfigToken));
  }
})
