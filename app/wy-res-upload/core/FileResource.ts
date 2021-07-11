import {Entity, EntityVO} from './base/classes/Entity';

export interface FileResourceVO extends EntityVO {
  size?: number;
  type?: string;
  extension?: string;
  content?: ArrayBuffer;
}

export class FileResource extends Entity {
  constructor(values: FileResourceVO) {
    super(values);
  }
}
