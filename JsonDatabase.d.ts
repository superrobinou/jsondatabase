import 'reflect-metadata';
export declare class JsonDatabase<T extends JsonModel> {
    private filePath;
    private backupFilePath;
    private modelConstructor;
    private identifierField;
    private logs;
    private warns;
    private hasUnique;
    private createJsonFileIfNotExists;
    constructor(filePath: string, modelConstructor: new (...args: any[]) => T, logs?: boolean, warns?: boolean, hasUnique?: boolean, createJsonFileIfNotExists?: boolean, backupFilePath?: string);
    unregisterModel(): void;
    private parseJsonToModel;
    private parseJsonArrayToModels;
    save(model: T): void;
    saveOrUpdate(model: T): void;
    findById(id: any): T | null;
    delete(id: any): void;
    update(model: T): void;
    findAll(): T[];
}
export declare class JsonModel {
    getIdentifierFieldName(): string | undefined;
    getIdentifierValue(): any;
    get identifierFieldName(): string | undefined;
    static fromJson<T extends JsonModel>(this: new (...args: any[]) => T, jsonObj: any): T;
}
export declare function Identifier(): (target: any, propertyKey: string) => void;
//# sourceMappingURL=JsonDatabase.d.ts.map