import 'reflect-metadata';
import fs from 'fs';
import { info, warn } from 'console';
export class JsonDatabase<T extends JsonModel> {
    private filePath: string;
    private backupFilePath: string;
    private modelConstructor: new (...args: any[]) => T;
    private identifierField: any;
    private logs: Boolean = false;
    private warns: Boolean = true;
    private hasUnique: Boolean = true;
    private createJsonFileIfNotExists: Boolean = true;
    constructor(filePath: string, modelConstructor: new (...args: any[]) => T, logs=false,warns=true,hasUnique=true, createJsonFileIfNotExists=true,backupFilePath="") {
        this.filePath = filePath;
        this.modelConstructor = modelConstructor;
        this.logs = logs;
        this.warns = warns;
        this.hasUnique = hasUnique;
        this.createJsonFileIfNotExists = createJsonFileIfNotExists;
        this.backupFilePath = backupFilePath;
        if(!Reflect.hasMetadata('identifier:fieldName', this.modelConstructor)){
            throw new IdentifierNotFoundError(this.modelConstructor);
        }
        else{
        this.identifierField = Reflect.getMetadata('identifier:fieldName', this.modelConstructor);
        if (!fs.existsSync(this.filePath) && this.createJsonFileIfNotExists) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
            if(this.backupFilePath!==""){
                fs.writeFileSync(this.backupFilePath+new Date().toISOString().slice(0, 10)+".json", JSON.stringify([]));
            }
        }
        if(this.logs){
            info(`JsonDatabase initialized for model ${this.modelConstructor.name} at ${this.filePath}`);
        }
    }
    }
    public unregisterModel(): void {
        if (fs.existsSync(this.filePath)) {
            fs.unlinkSync(this.filePath);
        }
        if(this.logs){
            info(`JsonDatabase unregistered for model ${this.modelConstructor.name} at ${this.filePath}`);
        }
    }
    // Méthode pour convertir un objet JSON en instance de modèle avec les décorateurs
    private parseJsonToModel(jsonObj: any): T {
        const instance = Object.create(this.modelConstructor.prototype);
        Object.assign(instance, jsonObj);
        return instance;
    }

    // Méthode pour convertir un tableau d'objets JSON en instances de modèles
    private parseJsonArrayToModels(jsonArray: any[]): T[] {
        return jsonArray.map(obj => this.parseJsonToModel(obj));
    }

    public save(model: T): void {
        const allModels = this.findAll();
        if(this.hasUnique){
        const existingModel = allModels.find(item => item.getIdentifierValue() === model.getIdentifierValue());
        if (existingModel) {
            throw new IdentifierAlreadyExistsError(model.getIdentifierValue());
        }
    }
    else{
        warn(`save called but uniqueness is disabled. This may lead to duplicate identifiers.`);
    }
            if(fs.existsSync(this.filePath)|| this.createJsonFileIfNotExists){
            fs.writeFileSync(this.filePath, JSON.stringify([...allModels, model]));
            if(this.backupFilePath!==""){
                fs.writeFileSync(this.backupFilePath+new Date().toISOString().slice(0, 10)+".json", JSON.stringify([...allModels, model]));
            }
            else {
                warn(`File ${this.filePath} does not exist and createJsonFileIfNotExists is false. Model not saved.`);
            }
            if(this.logs){
                info(`Model with identifier ${model.getIdentifierValue()} saved.`);
            }
    }
}
    
    public saveOrUpdate(model: T): void {
        const existingModel: T | null = this.findById(model.getIdentifierValue());
        if (this.hasUnique && existingModel) {
            this.update(model);
            if(this.logs){
                info(`Model with identifier ${model.getIdentifierValue()} updated.`);
            }
        } else {
            this.save(model);
            if(this.logs){
                info(`Model with identifier ${model.getIdentifierValue()} saved.`);
            }
        }
        if((this.warns||this.logs) && !this.hasUnique){
            warn(`saveOrUpdate called but uniqueness is disabled. You can't update existing models reliably but you can save.`);
        }
    }

    public findById(id: any): T | null {
        if(this.hasUnique){
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const jsonArray: any[] = JSON.parse(data);
        const models = this.parseJsonArrayToModels(jsonArray);
        return models.find(item => item.getIdentifierValue() === id) || null;
        }
        else if(this.warns||this.logs){
                warn(`findById is not called because uniqueness is disabled and identifier can't be existing.`);
            }
        return null;
    }
    
    public delete(id: any): void {
      if(this.hasUnique){
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const jsonArray: any[] = JSON.parse(data);
        const models = this.parseJsonArrayToModels(jsonArray);
        const updatedModels = models.filter(item => (item as any)[this.identifierField] !== id);
        fs.writeFileSync(this.filePath, JSON.stringify(updatedModels));
        if(this.backupFilePath!==""){
            fs.writeFileSync(this.backupFilePath+new Date().toISOString().slice(0, 10)+".json", JSON.stringify(updatedModels));
        }
        if(this.logs){
            info(`Model with identifier ${id} deleted.`);
        }
    }
    else if(this.warns||this.logs){
            warn(`delete called but uniqueness is disabled because identifier can't be existing.`);
    }
}
    
    public update(model: T): void {
        if(this.hasUnique){
        const existingModel: T | null = this.findById(model.getIdentifierValue());
        if (existingModel) {
            const updatedModel = { ...existingModel, ...model };
            const allModels = this.findAll();
            const newModels = allModels.filter(item => item.getIdentifierValue() !== model.getIdentifierValue());
            newModels.push(updatedModel);
            fs.writeFileSync(this.filePath, JSON.stringify(newModels));
            if(this.backupFilePath!==""){
                fs.writeFileSync(this.backupFilePath+new Date().toISOString().slice(0, 10)+".json", JSON.stringify(newModels));
            }
            if(this.logs){
                info(`Model with identifier ${model.getIdentifierValue()} updated.`);
            }
        }
        else if(this.logs || this.warns){
                warn(`Model with identifier ${model.getIdentifierValue()} not found for update.`);
        }
    }
    else if(this.warns||this.logs){
            warn(`update is not called because uniqueness is disabled.`);
    }
}
    
    public findAll(): T[] {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const jsonArray: any[] = JSON.parse(data);
        return this.parseJsonArrayToModels(jsonArray);
    }
}

class IdentifierNotFoundError extends Error {
    constructor(modelConstructor: new (...args: any[]) => any) {
        super(`Model ${modelConstructor.name} has no Identifier`);
        this.name = "IdentifierNotFoundError";
    }
}

class IdentifierAlreadyExistsError extends Error {
    constructor(id: any) {
        super(`Model with identifier ${id} already exists.`);
        this.name = "IdentifierAlreadyExistsError";
    }
}

export class JsonModel{

    
    // Méthode pour récupérer le nom du champ identifiant depuis les métadonnées
    getIdentifierFieldName(): string | undefined {
        return Reflect.getMetadata('identifier:fieldName', this.constructor);
    }
    
    // Méthode pour récupérer la valeur de l'identifiant
    getIdentifierValue(): any {
        const fieldName = this.getIdentifierFieldName();
        return fieldName ? (this as any)[fieldName] : undefined;
    }
    
    // Propriété getter pour le nom du champ identifiant
    get identifierFieldName(): string | undefined {
        return this.getIdentifierFieldName();
    }
    
    // Méthode statique pour créer une instance à partir d'un objet JSON
    static fromJson<T extends JsonModel>(this: new (...args: any[]) => T, jsonObj: any): T {
        const instance = Object.create(this.prototype);
        Object.assign(instance, jsonObj);
        
        // Récupérer le nom du champ identifiant depuis les métadonnées
        const identifierField = Reflect.getMetadata('identifier:fieldName', this);
        if (identifierField && jsonObj[identifierField] !== undefined) {
            instance.identifier = jsonObj[identifierField];
        }
        
        return instance;
    }
}

// Décorateur d'identifiant simple et efficace
export function Identifier() {
    return function (target: any, propertyKey: string) {
        // Stocker le nom du champ identifiant dans les métadonnées
        Reflect.defineMetadata('identifier:fieldName', propertyKey, target.constructor);
        
        // Marquer la propriété comme identifiant
        Reflect.defineMetadata('identifier:property', true, target, propertyKey);
    };
}
