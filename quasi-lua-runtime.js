var ROOT_KLASS = new Klass("fast");

function Table() {
  /*
  (legacy) Map from ES Harmony is a simple dictionary-style collection.
  this.map = new Map;  
  */
  
  this.klass = ROOT_KLASS;
  this.properties = []; // named-props
  this.elements = []; // index props
}

Table.prototype = {
  load: function (key) { 
    /* (legacy) return this.map.get(key); */ 
    if(this.klass.kind === "slow") {
      return this.properties.get(key); 
    }
    
    if(typeof key === "number" && (key | 0 === key)) {
      return this.elements[key];

    } else if(typeof key === "string") {
      var index = this.findPropertyForRead(key);
      return (index >=0) ? this.properties[index] : void 0;
    }

    return void 0;
  },

  store: function (key, value) { 
    /* (legacy) this.map.set(key, value); */
    if(this.klass.kind === "slow") {
      this.properties.set(key, value);
      return;
    }
    if(typeof key === "number" && (key | 0 === key)) {
      this.elements[key] = value;
      return;
    } else if(typeof key === "string") {
      var index = this.findPropertyForWrite(key);
      if(index >= 0) {
        this.properties[index] = value;
        return;
      }
    }
    
    this.convertToSlow();
    this.store(key, value);
  },

  convertToSlow: function() {
    var map = new Map;
    for(var i = 0; i < this.klass.keys.length ; i++) {
      var key = this.klass.keys[i];
      var val = this.klass.properties[i];
      map.set(key,val);
    }

    Object.keys(this.elements).forEach(function (key) {
      var val = this.elements[key];
      map.set(key | 0, val);
    }, this);

    this.klass = new Klass("slow");
    this.properties = map;
    this.elements = null;

  },

  findPropertyForRead: function (key) {
    if(!this.klass.hasProperty(key)) return -1;
    var desc = this.klass.getDescriptor(key);
    if(!(desc instanceof Property)) return -1;
    return desc.index;
  },

  findPropertyForWrite: function (key) {
    if(!this.klass.hasProperty(key)) {
      if(this.klass.keys.length > 20) return -1;

      this.klass = this.klass.addProperty(key);
      return this.klass.getIndex(key);
    }

    var desc = this.klass.getDescriptor(key);
    if(desc instanceof Transition) {
      this.klass = desc.klass;
      return this.klass.getIndex(key);
    }

    return desc.index;

   },

};

function CHECK_TABLE(t) {
  if (!(t instanceof Table)) {
    throw new Error("table expected");
  }
}

function LOAD(t, k) {
  CHECK_TABLE(t);
  return t.load(k);
}

function STORE(t, k, v) {
  CHECK_TABLE(t);
  t.store(k, v);
}

var os = new Table();

STORE(os, 'clock', function () {
  return Date.now() / 1000;
});

function Transition(klass) {
  this.klass = klass;
}

function Property(index) {
  this.index = index;
}

function Klass(kind) {
  this.kind = kind;
  this.descriptors = new Map;
  this.keys = [];
}

Klass.prototype = {
  // adding a new property by creating a new hidden class
  // with the old HC pointing a transition to the new one
  addProperty: function (key) {
    var klass = this.clone();
    klass.append(key);
    this.descriptors.set(key, new Transition(klass)); // added transition after clone
    return klass;
  },

  hasProperty: function (key) {
    return this.descriptors.has(key);
  },

  getDescriptor: function (key) {
    return this.descriptors.get(key);
  },

  getIndex: function (key) {
    return this.getDescriptor(key).index;
  },
  
  // the new hidden class has all the real properties at same offsets
  // except the transition
  clone: function () {
    var klass = new Klass(this.kind);
    klass.keys = this.keys.slice(0);
    for(var i = 0; i < this.keys.length; i++) {
      var key = this.keys[i];
      klass.descriptors.set(key, this.getDescriptor(key));
    }
    return klass;
  },
  
  // adding real properties
  append: function (key) {
    this.keys.push(key);
    this.descriptors.set(key, new Property(this.keys.length - 1));
  },
};
