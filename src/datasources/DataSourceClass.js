class DataSourceClass {
  static instance;

  constructor (options) {
    if (DataSourceClass.instance) {
      return DataSourceClass.instance;
    }

    DataSourceClass.instance = this;
  }
}
