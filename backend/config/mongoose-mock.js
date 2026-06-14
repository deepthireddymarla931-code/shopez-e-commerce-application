const bcrypt = require('bcryptjs');

// Global in-memory datastore
const db = {
  users: [],
  stocks: [],
  transactions: [],
  portfolios: []
};

// Generate 24-char hex string to simulate Mongoose ObjectId
const generateObjectId = () => {
  return Array.from({ length: 24 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

class Schema {
  constructor(definition, options = {}) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.statics = {};
    this.pres = {};
  }

  pre(hookName, fn) {
    if (!this.pres[hookName]) {
      this.pres[hookName] = [];
    }
    this.pres[hookName].push(fn);
  }

  index(fields, options) {
    // No-op for mock
  }
}

// Support Schema Types
Schema.Types = {
  ObjectId: 'ObjectId'
};

class Query {
  constructor(results, collectionName, ModelClass) {
    this.results = results;
    this.collectionName = collectionName;
    this.ModelClass = ModelClass;
  }

  select(fields) {
    // Basic select simulation (no-op or basic exclusion)
    if (typeof fields === 'string' && fields.startsWith('-')) {
      const fieldToRemove = fields.slice(1);
      this.results = this.results.map(doc => {
        const copy = { ...doc };
        delete copy[fieldToRemove];
        return copy;
      });
    }
    return this;
  }

  sort(sortOption) {
    if (!sortOption) return this;
    const key = Object.keys(sortOption)[0];
    const order = sortOption[key]; // 1 or -1
    
    this.results.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      // Handle date comparisons
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (valA < valB) return order === 1 ? -1 : 1;
      if (valA > valB) return order === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(n) {
    this.results = this.results.slice(0, n);
    return this;
  }

  populate(field, selectFields) {
    // Simulates population of references
    if (field === 'user' && this.collectionName === 'transactions') {
      this.results = this.results.map(tx => {
        const userDoc = db.users.find(u => u._id.toString() === tx.user?.toString());
        if (userDoc) {
          const userPopulated = {
            _id: userDoc._id,
            username: userDoc.username,
            email: userDoc.email
          };
          return { ...tx, user: userPopulated };
        }
        return tx;
      });
    }
    return this;
  }

  // Thenable interface to allow direct awaiting of the query
  then(onResolve, onReject) {
    const instantiated = this.results.map(r => new this.ModelClass(r));
    return Promise.resolve(instantiated).then(onResolve, onReject);
  }

  catch(onReject) {
    return Promise.resolve(this.results).catch(onReject);
  }
}

const getCollection = (modelName) => {
  const name = modelName.toLowerCase() + 's';
  if (!db[name]) {
    db[name] = [];
  }
  return db[name];
};

const compileModel = (name, schema) => {
  const collection = getCollection(name);

  class Document {
    constructor(data = {}) {
      // Load schema defaults
      Object.keys(schema.definition).forEach(key => {
        const fieldDef = schema.definition[key];
        if (fieldDef && fieldDef.default !== undefined) {
          this[key] = typeof fieldDef.default === 'function' ? fieldDef.default() : fieldDef.default;
        }
      });

      // Load passed data
      Object.assign(this, data);
      
      this._id = data._id || generateObjectId();
      this.id = this._id.toString();

      // Attach methods from schema
      Object.keys(schema.methods).forEach(methodName => {
        this[methodName] = schema.methods[methodName].bind(this);
      });
    }

    isModified(field) {
      // Simple simulation: always true if field exists
      return this[field] !== undefined;
    }

    async save() {
      // Execute pre-save hooks (e.g. password hashing)
      if (schema.pres['save']) {
        for (const hook of schema.pres['save']) {
          await new Promise(async (resolve, reject) => {
            let resolved = false;
            const nextCb = (err) => {
              if (resolved) return;
              resolved = true;
              if (err) reject(err);
              else resolve();
            };

            try {
              const res = hook.call(this, nextCb);
              if (res && typeof res.then === 'function') {
                await res;
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              }
            } catch (err) {
              reject(err);
            }
          });
        }
      }

      this.updatedAt = new Date();
      if (!this.createdAt) {
        this.createdAt = new Date();
      }

      // Convert mongoose refs to strings for comparisons
      if (this.user && typeof this.user === 'object' && this.user._id) {
        this.user = this.user._id;
      }

      // Save to our array
      const idx = collection.findIndex(item => item._id.toString() === this._id.toString());
      
      // Plain object copy to simulate DB persistence
      const plainDoc = JSON.parse(JSON.stringify(this));
      plainDoc._id = this._id; // keep object ID type similarity
      if (this.createdAt) plainDoc.createdAt = this.createdAt;
      if (this.updatedAt) plainDoc.updatedAt = this.updatedAt;

      if (idx > -1) {
        collection[idx] = plainDoc;
      } else {
        collection.push(plainDoc);
      }

      return this;
    }
  }

  // Model static queries
  class Model extends Document {
    static async create(data) {
      const doc = new Model(data);
      await doc.save();
      return doc;
    }

    static async countDocuments(query = {}) {
      const filtered = Model._filter(query);
      return filtered.length;
    }

    static async insertMany(docs = []) {
      const instances = docs.map(d => new Model(d));
      for (const inst of instances) {
        await inst.save();
      }
      return instances;
    }

    static find(query = {}) {
      const filtered = Model._filter(query);
      return new Query(filtered, name.toLowerCase() + 's', Model);
    }

    static findOne(query = {}) {
      const filtered = Model._filter(query);
      const res = filtered[0] ? new Model(filtered[0]) : null;
      
      // Make findOne chainable too
      return {
        select: function(fields) {
          if (res && typeof fields === 'string' && fields.startsWith('-')) {
            delete res[fields.slice(1)];
          }
          return this;
        },
        then: function(resolve) { return Promise.resolve(resolve(res)); }
      };
    }

    static findById(id) {
      const doc = collection.find(item => item._id.toString() === id?.toString());
      const res = doc ? new Model(doc) : null;
      return {
        select: function(fields) {
          if (res && typeof fields === 'string' && fields.slice(1)) {
            delete res[fields.slice(1)];
          }
          return this;
        },
        then: function(resolve) { return Promise.resolve(resolve(res)); }
      };
    }

    static async findOneAndDelete(query = {}) {
      const filtered = Model._filter(query);
      if (filtered.length > 0) {
        const target = filtered[0];
        const idx = collection.findIndex(item => item._id.toString() === target._id.toString());
        if (idx > -1) {
          collection.splice(idx, 1);
        }
        return new Model(target);
      }
      return null;
    }

    static async findOneAndUpdate(query = {}, update = {}) {
      const filtered = Model._filter(query);
      if (filtered.length > 0) {
        const target = filtered[0];
        const idx = collection.findIndex(item => item._id.toString() === target._id.toString());
        if (idx > -1) {
          const doc = new Model(collection[idx]);
          
          // Apply basic update operations ($set, etc. or plain extend)
          if (update.$set) {
            Object.assign(doc, update.$set);
          } else if (update.$pull) {
            // Mock pull (array remove)
            const key = Object.keys(update.$pull)[0];
            const filterVal = update.$pull[key];
            if (Array.isArray(doc[key])) {
              doc[key] = doc[key].filter(item => {
                if (typeof filterVal === 'object' && filterVal.symbol) {
                  return item.symbol !== filterVal.symbol;
                }
                return item !== filterVal;
              });
            }
          } else {
            Object.assign(doc, update);
          }

          await doc.save();
          return doc;
        }
      }
      return null;
    }

    static _filter(query = {}) {
      return collection.filter(item => {
        for (const key of Object.keys(query)) {
          const queryVal = query[key];

          // Simulate $or
          if (key === '$or' && Array.isArray(queryVal)) {
            let matched = false;
            for (const subQuery of queryVal) {
              if (Model._matchItem(item, subQuery)) matched = true;
            }
            if (!matched) return false;
            continue;
          }

          // Simulate $in
          if (queryVal && typeof queryVal === 'object' && queryVal.$in) {
            const list = queryVal.$in;
            if (!list.includes(item[key])) return false;
            continue;
          }

          // Simulate $regex search
          if (queryVal && typeof queryVal === 'object' && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, queryVal.$options || '');
            if (!regex.test(item[key])) return false;
            continue;
          }

          // Normal matches
          if (item[key] !== queryVal) {
            // check string versions of ObjectIds/ids
            if (item[key]?.toString() === queryVal?.toString()) {
              continue;
            }
            return false;
          }
        }
        return true;
      });
    }

    static _matchItem(item, subQuery) {
      for (const key of Object.keys(subQuery)) {
        if (item[key] === subQuery[key]) return true;
        if (item[key]?.toString() === subQuery[key]?.toString()) return true;
      }
      return false;
    }
  }

  return Model;
};

const mongooseMock = {
  Schema,
  connect: async (uri) => {
    console.log('MOCK DATABASE: Connected to virtual in-memory store.');
    return { connection: { host: 'IN-MEMORY-MOCK-DB' } };
  },
  disconnect: async () => {
    console.log('MOCK DATABASE: Disconnected from virtual in-memory store.');
    return true;
  },
  model: (name, schema) => {
    return compileModel(name, schema);
  },
  Types: {
    ObjectId: (id) => id || generateObjectId()
  }
};

module.exports = mongooseMock;
