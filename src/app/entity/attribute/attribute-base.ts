export class AttributeBase<T> {
  key: string;
  name: string;
  label: string;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  controlType: string;

  constructor(options: {
    key?: string,
    name?: string,
    label?: string,
    primaryKey?: boolean,
    unique?: boolean,
    autoIncrement?: boolean,
    controlType?: string
  } = {}) {
    this.key = options.key || '';
    this.name = options.name || '';
    this.label = options.label || '';
    this.primaryKey = options.primaryKey;
    this.unique = options.unique;
    this.autoIncrement = options.autoIncrement;
    this.controlType = options.controlType || '';
  }
}
