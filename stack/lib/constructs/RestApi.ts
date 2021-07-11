import {NodejsFunction, NodejsFunctionProps} from '@aws-cdk/aws-lambda-nodejs';
import {Construct, Duration} from '@aws-cdk/core';
import {Certificate, ICertificate} from '@aws-cdk/aws-certificatemanager';
import {ARecord, HostedZone, RecordTarget} from '@aws-cdk/aws-route53';
import {
  DomainName,
  HttpApi,
  HttpMethod,
  IHttpRouteAuthorizer,
} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {ApiGatewayv2DomainProperties} from '@aws-cdk/aws-route53-targets';

import * as dashify from 'dashify';
import {
  FunctionWithResources,
  FunctionWithResourcesProps,
} from './FunctionWithResources';

export interface RestApiProps {
  name?: string;
  apiPath?: string;
  apiAuthorizer?: IHttpRouteAuthorizer;
  functionName?: string;
  functionResourcesPath?: string;
  functionEntry?: string;
  functionHandler?: string;
  hostedZoneId?: string;
  duration?: Duration;
  domainName?: string;
  httpMethods?: HttpMethod[];
  certificate?: Certificate | string;
  environment?: Record<string, string>;
  stage?: string;
}

export class RestAoi extends Construct {
  lambdaFunction: NodejsFunction;
  restApi: HttpApi;

  constructor(scope: Construct, id: string, props: RestApiProps) {
    super(scope, id);
    const {environment} = props;
    const name = dashify(props.name || id);

    const stage = props.stage || 'api';

    const functionName = `${name}-function-${stage}`;

    let lambda;
    if (props.functionResourcesPath) {
      const functionProps: FunctionWithResourcesProps = {
        functionName,
        timeout: props.duration || Duration.seconds(30),
        environment,
        entry: props.functionEntry,
        handler: props.functionHandler,
        resourcesPath: props.functionResourcesPath,
      };
      lambda = new FunctionWithResources(this, functionName, functionProps);
    } else {
      const functionProps: NodejsFunctionProps = {
        functionName,
        entry: props.functionEntry,
        handler: props.functionHandler,
        timeout: props.duration || Duration.seconds(30),
        environment,
      };

      lambda = new NodejsFunction(this, functionName, functionProps);
    }
    this.lambdaFunction = lambda;

    const apiName = `${name}-api-${stage}`;
    const restApi = new HttpApi(this, apiName, {
      apiName: name,
    });

    const endPointPath = props.apiPath || `/${stage}/${name}`;
    console.log('found pat ' + endPointPath);
    restApi.addRoutes({
      authorizer: props.apiAuthorizer,
      path: endPointPath,
      methods: props.httpMethods || [HttpMethod.ANY],
      integration: new LambdaProxyIntegration({
        handler: lambda,
      }),
    });

    this.restApi = restApi;

    if (props.domainName) {
      const certificateId = `${id}-domain-certificate`;
      let certificate: ICertificate;
      if (typeof props.certificate === 'string') {
        certificate = Certificate.fromCertificateArn(
          this,
          certificateId,
          props.certificate
        );
      } else {
        certificate = new Certificate(this, certificateId, {
          domainName: props.domainName,
        });
      }

      const domainName = new DomainName(this, `${id}-domain-name`, {
        domainName: props.domainName,
        certificate: certificate,
      });

      let hostedZone;
      if (props.hostedZoneId) {
        hostedZone = HostedZone.fromHostedZoneAttributes(
          this,
          `${id}-domain-hosted-zone`,
          {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.domainName.substring(
              props.domainName.indexOf('.') + 1
            ),
          }
        );
      } else {
        hostedZone = new HostedZone(this, `${id}-hosted-zone`, {
          zoneName: `${id}-hosted-zone`,
        });
      }

      new ARecord(this, `${id}-domain-name-record`, {
        zone: hostedZone,
        recordName: domainName.name,
        target: RecordTarget.fromAlias(
          new ApiGatewayv2DomainProperties(
            domainName.regionalDomainName,
            domainName.regionalHostedZoneId
          )
        ),
      });
    }
  }
}
