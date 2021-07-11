import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import * as yup from 'yup';

interface UploadRequest {
  name: string;
}

const schema = yup.object().shape({
  name: yup.string(),
});

enum ErrorType {
  MISSING_INFORMATION = 'MISSING INFORMATION',
  INVALID_RESOURCE = 'INVALID RESOURCE',
}

class ServiceError extends Error {
  private type: ErrorType;

  constructor(type: ErrorType, message?: string) {
    super(message);
    this.type = type;
  }
  serialize() {
    return {
      type: this.type,
      message: this.message,
    };
  }
}

const successfulResponse = async (
  resource: object
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify(resource),
  };
};

const errorResponse = async (
  error: ServiceError
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 500,
    body: JSON.stringify(error.serialize()),
  };
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ServiceError(
        ErrorType.MISSING_INFORMATION,
        'Missing event body'
      );
    }
    const resourceJson = JSON.parse(event.body);
    try {
      await schema.isValid(resourceJson);
    } catch (e) {
      throw new ServiceError(
        ErrorType.INVALID_RESOURCE,
        'Resource is not valid'
      );
    }
    const resource = schema.cast(resourceJson) as UploadRequest;
    return successfulResponse(resource);
  } catch (error) {
    return errorResponse(error);
  }
};
