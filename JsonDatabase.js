"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonModel = exports.JsonDatabase = void 0;
exports.Identifier = Identifier;
require("reflect-metadata");
const fs_1 = __importDefault(require("fs"));
const console_1 = require("console");
class JsonDatabase {
    filePath;
    backupFilePath;
    modelConstructor;
    identifierField;
    logs = false;
    warns = true;
    hasUnique = true;
    createJsonFileIfNotExists = true;
    constructor(filePath, modelConstructor, logs = false, warns = true, hasUnique = true, createJsonFileIfNotExists = true, backupFilePath = "") {
        this.filePath = filePath;
        this.modelConstructor = modelConstructor;
        this.logs = logs;
        this.warns = warns;
        this.hasUnique = hasUnique;
        this.createJsonFileIfNotExists = createJsonFileIfNotExists;
        this.backupFilePath = backupFilePath;
        if (!Reflect.hasMetadata('identifier:fieldName', this.modelConstructor)) {
            throw new IdentifierNotFoundError(this.modelConstructor);
        }
        else {
            this.identifierField = Reflect.getMetadata('identifier:fieldName', this.modelConstructor);
            if (!fs_1.default.existsSync(this.filePath) && this.createJsonFileIfNotExists) {
                fs_1.default.writeFileSync(this.filePath, JSON.stringify([]));
                if (this.backupFilePath !== "") {
                    fs_1.default.writeFileSync(this.backupFilePath + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify([]));
                }
            }
            if (this.logs) {
                (0, console_1.info)(`JsonDatabase initialized for model ${this.modelConstructor.name} at ${this.filePath}`);
            }
        }
    }
    unregisterModel() {
        if (fs_1.default.existsSync(this.filePath)) {
            fs_1.default.unlinkSync(this.filePath);
        }
        if (this.logs) {
            (0, console_1.info)(`JsonDatabase unregistered for model ${this.modelConstructor.name} at ${this.filePath}`);
        }
    }
    // Méthode pour convertir un objet JSON en instance de modèle avec les décorateurs
    parseJsonToModel(jsonObj) {
        const instance = Object.create(this.modelConstructor.prototype);
        Object.assign(instance, jsonObj);
        return instance;
    }
    // Méthode pour convertir un tableau d'objets JSON en instances de modèles
    parseJsonArrayToModels(jsonArray) {
        return jsonArray.map(obj => this.parseJsonToModel(obj));
    }
    save(model) {
        const allModels = this.findAll();
        if (this.hasUnique) {
            const existingModel = allModels.find(item => item.getIdentifierValue() === model.getIdentifierValue());
            if (existingModel) {
                throw new IdentifierAlreadyExistsError(model.getIdentifierValue());
            }
        }
        else {
            (0, console_1.warn)(`save called but uniqueness is disabled. This may lead to duplicate identifiers.`);
        }
        if (fs_1.default.existsSync(this.filePath) || this.createJsonFileIfNotExists) {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify([...allModels, model]));
            if (this.backupFilePath !== "") {
                fs_1.default.writeFileSync(this.backupFilePath + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify([...allModels, model]));
            }
            else {
                (0, console_1.warn)(`File ${this.filePath} does not exist and createJsonFileIfNotExists is false. Model not saved.`);
            }
            if (this.logs) {
                (0, console_1.info)(`Model with identifier ${model.getIdentifierValue()} saved.`);
            }
        }
    }
    saveOrUpdate(model) {
        const existingModel = this.findById(model.getIdentifierValue());
        if (this.hasUnique && existingModel) {
            this.update(model);
            if (this.logs) {
                (0, console_1.info)(`Model with identifier ${model.getIdentifierValue()} updated.`);
            }
        }
        else {
            this.save(model);
            if (this.logs) {
                (0, console_1.info)(`Model with identifier ${model.getIdentifierValue()} saved.`);
            }
        }
        if ((this.warns || this.logs) && !this.hasUnique) {
            (0, console_1.warn)(`saveOrUpdate called but uniqueness is disabled. You can't update existing models reliably but you can save.`);
        }
    }
    findById(id) {
        if (this.hasUnique) {
            const data = fs_1.default.readFileSync(this.filePath, 'utf-8');
            const jsonArray = JSON.parse(data);
            const models = this.parseJsonArrayToModels(jsonArray);
            return models.find(item => item.getIdentifierValue() === id) || null;
        }
        else if (this.warns || this.logs) {
            (0, console_1.warn)(`findById is not called because uniqueness is disabled and identifier can't be existing.`);
        }
        return null;
    }
    delete(id) {
        if (this.hasUnique) {
            const data = fs_1.default.readFileSync(this.filePath, 'utf-8');
            const jsonArray = JSON.parse(data);
            const models = this.parseJsonArrayToModels(jsonArray);
            const updatedModels = models.filter(item => item[this.identifierField] !== id);
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(updatedModels));
            if (this.backupFilePath !== "") {
                fs_1.default.writeFileSync(this.backupFilePath + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(updatedModels));
            }
            if (this.logs) {
                (0, console_1.info)(`Model with identifier ${id} deleted.`);
            }
        }
        else if (this.warns || this.logs) {
            (0, console_1.warn)(`delete called but uniqueness is disabled because identifier can't be existing.`);
        }
    }
    update(model) {
        if (this.hasUnique) {
            const existingModel = this.findById(model.getIdentifierValue());
            if (existingModel) {
                const updatedModel = { ...existingModel, ...model };
                const allModels = this.findAll();
                const newModels = allModels.filter(item => item.getIdentifierValue() !== model.getIdentifierValue());
                newModels.push(updatedModel);
                fs_1.default.writeFileSync(this.filePath, JSON.stringify(newModels));
                if (this.backupFilePath !== "") {
                    fs_1.default.writeFileSync(this.backupFilePath + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(newModels));
                }
                if (this.logs) {
                    (0, console_1.info)(`Model with identifier ${model.getIdentifierValue()} updated.`);
                }
            }
            else if (this.logs || this.warns) {
                (0, console_1.warn)(`Model with identifier ${model.getIdentifierValue()} not found for update.`);
            }
        }
        else if (this.warns || this.logs) {
            (0, console_1.warn)(`update is not called because uniqueness is disabled.`);
        }
    }
    findAll() {
        const data = fs_1.default.readFileSync(this.filePath, 'utf-8');
        const jsonArray = JSON.parse(data);
        return this.parseJsonArrayToModels(jsonArray);
    }
}
exports.JsonDatabase = JsonDatabase;
class IdentifierNotFoundError extends Error {
    constructor(modelConstructor) {
        super(`Model ${modelConstructor.name} has no Identifier`);
        this.name = "IdentifierNotFoundError";
    }
}
class IdentifierAlreadyExistsError extends Error {
    constructor(id) {
        super(`Model with identifier ${id} already exists.`);
        this.name = "IdentifierAlreadyExistsError";
    }
}
class JsonModel {
    // Méthode pour récupérer le nom du champ identifiant depuis les métadonnées
    getIdentifierFieldName() {
        return Reflect.getMetadata('identifier:fieldName', this.constructor);
    }
    // Méthode pour récupérer la valeur de l'identifiant
    getIdentifierValue() {
        const fieldName = this.getIdentifierFieldName();
        return fieldName ? this[fieldName] : undefined;
    }
    // Propriété getter pour le nom du champ identifiant
    get identifierFieldName() {
        return this.getIdentifierFieldName();
    }
    // Méthode statique pour créer une instance à partir d'un objet JSON
    static fromJson(jsonObj) {
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
exports.JsonModel = JsonModel;
// Décorateur d'identifiant simple et efficace
function Identifier() {
    return function (target, propertyKey) {
        // Stocker le nom du champ identifiant dans les métadonnées
        Reflect.defineMetadata('identifier:fieldName', propertyKey, target.constructor);
        // Marquer la propriété comme identifiant
        Reflect.defineMetadata('identifier:property', true, target, propertyKey);
    };
}
//# sourceMappingURL=JsonDatabase.js.map