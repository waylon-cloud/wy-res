import {
  BundlingOptions,
  NodejsFunction,
  NodejsFunctionProps,
} from '@aws-cdk/aws-lambda-nodejs';
import {Construct} from '@aws-cdk/core';

export interface FunctionWithResourcesProps extends NodejsFunctionProps {
  resourcesPath: string;
}

export class FunctionWithResources extends NodejsFunction {
  constructor(scope: Construct, id: string, props: FunctionWithResourcesProps) {
    let bundlingOptions: BundlingOptions = {};
    if (props.resourcesPath) {
      bundlingOptions = {
        commandHooks: {
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r ${props.resourcesPath} ${outputDir}`];
          },
          beforeBundling: () => [],
          beforeInstall: () => [],
        },
      };
    }

    const properties: FunctionWithResourcesProps = Object.assign(
      {},
      {bundling: bundlingOptions},
      props
    );

    super(scope, id, properties);
  }
}
