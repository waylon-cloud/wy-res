import {nanoid} from 'nanoid';
import {string, object, date, ValidationError} from 'yup';
import {EntityVO} from '../interfaces/EntityVO';
import {WyValidationError} from '../errors/WyValidationError';

export class Entity {
  uuid: string;
  name?: string;
  owner: string;
  created: Date;
  lastModified: Date;

  constructor(values: Partial<EntityVO>) {
    const schema = object().shape({
      uuid: string().uuid(),
      name: string(),
      owner: string().uuid().required(),
      created: date(),
      lastModified: date(),
    });

    try {
      schema.isValidSync(values);
    } catch (e) {
      const error = e as ValidationError;
      throw new WyValidationError(
        `Error validating class value object.\n(${error.message}):\n${error.errors}`
      );
    }

    this.uuid = values.uuid ? values.uuid : nanoid();
    const now = new Date();
    this.owner = values.owner!;
    this.created = values.created ? values.created : now;
    this.lastModified = values.lastModified ? values.lastModified : now;
  }
}

export * from '../interfaces/EntityVO';
