import {resolve} from 'path';
import * as cdk from '@aws-cdk/core';
import {Bucket} from '@aws-cdk/aws-s3';
import {AttributeType, BillingMode, Table} from '@aws-cdk/aws-dynamodb';
import {} from '@aws-cdk/aws-lambda';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
interface WaylonImageStackProps extends cdk.StackProps {
  storageBucket?: Bucket;
  resourceTable?: Table;
  region?: string;
  stage?: string;
}

export class WaylonImageStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: WaylonImageStackProps = {}
  ) {
    super(scope, id, props);

    const {storageBucket, resourceTable} = props;
    let {region, stage} = props;
    region = region ? region : this.region;
    stage = stage ? stage : process.env.WAYLON_STAGE;

    const bucket = storageBucket
      ? storageBucket
      : new Bucket(this, 'storage-bucket', {
          bucketName: `waylon-image-storage-${this.account}-${region}-${stage}`,
        });

    const table = resourceTable
      ? resourceTable
      : new Table(this, 'resource-table', {
          tableName: `waylon-resources-${region}-${stage}`,
          partitionKey: {
            name: 'pk',
            type: AttributeType.STRING,
          },
          billingMode: BillingMode.PAY_PER_REQUEST,
        });

    const uploadRequestFunction = new NodejsFunction(
      this,
      'upload-request-function',
      {
        functionName: `waylon-upload-request-${stage}`,
        description:
          'Function to handle upload requests and upload URL generation',
        entry: resolve(__dirname, '../../app/way-image/http/index.ts'),
      }
    );
  }
}
