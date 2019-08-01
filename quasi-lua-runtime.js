function Table() {
  // Map from ES Harmony is a simple dictionary-style collection.
  this.map = new Map;
}

Table.prototype = {
  load: function (key) { return this.map.get(key); },
  store: function (key, value) { this.map.set(key, value); }
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
