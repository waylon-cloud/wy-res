import {resolve} from 'path';
import * as cdk from '@aws-cdk/core';
import {Bucket} from '@aws-cdk/aws-s3';
import {AttributeType, BillingMode, Table} from '@aws-cdk/aws-dynamodb';
import {} from '@aws-cdk/aws-lambda';
import {RestAoi} from './constructs/RestApi';
interface WyResUploadStackProps extends cdk.StackProps {
  storageBucket?: Bucket;
  resourceTable?: Table;
  region?: string;
  stage?: string;
}

export class WyResUploadStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: WyResUploadStackProps = {}
  ) {
    super(scope, id, props);

    const {storageBucket, resourceTable} = props;
    let {region, stage} = props;
    region = region ? region : this.region;
    stage = stage ? stage : process.env.WAYLON_STAGE;

    const bucket = storageBucket
      ? storageBucket
      : new Bucket(this, 'storage-bucket', {
          bucketName: `waylon-file-storage-${this.account}-${region}-${stage}`,
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

    const uploadRequestFunction = new RestAoi(this, 'upload-request-function', {
      functionName: `waylon-upload-request-${stage}`,
      functionEntry: resolve(
        __dirname,
        '../../app/wy-res-upload/controller/http/index.ts'
      ),
      environment: {
        STORAGE_BUCKET: bucket.bucketName,
        RESOURCE_TABLE: table.tableName,
      },
      stage,
    });

    bucket.grantReadWrite(uploadRequestFunction.lambdaFunction);
    table.grantReadWriteData(uploadRequestFunction.lambdaFunction);
  }
}
