import {Entity, EntityVO} from './base/classes/Entity';

export type FileResourceVO = EntityVO;

export class FileResource extends Entity {
  constructor(values: FileResourceVO) {
    super(values);
  }
}
